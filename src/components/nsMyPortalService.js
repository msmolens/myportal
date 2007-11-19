/* nsMyPortalService.js
 * Copyright (C) 2005-2007 Max Smolens
 *
 * This file is part of My Portal.
 *
 * My Portal is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation; either version 2 of the License,
 * or (at your option) any later version.
 *
 * My Portal is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with My Portal; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA
 */

//// Component constants

const MYPORTALSERVICE_NAME = 'My Portal Service';
const MYPORTALSERVICE_CONTRACTID = '@unroutable.org/myportal-service;1';
const MYPORTALSERVICE_CID = Components.ID('{34b0eda1-1917-47bd-9143-b6b3a0f2bcca}');


//// Interface constants

const nsIMyPortalService = Components.interfaces.nsIMyPortalService;
const nsIMyPortalDataSource = Components.interfaces.nsIMyPortalDataSource;
const nsIMyPortalBookmarksObserver = Components.interfaces.nsIMyPortalBookmarksObserver;
const nsIMyPortalHistoryObserver = Components.interfaces.nsIMyPortalHistoryObserver;
const nsIMyPortalNotificationTopicService = Components.interfaces.nsIMyPortalNotificationTopicService;
const nsIMyPortalBookmarksTree = Components.interfaces.nsIMyPortalBookmarksTree;
const nsIMyPortalRenderer = Components.interfaces.nsIMyPortalRenderer;
const nsIMyPortalVisitable = Components.interfaces.nsIMyPortalVisitable;
const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsIMyPortalBookmarkNodeVisitor = Components.interfaces.nsIMyPortalBookmarkNodeVisitor;
const nsIMyPortalBookmarkContainerNode = Components.interfaces.nsIMyPortalBookmarkContainerNode;
const nsIMyPortalRDFService = Components.interfaces.nsIMyPortalRDFService;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIRDFService = Components.interfaces.nsIRDFService;
const nsIStringBundleService = Components.interfaces.nsIStringBundleService;
const nsIObserverService = Components.interfaces.nsIObserverService;
const nsIBookmarksService = Components.interfaces.nsIBookmarksService;
const nsIGlobalHistory2 = Components.interfaces.nsIGlobalHistory2;
const nsIBrowserHistory = Components.interfaces.nsIBrowserHistory;
const nsIPrefService = Components.interfaces.nsIPrefService;
const nsIPrefBranchInternal = Components.interfaces.nsIPrefBranchInternal;
const nsIIOService = Components.interfaces.nsIIOService;
const nsIDOMDocument = Components.interfaces.nsIDOMDocument
const nsIDOMNode = Components.interfaces.nsIDOMNode;
const nsIArray = Components.interfaces.nsIArray;


//// Namespace constants

const XULNS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';


//// Services
// TODO make members of service

var rdfService = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(nsIRDFService);
var stringBundleService = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(nsIStringBundleService);
var observerService = Components.classes['@mozilla.org/observer-service;1'].getService(nsIObserverService);
var preferencesService = Components.classes['@mozilla.org/preferences-service;1'].getService(nsIPrefService);
var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(nsIIOService);


//// Preference globals
// TODO make members of service

var showDescriptionTooltips = null;
var showFavicons = null;
var openLinksNewTabOrWindow = null;
var truncateBookmarkNames = null;
var truncateBookmarkNamesLength = null;
var increaseRecentlyVisitedSize = null;
var automaticallyUpdatePortal = null;


//// RDF Observer

function RDFObserver()
{
        this.enabled = false;
        this.dataSource = null;
        this.observer = null;
}

RDFObserver.prototype =
{
        // Set the data source to observe.
        //
        // dataSource: nsIRDFDataSource
        setDataSource: function(dataSource)
        {
                this.dataSource = dataSource;
        },

        // Set the observer.
        //
        // observer: nsIRDFObserver
        setObserver: function(observer)
        {
                this.observer = observer;
        },

        // Enable observation of the data source
        enable: function()
        {
                if (!this.enabled) {
                        this.dataSource.AddObserver(this.observer);
                        this.enabled = true;
                }
        },

        // Disable observation of the data source
        disable: function()
        {
                if (this.enabled) {
                        this.dataSource.RemoveObserver(this.observer);
                        this.enabled = false;
                }
        }
};



//// nsMyPortalService
// Implements:
// nsIMyPortalService
// nsIObserver
// nsISupports

// Constructor.
function nsMyPortalService()
{
        // Init bookmarks data source
        this.bookmarksDataSource = rdfService.GetDataSource('rdf:bookmarks');

        // Init history data source
        this.historyDataSource = rdfService.GetDataSource('rdf:history');

        // Init My Portal data source
        this.myportalDataSource = Components.classes['@unroutable.org/myportal-datasource;1'].getService(nsIMyPortalDataSource);

        // Init history services
        this.globalHistoryService = Components.classes['@mozilla.org/browser/global-history;2'].getService(nsIGlobalHistory2);
        this.browserHistoryService = this.globalHistoryService.QueryInterface(nsIBrowserHistory);

        // Load bookmarks
        var bookmarksService = this.bookmarksDataSource.QueryInterface(nsIBookmarksService);
        bookmarksService.readBookmarks();

        // Init preferences service
        this.prefs = preferencesService.getBranch('myportal.');
        this.prefsInternal = this.prefs.QueryInterface(nsIPrefBranchInternal);

        // Load global preferences
        this.loadGlobalPreferences();

        // Init document title strings
        this.stringBundle = stringBundleService.createBundle('chrome://myportal/locale/myportal.properties');
        this.titlePrefix = this.stringBundle.GetStringFromName('title.prefix');
        this.titleFolderNotFound = this.stringBundle.GetStringFromName('title.folderNotFound') ;

        // Init bookmarks tree
        this.bookmarksTree = Components.classes['@unroutable.org/myportal-bookmarks-tree;1'].createInstance(nsIMyPortalBookmarksTree);

        // Init bookmarks observer
        this.initBookmarksObserver();

        // Init history observer
        this.initHistoryObserver();

        // Init notification topics
        var topicService = Components.classes['@unroutable.org/myportal-notification-topic-service;1'].getService(nsIMyPortalNotificationTopicService);
        this.bookmarksObserverNotifyTopic = topicService.topic('bookmarksObserverNotify');
        this.bookmarksObserverUpdatedTopic = topicService.topic('bookmarksObserverUpdated');
        this.bookmarksObserverStructureUpdatedTopic = topicService.topic('bookmarksObserverStructureUpdated');
        this.historyObserverUpdatedTopic = topicService.topic('historyObserverUpdated');
        this.livemarkUpdateEndedNoFadeTopic = topicService.topic('livemarkUpdateEndedNoFade');
        this.forceRefreshTopic = topicService.topic('forceRefresh');
        this.bookmarkUpdatedTopic = topicService.topic('bookmarkUpdated');
        this.bookmarkStructureUpdatedTopic = topicService.topic('bookmarkStructureUpdated');
        this.shutdownTopic = topicService.topic('shutdown');

        // Observe bookmark changes
        this.bookmarksObserver.enable();
        this.historyObserver.enable();
        observerService.addObserver(this, this.bookmarksObserverNotifyTopic, false);
        observerService.addObserver(this, this.bookmarksObserverUpdatedTopic, false);
        observerService.addObserver(this, this.bookmarksObserverStructureUpdatedTopic, false);
        observerService.addObserver(this, this.historyObserverUpdatedTopic, false);

        // Observe application quit
        observerService.addObserver(this, this.shutdownTopic, false);

        // Observe preferences changes
        this.prefsInternal.addObserver('', this, false);
}

nsMyPortalService.prototype =
{
        // Unloads My Portal Service.
        unload: function()
        {
                this.bookmarksObserver.disable();
                this.historyObserver.disable();
                this.myportalDataSource.flush();
                observerService.removeObserver(this, this.bookmarksObserverNotifyTopic);
                observerService.removeObserver(this, this.bookmarksObserverUpdatedTopic);
                observerService.removeObserver(this, this.bookmarksObserverStructureUpdatedTopic);
                observerService.removeObserver(this, this.historyObserverUpdatedTopic);
                observerService.removeObserver(this, this.shutdownTopic);
                this.prefsInternal.removeObserver('', this);
        },


        initBookmarksObserver: function()
        {
                var observer = Components.classes['@unroutable.org/myportal-bookmarks-observer;1'].createInstance(nsIMyPortalBookmarksObserver);
                observer.setDelay(1000);

                this.bookmarksObserver = new RDFObserver();
                this.bookmarksObserver.setDataSource(this.bookmarksDataSource);
                this.bookmarksObserver.setObserver(observer);
        },

        initHistoryObserver: function()
        {
                var observer = Components.classes['@unroutable.org/myportal-history-observer;1'].createInstance(nsIMyPortalHistoryObserver);
                this.historyObserver = new RDFObserver();
                this.historyObserver.setDataSource(this.historyDataSource);
                this.historyObserver.setObserver(observer);
        },


        //// DOM creation methods

        // Creates bookmarks tree.
        //
        // parentNode: DOM node in which to insert the tree
        // nodeId: root bookmark node's id
        createDOMBookmarksTree: function(parentDOMNode,
                                         nodeId)
        {
                var document = parentDOMNode.ownerDocument;
                var documentTitle = this.titlePrefix;
                var pathNodeIds = null;

                // Render tree
                var documentFragment = document.createDocumentFragment();
                var node = this.bookmarksTree.findFolderById(nodeId);
                if (node instanceof nsIMyPortalVisitable &&
                    document instanceof nsIDOMDocument &&
                    documentFragment instanceof nsIDOMNode) {

                        // TODO refactor
                        var renderer = Components.classes['@unroutable.org/myportal-renderer;1'].createInstance(nsIMyPortalRenderer);
                        document = document.QueryInterface(nsIDOMDocument);
                        documentFragment = documentFragment.QueryInterface(nsIDOMNode);
                        renderer.init(document, documentFragment, true);
                        renderer.setBoolProperty('showDescriptionTooltips', showDescriptionTooltips);
                        renderer.setBoolProperty('showFavicons', showFavicons);
                        renderer.setBoolProperty('openLinksNewTabOrWindow', openLinksNewTabOrWindow);
                        renderer.setBoolProperty('truncateBookmarkNames', truncateBookmarkNames);
                        renderer.setIntProperty('truncateBookmarkNamesLength', truncateBookmarkNamesLength);
                        renderer.setBoolProperty('increaseRecentlyVisitedSize', increaseRecentlyVisitedSize);
                        renderer.QueryInterface(nsIMyPortalBookmarkNodeVisitor);
                        node.accept(renderer);

                        documentTitle += renderer.title;
                        pathNodeIds = renderer.pathNodeIds;
                } else {
                        // Render error message
                        documentFragment.appendChild(this.createErrorMessage(document));
                        documentTitle = this.titleFolderNotFound;
                }

                // Set document title
                document.title = documentTitle;

                // Append document fragment
                parentDOMNode.appendChild(documentFragment);

                return pathNodeIds;
        },

        // Updates a single bookmark DOM node.
        //
        // node: DOM node
        // nodeId: bookmark node id
        // isPortalRoot: true if node is in portal's path
        updateDOMNode: function(node,
                                nodeId,
                                isPortalRoot)
        {
                // Find bookmark node
                var bookmarkNode = this.bookmarksTree.findById(nodeId);
                var document = node.ownerDocument;
                var documentFragment = document.createDocumentFragment();

                // Re-render node
                // TODO refactor
                var renderer = Components.classes['@unroutable.org/myportal-renderer;1'].createInstance(nsIMyPortalRenderer);
                renderer.init(document, documentFragment, isPortalRoot);
                renderer.setBoolProperty('showDescriptionTooltips', showDescriptionTooltips);
                renderer.setBoolProperty('showFavicons', showFavicons);
                renderer.setBoolProperty('openLinksNewTabOrWindow', openLinksNewTabOrWindow);
                renderer.setBoolProperty('truncateBookmarkNames', truncateBookmarkNames);
                renderer.setIntProperty('truncateBookmarkNamesLength', truncateBookmarkNamesLength);
                renderer.setBoolProperty('increaseRecentlyVisitedSize', increaseRecentlyVisitedSize);
                if (bookmarkNode instanceof nsIMyPortalVisitable &&
                    renderer instanceof nsIMyPortalBookmarkNodeVisitor) {
                        bookmarkNode.accept(renderer);
                }

                return documentFragment;
        },

        // Re-renders links an array of links.
        // My Portal calls this occasionally to age links.
        //
        // This is an optimization to avoid excessive bookmarks tree
        // searches; My Portal could call updateDOMNode for each link
        // instead.
        //
        // count: array size (required by xpidl)
        // links: array of DOM links
        updateVisitedLinks: function(count,
                                     links)
        {
                if (increaseRecentlyVisitedSize && links.length) {

                        // Store (DOM link, BookmarkNode) pairs indexed by id
                        var nodes = new Object();
                        links.forEach(function(link) {
                                nodes[link.id] = {link: link,
                                                  node: null};
                        });

                        // Populate node field
                        // TODO
//                        this.bookmarksTree.findByIds(nodes);

                        // Use document from first link
                        var document = links[0].ownerDocument;
                        var documentFragment = document.createDocumentFragment();

                        // Re-render links
                        var obj = null;
                        for (var id in nodes) {
                                obj = nodes[id];
                                if (obj.node) {

                                        // TODO refactor
                                        var renderer = Components.classes['@unroutable.org/myportal-renderer;1'].createInstance(nsIMyPortalRenderer);
                                        renderer.init(document, documentFragment, false);
                                        obj.node.accept(renderer);

                                        // New link is documentFragment's first child
                                        obj.link.parentNode.replaceChild(documentFragment.firstChild, obj.link);

                                        // Clear documentFragment
                                        while (documentFragment.hasChildNodes()){
                                                documentFragment.removeChild(documentFragment.firstChild);
                                        }
                                }
                        }
                }
        },

        // Returns an error message that says the folder cannot be found.
        createErrorMessage: function(document)
        {
                const errorMessageClass = 'errorMessage';
                const errorMessageIconClass = 'errorMessageIcon';
                const errorMessageTitleClass = 'errorMessageTitle';
                const errorMessageDescriptionClass = 'errorMessageDescription';

                // Create error message container
                var message = document.createElement('div');

                // Create icon
                var iconContainer = document.createElement('div');
                var icon = document.createElementNS(XULNS, 'image');
                iconContainer.className = errorMessageIconClass;
                iconContainer.appendChild(icon);
                message.appendChild(iconContainer);

                // Create text container
                var textContainer = document.createElement('div');
                textContainer.className = errorMessageClass;

                // Create title
                var title = document.createElement('div');
                title.className = errorMessageTitleClass;
                title.appendChild(document.createTextNode(this.stringBundle.GetStringFromName('error.notFound.title')));
                textContainer.appendChild(title);

                // Create description
                var description = document.createElement('div');
                description.className = errorMessageDescriptionClass;
                description.appendChild(document.createTextNode(this.stringBundle.GetStringFromName('error.notFound.description')));
                textContainer.appendChild(description);

                message.appendChild(textContainer);
                return message;
        },


        //// Livemark methods

        // Marks a livemark's contents as read.
        //
        // nodeId: livemark id
        markLivemarkAsRead: function(nodeId)
        {
                this.markLivemark(nodeId, this.addURL);
        },

        // Marks a livemark's contents as unread.
        //
        // nodeId: livemark id
        markLivemarkAsUnread: function(nodeId)
        {
                this.markLivemark(nodeId, this.removeURL);
        },

        // Marks a livemark's contents as read or unread, depending on function argument.
        //
        // nodeId: livemark id
        // markFunction: URL history add or remove function
        markLivemark: function(nodeId,
                               markFunction)
        {
                // Verify that livemark is not empty
                var node = this.bookmarksTree.findFolderById(nodeId);
                // FIXME TEMP
                if (node && (node instanceof nsIMyPortalBookmarkContainerNode) && node.children.length) {

                        // Disable history observer to avoid updating each link separately
                        this.historyObserver.disable();

                        // Add livemarks to history
                        var children = node.children.enumerate();
                        while (children.hasMoreElements()) {
                                let child = children.getNext();
                                if ((child instanceof nsIMyPortalBookmarkNode) &&
                                    !(child instanceof nsIMyPortalBookmarkContainerNode)) {
                                        markFunction.call(this, child.url);
                                }
                        }

                        // Re-enable history observer
                        this.historyObserver.enable();

                        // Redraw
                        observerService.notifyObservers(this, this.livemarkUpdateEndedNoFadeTopic, nodeId);
                }
        },

        // Refreshes a livemark.
        // Adapted from browser/components/content/bookmarks.js
        //
        // nodeId: livemark id
        refreshLivemark: function(nodeId)
        {
                var myportalRDFService = Components.classes['@unroutable.org/myportal-rdf-service;1'].getService(nsIMyPortalRDFService);
                var rdfExpiration = myportalRDFService.rdfResource('livemarkExpiration');
                var resource = rdfService.GetResource(nodeId);
                var oldTarget = this.bookmarksDataSource.GetTarget(resource, rdfExpiration, true);
                if (oldTarget) {
                        this.bookmarksDataSource.Unassert(resource, rdfExpiration, oldTarget);
                }
        },


        //// Bookmark information methods

        // Returns id of deepest folder in path.
        //
        // bookmarksPath: path not including root bookmark node name
        getIdForPath: function(bookmarksPath)
        {
                // Insert root bookmark name
                var fullBookmarksPath = encodeURIComponent(this.bookmarksTree.rootName) + '/' + bookmarksPath;
                var id = '';
                var folder = this.bookmarksTree.findFolderByPath(fullBookmarksPath);
                if (folder) {
                        id = folder.id;
                }
                return id;
        },

        // Returns href for a bookmark folder.
        //
        // nodeId: bookmark folder id
        getHrefForId: function(nodeId)
        {
                var node = this.bookmarksTree.findFolderById(nodeId);
                return node.href;
        },

        // Returns URL for a bookmark.
        //
        // nodeId: bookmark id
        getURLForId: function(nodeId)
        {
                var node = this.bookmarksTree.findById(nodeId);
                if (node) {
                        return node.url;
                }
                return '';
        },

        // Returns list of bookmarks with a particular URL.
        //
        // url: bookmark URL
        getIdsForURL: function(url)
        {
                return this.bookmarksTree.findByURL(url);
        },


        //// History methods

        // Adds a URL to history.
        //
        // url: URL
        addURL: function(url)
        {
                var uri = ioService.newURI(url, null, null);
                if (!this.globalHistoryService.isVisited(uri)) {
                        this.globalHistoryService.addURI(uri, false, true, null);
                }
        },

        // Removes a URL from history.
        //
        // url: URL
        removeURL: function(url)
        {
                var uri = ioService.newURI(url, null, null);
                this.browserHistoryService.removePage(uri);
        },


        //// GUI methods

        // Toggles a bookmark folder's collapsed state.
        //
        // This looks at the actual folder node that was clicked
        // instead of simply querying the data source, because
        // multiple myportal:// pages open simultaneously can display
        // a different collapsed state for the same folder.  The most
        // recently toggled state is saved in the data source.
        //
        // node: clicked node
        // folderNode: bookmark folder node
        // nodeId: bookmark folder id
        toggleCollapsed: function(node, folderNode, nodeId)
        {
                var collapsed = this.isCollapsed(folderNode);
                this.setCollapsed(node, folderNode, !collapsed);
                this.myportalDataSource.setCollapsed(nodeId, !collapsed);
        },

        // Returns true if a bookmark folder is collapsed.
        //
        // node: bookmark folder node
        isCollapsed: function(node)
        {
                var display = node.style.display;
                var collapsed = display && display == 'none';
                return collapsed;
        },

        // Sets a bookmark folder's collapsed state.
        //
        // node: clicked node
        // folderNode: bookmark folder node
        // collapsed: collapsed state
        setCollapsed: function(node,
                               folderNode,
                               collapsed)
        {
                node.setAttribute('collapsed', collapsed ? 'true': 'false');
                folderNode.style.display = collapsed ? 'none' : 'block';
        },

        //// Preference methods

        get showDescriptionTooltips() {
                return this.prefs.getBoolPref('showDescriptionTooltips');
        },

        get showFavicons() {
                return this.prefs.getBoolPref('showFavicons');
        },

        get openLinksNewTabOrWindow() {
                return this.prefs.getBoolPref('openLinksNewTabOrWindow');
        },

        get truncateBookmarkNames() {
                return this.prefs.getBoolPref('truncateBookmarkNames');
        },

        get truncateBookmarkNamesLength() {
                return this.prefs.getIntPref('truncateBookmarkNamesLength');
        },

        get increaseRecentlyVisitedSize() {
                return this.prefs.getBoolPref('increaseRecentlyVisitedSize');
        },

        get automaticallyUpdatePortal() {
                return this.prefs.getBoolPref('automaticallyUpdatePortal');
        },

        // Loads global preferences.
        loadGlobalPreferences: function()
        {
                showDescriptionTooltips = this.showDescriptionTooltips;
                showFavicons = this.showFavicons;
                openLinksNewTabOrWindow = this.openLinksNewTabOrWindow;
                truncateBookmarkNames = this.truncateBookmarkNames;
                truncateBookmarkNamesLength = this.truncateBookmarkNamesLength;
                increaseRecentlyVisitedSize = this.increaseRecentlyVisitedSize;
                automaticallyUpdatePortal = this.automaticallyUpdatePortal;
        },

        // Handles preference changes.
        //
        // name: changed preference
        handlePreferenceChange: function(name)
        {
                this.loadGlobalPreferences();
                if (name == 'showDescriptionTooltips' ||
                    name == 'showFavicons' ||
                    name == 'openLinksNewTabOrWindow' ||
                    name == 'truncateBookmarkNames' ||
                    name == 'truncateBookmarkNamesLength' ||
                    name == 'increaseRecentlyVisitedSize') {

                        // Force reload
                        observerService.notifyObservers(this, this.forceRefreshTopic, null);
                }
        },


        //// nsIObserver methods

        observe: function(subject,
                          topic,
                          data)
        {
                if (topic == this.bookmarksObserverNotifyTopic) {
                        dump(topic + '\n');
                        this.bookmarksTree.dirty = true;
                } else if (topic == this.bookmarksObserverUpdatedTopic) {
                        dump(topic + ' ' + data + '\n');
                        this.bookmarksTree.dirty = true;
                        if (automaticallyUpdatePortal) {
                                // data: id
                                observerService.notifyObservers(this, this.bookmarkUpdatedTopic, data);
                        }
                } else if (topic == this.bookmarksObserverStructureUpdatedTopic) {
                        dump(topic + '\n');
                        this.bookmarksTree.dirty = true;
                        if (automaticallyUpdatePortal) {
                                // data: id
                                observerService.notifyObservers(this, this.bookmarkStructureUpdatedTopic, data);
                        }
                } else if (topic == this.historyObserverUpdatedTopic) {
                        // data: URL
                        let nodes = this.getIdsForURL(data);
                        if (nodes) {
                                let it = nodes.enumerate();
                                if (it.hasMoreElements()) {
                                        // TODO necessary?
//                                        this.bookmarksTree.dirty = true;
                                        do {
                                                let node = it.getNext();
                                                if (node instanceof nsIMyPortalBookmarkNode) {
                                                        dump('notify: ' + node.id +'\n');
                                                        observerService.notifyObservers(this, this.bookmarkUpdatedTopic, node.id);
                                                }
                                        } while (it.hasMoreElements());
                                }
                        }
                } else if (topic == 'nsPref:changed') {
                        // data: preference name
                        this.handlePreferenceChange(data);
                } else if (topic == this.shutdownTopic) {
                        this.unload();
                }
        },


        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsIMyPortalService) &&
                    !iid.equals(nsISupports)) {
                            throw Components.results.NS_ERROR_NO_INTERFACE;
                    }
                return this;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalServiceModule =
{
        firstTime: true,

        registerSelf: function(compMgr,
                               fileSpec,
                               location,
                               type)
        {
                if (this.firstTime) {
                        this.firstTime = false;
                        throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
                }
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.registerFactoryLocation(MYPORTALSERVICE_CID,
                                                MYPORTALSERVICE_NAME,
                                                MYPORTALSERVICE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALSERVICE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALSERVICE_CID)) {
                        throw Components.results.NS_ERROR_NO_INTERFACE;
                }
                if (!iid.equals(nsIFactory)) {
                        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
                }
                return this.myFactory;
        },

        myFactory:
        {
                createInstance: function(outer,
                                         iid)
                {
                        if (outer != null) {
                                throw Components.results.NS_ERROR_NO_AGGREGATION;
                        }
                        return (new nsMyPortalService()).QueryInterface(iid);
                }
        },

        canUnload: function(compMgr)
        {
                return true;
        }
};

// XPCOM module entry point
function NSGetModule(compMgr,
                     fileSpec)
{
        return nsMyPortalServiceModule;
}
