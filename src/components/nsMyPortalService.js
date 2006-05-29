/* nsMyPortalService.js
 * Copyright (C) 2005 Max Smolens
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

const MYPORTALSERVICE_NAME = 'My Portal';
const MYPORTALSERVICE_CONTRACTID = '@unroutable.org/myportal-service;1';
const MYPORTALSERVICE_CID = Components.ID('{34b0eda1-1917-47bd-9143-b6b3a0f2bcca}');


//// Interface constants

const nsISupports = Components.interfaces.nsISupports;
const nsIMyPortalService = Components.interfaces.nsIMyPortalService;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsITimer = Components.interfaces.nsITimer;
const nsIRDFService = Components.interfaces.nsIRDFService;
const nsIRDFContainer = Components.interfaces.nsIRDFContainer;
const nsIRDFContainerUtils = Components.interfaces.nsIRDFContainerUtils;
const nsIRDFDataSource = Components.interfaces.nsIRDFDataSource;
const nsIRDFRemoteDataSource = Components.interfaces.nsIRDFRemoteDataSource;
const nsIStringBundleService = Components.interfaces.nsIStringBundleService;
const nsIRDFResource = Components.interfaces.nsIRDFResource;
const nsIRDFLiteral = Components.interfaces.nsIRDFLiteral;
const nsIRDFDate = Components.interfaces.nsIRDFDate;
const nsIObserverService = Components.interfaces.nsIObserverService;
const nsIBookmarksService = Components.interfaces.nsIBookmarksService;
const nsIGlobalHistory2 = Components.interfaces.nsIGlobalHistory2;
const nsIBrowserHistory = Components.interfaces.nsIBrowserHistory;
const nsIIOService = Components.interfaces.nsIIOService;
const nsIPrefService = Components.interfaces.nsIPrefService;
const nsIPrefBranchInternal = Components.interfaces.nsIPrefBranchInternal;
const nsIProperties = Components.interfaces.nsIProperties;
const nsILocalFile = Components.interfaces.nsILocalFile;
const nsIFileProtocolHandler = Components.interfaces.nsIFileProtocolHandler;


//// Namespace constants

const NCNS = 'http://home.netscape.com/NC-rdf#';
const WEBNS = 'http://home.netscape.com/WEB-rdf#';
const RDFNS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const HTMLNS = 'http://www.w3.org/1999/xhtml';
const XULNS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
const MYPORTALNS = 'http://www.unroutable.org/rdf';


//// Notification topics

const livemarkUpdateEndedTopic = 'myportal-livemark-update-ended'; // matches value in MyPortalLivemarkUpdater
const livemarkUpdateEndedNoFadeTopic = 'myportal-livemark-update-ended-nofade'; // matches value in MyPortalLivemarkUpdater
const bookmarkUpdatedTopic = 'myportal-bookmark-updated'; // matches value in myportal.js
const bookmarkStructureUpdatedTopic = 'myportal-bookmark-structure-updated'; // matches value in myportal.js
const forceRefreshTopic = 'myportal-force-refresh'; // matches value in myportal.js
const bookmarksObserverNotifyTopic = 'myportal-bookmarksobserver-notify';
const bookmarksObserverUpdatedTopic = 'myportal-bookmarksobserver-updated';
const bookmarksObserverStructureUpdatedTopic = 'myportal-bookmarksobserver-structure-updated';
const historyObserverUpdatedTopic = 'myportal-historyobserver-updated';
const shutdownTopic = 'xpcom-shutdown';


//// Data sources

var myportalDataSource = null;
var bookmarksDataSource = null;
var historyDataSource = null;


//// Services

var myportalService = null;
var rdfService = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(nsIRDFService);
var containerUtils = Components.classes['@mozilla.org/rdf/container-utils;1'].getService(nsIRDFContainerUtils);
var stringBundleService = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(nsIStringBundleService);
var observerService = Components.classes['@mozilla.org/observer-service;1'].getService(nsIObserverService);
var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(nsIIOService);
var globalHistoryService = Components.classes['@mozilla.org/browser/global-history;2'].getService(nsIGlobalHistory2);
var browserHistoryService = Components.classes['@mozilla.org/browser/global-history;2'].getService(nsIBrowserHistory);
var preferencesService = Components.classes['@mozilla.org/preferences-service;1'].getService(nsIPrefService);
var directoryService = Components.classes['@mozilla.org/file/directory_service;1'].getService(nsIProperties);


//// RDF resources

var RDF_BOOKMARKS_ROOT = rdfService.GetResource('NC:BookmarksRoot');
var RDF_HISTORY_ROOT = rdfService.GetResource('NC:HistoryRoot');
var RDF_ID = rdfService.GetResource(NCNS + 'ID');
var RDF_NAME = rdfService.GetResource(NCNS + 'Name');
var RDF_URL = rdfService.GetResource(NCNS + 'URL');
var RDF_DESCRIPTION = rdfService.GetResource(NCNS + 'Description');
var RDF_FOLDER = rdfService.GetResource(NCNS + 'Folder');
var RDF_BOOKMARK = rdfService.GetResource(NCNS + 'Bookmark');
var RDF_LIVEMARK = rdfService.GetResource(NCNS + 'Livemark');
var RDF_LIVEMARKEXPIRATION = rdfService.GetResource(NCNS + 'LivemarkExpiration');
var RDF_BOOKMARKSEPARATOR = rdfService.GetResource(NCNS + 'BookmarkSeparator');
var RDF_ICON = rdfService.GetResource(NCNS + 'Icon');
var RDF_TYPE = rdfService.GetResource(RDFNS + 'type');
var RDF_SEQ = rdfService.GetResource(RDFNS + 'Seq');
var RDF_LASTVISITDATE = rdfService.GetResource(WEBNS + 'LastVisitDate');
var RDF_DATE = rdfService.GetResource(NCNS + 'Date');
var RDF_CHILD = rdfService.GetResource(NCNS + 'child');
var RDF_LASTMODIFIEDDATE = rdfService.GetResource(WEBNS + 'LastModifiedDate');
var RDF_MYPORTAL_COLLAPSED_ROOT = rdfService.GetResource(MYPORTALNS + '/collapsed/all');


//// Preference globals

var showDescriptionTooltips = null;
var showFavicons = null;
var openLinksNewTabOrWindow = null;
var truncateBookmarkNames = null;
var truncateBookmarkNamesLength = null;
var increaseRecentlyVisitedSize = null;
var automaticallyUpdatePortal = null;


/// Miscellaneous globals

var stringBundle = stringBundleService.createBundle('chrome://myportal/locale/myportal.properties');


//// nsMyPortalService
// Implements:
// nsIObserver
// nsISupports

// Constructor.
function nsMyPortalService()
{
        // Init bookmarks data source
        bookmarksDataSource = rdfService.GetDataSource('rdf:bookmarks');

        // Init history data source
        historyDataSource = rdfService.GetDataSource('rdf:history');

        // Init My Portal data source
        myportalDataSource = new MyPortalDataSource();

        // Load bookmarks
        var bookmarksService = bookmarksDataSource.QueryInterface(nsIBookmarksService);
        bookmarksService.readBookmarks();

        // Init preferences service
        this.prefs = preferencesService.getBranch('myportal.');
        this.prefsInternal = this.prefs.QueryInterface(nsIPrefBranchInternal);

        // Load global preferences
        this.loadGlobalPreferences();

        // Init document title strings
        this.titlePrefix = stringBundle.GetStringFromName('title.prefix');
        this.titleFolderNotFound = stringBundle.GetStringFromName('title.folderNotFound') ;

        // Init bookmarks tree
        this.bookmarksTree = new BookmarksTree();

        // Init bookmarks observer
        this.initBookmarksObserver();

        // Init history observer
        this.initHistoryObserver();

        // Observe bookmark changes
        this.bookmarksObserver.enable();
        this.historyObserver.enable();
        observerService.addObserver(this, bookmarksObserverNotifyTopic, false);
        observerService.addObserver(this, bookmarksObserverUpdatedTopic, false);
        observerService.addObserver(this, bookmarksObserverStructureUpdatedTopic, false);
        observerService.addObserver(this, historyObserverUpdatedTopic, false);

        // Observe application quit
        observerService.addObserver(this, shutdownTopic, false);

        // Observe preferences changes
        this.prefsInternal.addObserver('', this, false);

        myportalService = this;
}

nsMyPortalService.prototype =
{
        // Unloads My Portal Service.
        unload: function()
        {
                this.bookmarksObserver.disable();
                this.historyObserver.disable();
                myportalDataSource.flush();
                observerService.removeObserver(this, bookmarksObserverNotifyTopic);
                observerService.removeObserver(this, bookmarksObserverUpdatedTopic);
                observerService.removeObserver(this, bookmarksObserverStructureUpdatedTopic);
                observerService.removeObserver(this, historyObserverUpdatedTopic);
                observerService.removeObserver(this, shutdownTopic);
                this.prefsInternal.removeObserver('', this);
        },

        // Inits bookmarks observer.
        initBookmarksObserver: function()
        {
                this.bookmarksObserver = new myportalBookmarksObserver();
                this.bookmarksObserver.enable = function()
                {
                        bookmarksDataSource.AddObserver(this);
                };
                this.bookmarksObserver.disable = function()
                {
                        bookmarksDataSource.RemoveObserver(this);
                };
        },

        // Inits history observer.
        initHistoryObserver: function()
        {
                this.historyObserver = new myportalHistoryObserver();
                this.historyObserver.enable = function()
                {
                        historyDataSource.AddObserver(this);
                };
                this.historyObserver.disable = function()
                {
                        historyDataSource.RemoveObserver(this);
                };
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
                if (node) {
                        node.render(document, documentFragment, true);
                        documentTitle += node.title;
                        pathNodeIds = node.pathNodeIds.join(',');
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
                bookmarkNode.render(document, documentFragment, isPortalRoot);

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
                        this.bookmarksTree.findByIds(nodes);

                        // Use document from first link
                        var document = links[0].ownerDocument;
                        var documentFragment = document.createDocumentFragment();

                        // Re-render links
                        var obj = null;
                        for (var id in nodes) {
                                obj = nodes[id];
                                if (obj.node) {
                                        obj.node.render(document, documentFragment, false);

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
                title.appendChild(document.createTextNode(stringBundle.GetStringFromName('error.notFound.title')));
                textContainer.appendChild(title);

                // Create description
                var description = document.createElement('div');
                description.className = errorMessageDescriptionClass;
                description.appendChild(document.createTextNode(stringBundle.GetStringFromName('error.notFound.description')));
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
                if (node && node.children.length) {

                        // Disable history observer to avoid updating each link separately
                        this.historyObserver.disable();

                        // Add livemarks to history
                        node.children.forEach(function(child) {
                                if (!(child instanceof BookmarkContainerNode)) {
                                        markFunction.call(this, child.url);
                                }
                        }, this);

                        // Re-enable history observer
                        this.historyObserver.enable();

                        // Redraw
                        observerService.notifyObservers(this, livemarkUpdateEndedNoFadeTopic, nodeId);
                }
        },

        // Refreshes a livemark.
        // Adapted from browser/components/content/bookmarks.js
        //
        // nodeId: livemark id
        refreshLivemark: function(nodeId)
        {
                var resource = rdfService.GetResource(nodeId);
                var oldTarget = bookmarksDataSource.GetTarget(resource, RDF_LIVEMARKEXPIRATION, true);
                if (oldTarget) {
                        bookmarksDataSource.Unassert(resource, RDF_LIVEMARKEXPIRATION, oldTarget);
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

        // Returns list of ids of bookmarks with a particular URL.
        //
        // url: bookmark URL
        getIdsForURL: function(url)
        {
                // Get list of bookmarks with the URL
                var nodes = new Array();
                this.bookmarksTree.findByURL(nodes, url);

                // Return list of ids
                var ids = nodes.map(function(node) {
                        return node.id;
                });
                return ids;
        },


        //// History methods

        // Adds a URL to history.
        //
        // url: URL
        addURL: function(url)
        {
                var uri = ioService.newURI(url, null, null);
                if (!globalHistoryService.isVisited(uri)) {
                        globalHistoryService.addURI(uri, false, true, null);
                }
        },

        // Removes a URL from history.
        //
        // url: URL
        removeURL: function(url)
        {
                var uri = ioService.newURI(url, null, null);
                browserHistoryService.removePage(uri);
        },


        //// GUI methods

        // Toggles a bookmark folder's collapsed state.
        //
        // node: clicked node
        // folderNode: bookmark folder node
        // nodeId: bookmark folder id
        toggleCollapsed: function(node, folderNode, nodeId)
        {
                var collapsed = this.isCollapsed(folderNode);
                this.setCollapsed(node, folderNode, !collapsed);
                myportalDataSource.setCollapsed(nodeId, !collapsed);
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
                        observerService.notifyObservers(this, forceRefreshTopic, null);
                }
        },


        //// nsIObserver methods

        observe: function(subject,
                          topic,
                          data)
        {
                if (topic == bookmarksObserverNotifyTopic) {
                        this.bookmarksTree.dirty = true;
                } else if (topic == bookmarksObserverUpdatedTopic) {
                        this.bookmarksTree.dirty = true;
                        if (automaticallyUpdatePortal) {
                                // data: id
                                observerService.notifyObservers(this, bookmarkUpdatedTopic, data);
                        }
                } else if (topic == bookmarksObserverStructureUpdatedTopic) {
                        this.bookmarksTree.dirty = true;
                        if (automaticallyUpdatePortal) {
                                // data: id
                                observerService.notifyObservers(this, bookmarkStructureUpdatedTopic, data);
                        }
                } else if (topic == historyObserverUpdatedTopic) {
                        // data: URL
                        var ids = this.getIdsForURL(data);
                        if (ids.length) {
                                this.bookmarksTree.dirty = true;
                                ids.forEach(function(id) {
                                        observerService.notifyObservers(this, bookmarkUpdatedTopic, id);
                                }, this);
                        }
                } else if (topic == 'nsPref:changed') {
                        // data: preference name
                        this.handlePreferenceChange(data);
                } else if (topic == shutdownTopic) {
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


//// Bookmarks Tree
//
// Bookmarks tree data structure.

// Constructor.
function BookmarksTree()
{
        this.root = null;
        this.dirty = true;

        // Init bookmark node factory
        this.factory = new BookmarkNodeFactory();
}

BookmarksTree.prototype =
{
        // Rebuilds tree.
        rebuild: function()
        {
                this.root = this._build(RDF_BOOKMARKS_ROOT, null);
                this.dirty = false;
        },

        // Builds tree recursively.
        //
        // resource: RDF resource
        // parent: parent BookmarkNode
        _build: function(resource,
                         parent)
        {
                var node = this.factory.createBookmarkNode(resource, parent);
                if (parent) {
                        parent.addChild(node);
                }
                if (node instanceof BookmarkContainerNode) {
                        var container = containerUtils.MakeSeq(bookmarksDataSource, node.resource);
                        var children = container.GetElements();
                        while (children.hasMoreElements()) {
                                this._build(children.getNext(), node);
                        }
                }
                return node;
        },

        // Rebuilds tree if necessary.
        _ensureCurrent: function()
        {
                if (this.dirty) {
                        this.rebuild();
                }
        },

        // Finds bookmark node with specified id.
        // Returns null if not found.
        //
        // id: bookmark node id
        findById: function(id)
        {
                this._ensureCurrent();
                return this.root.findById(id);
        },

        // Finds bookmark nodes with specified ids.
        //
        // nodes: object with ids as its properties, where each id
        // refers to an object with a link and node properties
        findByIds: function(nodes)
        {
                this._ensureCurrent();
                this.root.findByIds(nodes);
        },

        // Finds bookmark nodes in subtree with specified URL.
        //
        // list: output list
        // url: bookmark URL
        findByURL: function(list,
                            url)
        {
                this._ensureCurrent();
                return this.root.findByURL(list, url);
        },

        // Finds folder node in subtree with specified id.
        // Returns null if id is not found.
        //
        // id: id of folder node to find
        findFolderById: function(id)
        {
                this._ensureCurrent();
                return this.root.findFolderById(id);
        },

        // Finds folder node in subtree with specified path.
        // Returns null if id is not found.
        //
        // path: URI-encoded path of folder node to find
        findFolderByPath: function(path)
        {
                this._ensureCurrent();
                return this.root.findFolderByPath(path);
        },

        // Returns root bookmark node's name.
        get rootName()
        {
                this._ensureCurrent();
                return this.root.name;
        }
};


//// BookmarkNode Factory
//
// Creates BookmarkNode instances.

// Constructor.
function BookmarkNodeFactory() {}

BookmarkNodeFactory.prototype =
{
        // Returns an appropriate BookmarkNode subclass based on the resource type.
        //
        // resource: RDF resource
        // parent: parent BookmarkNode
        createBookmarkNode: function(resource,
                                     parent)
        {
                if (this.isBookmark(resource)) {
                        if (parent instanceof LivemarkNode) {
                                return new LivemarkBookmarkNode(resource, parent);
                        } else if (this.isSmartBookmark(resource)) {
                                return new SmartBookmarkNode(resource, parent);
                        }
                        return new NormalBookmarkNode(resource, parent);
                } else if (this.isFolder(resource)) {
                        return new BookmarkFolderNode(resource, parent);
                } else if (this.isLivemark(resource)) {
                        return new LivemarkNode(resource, parent);
                } else if (this.isSeparator(resource)) {
                        return new BookmarkSeparatorNode(resource, parent);
                }
                throw 'Unrecognized resource type';
                return null;
        },

        // Returns true if resource is a bookmark.
        isBookmark: function(resource)
        {
                return (RDF_BOOKMARK == bookmarksDataSource.GetTarget(resource, RDF_TYPE, true));
        },

        // Returns true if resource is a smart bookmark.
        isSmartBookmark: function(resource)
        {
                var target = bookmarksDataSource.GetTarget(resource, RDF_URL, true);
                if (target instanceof nsIRDFLiteral) {
                        return /%s/.test(target.Value);
                }
                return false;
        },

        // Returns true if resource is a folder.
        isFolder: function(resource)
        {
                return (RDF_FOLDER == bookmarksDataSource.GetTarget(resource, RDF_TYPE, true));
        },

        // Returns true if resource is a livemark.
        isLivemark: function(resource)
        {
                return (RDF_LIVEMARK == bookmarksDataSource.GetTarget(resource, RDF_TYPE, true));
        },

        // Returns true if resource is a separator.
        isSeparator: function(resource)
        {
                return (RDF_BOOKMARKSEPARATOR == bookmarksDataSource.GetTarget(resource, RDF_TYPE, true));
        }
};


//// Bookmark Node
//
// Base class for bookmark elements.

// Constructor.
//
// resource: RDF resource
// parent: parent node
function BookmarkNode(resource,
                      parent)
{
        if (resource) {
                this.resource = resource || null;
                this.parent = parent || null;
                this.children = null;
        }
}

BookmarkNode.prototype =
{
        //// Tree information methods

        // Returns true if node is the root node.
        isRoot: function()
        {
                return (this.parent == null);
        },

        // Returns true if node is a leaf node.
        isLeaf: function()
        {
                return true;
        },

        // Finds node in subtree with specified id.
        // Returns null if id is not found.
        //
        // id: id of node to find
        findById: function(id)
        {
                if (id == this.id) {
                        return this;
                }
                return null;
        },

        // Finds bookmark nodes with specified ids.
        //
        // nodes: object with ids as its properties, where each id
        // refers to an object with a link and node properties
        findByIds: function(nodes)
        {
                var obj = nodes[this.id];
                if (obj) {
                        obj.node = this;
                }
        },

        // Finds bookmark nodes in subtree with specified URL.
        //
        // list: output list
        // url: bookmark URL
        findByURL: function(list,
                            url)
        {
                if (url == this.url) {
                        list.push(this);
                }
                return list;
        },

        // Finds bookmark node with specified id.
        // Returns null if not found.
        //
        // id: bookmark node id
        findFolderById: function(id)
        {
                return null;
        },

        // Finds folder node in subtree with specified path.
        // Returns null if id is not found.
        //
        // path: URI-encoded path of folder node to find
        findFolderByPath: function(path)
        {
                return null;
        },


        //// Getter methods

        // Returns node resource's id.
        get id()
        {
                if (this.resource instanceof nsIRDFResource) {
                        return this.resource.Value;
                }
                return null;
        },

        // Returns node resource's name.
        get name()
        {
                var target = bookmarksDataSource.GetTarget(this.resource, RDF_NAME, true);
                if (target instanceof nsIRDFLiteral) {
                        return target.Value;
                }
                return stringBundle.GetStringFromName('unnamedBookmark');
        },

        // Returns node resource's url.
        get url()
        {
                var target = bookmarksDataSource.GetTarget(this.resource, RDF_URL, true);
                if (target instanceof nsIRDFLiteral) {
                        return target.Value;
                }
                return '';
        },

        // Returns node resource's description.
        get description()
        {
                var target = bookmarksDataSource.GetTarget(this.resource, RDF_DESCRIPTION, true);
                if (target instanceof nsIRDFLiteral) {
                        return target.Value;
                }
                return null;
        },

        // Returns node resource's icon.
        get icon()
        {
                var target = bookmarksDataSource.GetTarget(this.resource, RDF_ICON, true);
                if (target instanceof nsIRDFLiteral) {
                        return target.Value;
                }
                return null;
        },

        // Returns node resource's last visit date.
        get lastVisitDate()
        {
                var target = bookmarksDataSource.GetTarget(this.resource, RDF_LASTVISITDATE, true);
                if (target instanceof nsIRDFDate) {
                        return target.Value;
                }
                return null;
        },

        // Returns most recent visit date for node resource's URL.
        get historyDate()
        {
                var url = this.url;
                if (url) {
                        var resource = rdfService.GetResource(url);
                        var target = historyDataSource.GetTarget(resource, RDF_DATE, true);
                        if (target instanceof nsIRDFDate) {
                                return target.Value;
                        }
                }
                return null;
        },

        // Returns href.
        get href()
        {
                return this.url;
        },

        // Returns the full path.
        get path()
        {
                var node = this;
                const separator = '/';
                var path = separator + encodeURIComponent(node.name);
                while (node.parent) {
                        path = separator + encodeURIComponent(node.parent.name) + path;
                        node = node.parent;
                }
                return path;
        },


        //// Utility methods

        // Returns the text of a DOM node that contains only a text value.
        //
        // node: DOM node
        getText: function(node)
        {
                return node.firstChild.nodeValue;
        },

        // Truncates string at maximum length and appends an ellipsis.
        //
        // name: string
        truncate: function(name)
        {
                if (truncateBookmarkNames && (name.length > truncateBookmarkNamesLength)) {
                        name = name.slice(0, truncateBookmarkNamesLength);
                        name = name.replace(/\s*$/, stringBundle.GetStringFromName('ellipsis'));
                }
                return name;
        },

        // Sets node's description as tooltip
        //
        // node: bookmark node whose description to use
        // element: element to set tooltip on
        setTooltip: function(node,
                             element)
        {
                var description = node.description;
                if (description) {
                        element.title = description;
                }
        }
}


//// General Bookmark Node

// Constructor.
//
// resource: RDF resource
// parent: parent node
function GeneralBookmarkNode(resource,
                             parent)
{
        if (resource) {
                this.base = BookmarkNode;
                this.base(resource, parent);
        }
}

GeneralBookmarkNode.prototype = new BookmarkNode;

// Renders a bookmark.
//
// document: HTML document
// parentDOMNode: node at which to append tree
GeneralBookmarkNode.prototype.render = function(document,
                                                parentDOMNode)
{
        // Create link
        var link = document.createElement('a');
        link.href = this.url;

        // Set tooltip
        if (showDescriptionTooltips) {
                this.setTooltip(this, link);
        }

        // Set target to open in new tab or window
        if (openLinksNewTabOrWindow) {
                link.setAttribute('target', '_blank');
        }

        var name = this.truncate(this.name);
        var text = document.createTextNode(name);
        link.appendChild(text);

        // Set favicon
        var icon = this.icon;
        if (showFavicons && icon)
        {
                // Insert icon and link into a container
                var image = document.createElement('img');
                image.src = icon;
                image.className = 'favicon';

                var container = document.createElement('span');
                container.className = 'faviconLinkContainer';
                container.appendChild(image);
                container.appendChild(link);

                // Assign container id
                container.id = this.id;
                parentDOMNode.appendChild(container);
        }
        else
        {
                link.id = this.id;
                parentDOMNode.appendChild(link);
        }

        // Separator forces line wrapping
        var separator = document.createElementNS(XULNS, 'separator');
        parentDOMNode.appendChild(separator);

        return link;
};


//// Normal Bookmark Node

// Constructor.
//
// resource: RDF resource
// parent: parent node
function NormalBookmarkNode(resource,
                            parent)
{
        if (resource) {
                this.base = GeneralBookmarkNode;
                this.base(resource, parent);
        }
}

NormalBookmarkNode.prototype = new GeneralBookmarkNode;
NormalBookmarkNode.prototype.visitedPastDayClass = 'visitedPastDay';
NormalBookmarkNode.prototype.visitedPastTwoDaysClass = 'visitedPastTwoDays';
NormalBookmarkNode.prototype.visitedPastThreeDaysClass = 'visitedPastThreeDays';
NormalBookmarkNode.prototype.visitedPastWeekClass = 'visitedPastWeek';

// Renders a bookmark.
//
// document: HTML document
// parentDOMNode: node at which to append tree
NormalBookmarkNode.prototype.render = function(document,
                                               parentDOMNode)
{
        // Call superclass's render method
        var link = this.__proto__.__proto__.render.call(this, document, parentDOMNode);

        // Set class based on last visit date
        if (increaseRecentlyVisitedSize) {
                var lastVisitDate = this.historyDate || this.lastVisitDate;
                if (lastVisitDate) {
                        var age = this.getAgeInDays(lastVisitDate);
                        this.setAgeClass(link, age);
                }
        }
};

// Returns a date's floating point age in days.
//
// date: number of microseconds since the epoch
NormalBookmarkNode.prototype.getAgeInDays = function(date)
{
        // Convert date to ms
        date *= 0.001;

        // Get current date in ms
        var now = (new Date()).valueOf();

        // Return difference in days
        return ((now - date) / 86400000); // divisor: ms in a day
};

// Sets an element's class based on its age.
//
// element: DOM element
// age: floating point age in days
NormalBookmarkNode.prototype.setAgeClass = function(element,
                                                    age)
{
        if (age < 1.0) {
                // Visited within past day
                element.className = this.visitedPastDayClass;
        } else if (age < 2.0) {
                // Visited within past two days
                element.className = this.visitedPastTwoDaysClass;
        } else if (age < 3.0) {
                // Visited within past three days
                element.className = this.visitedPastThreeDaysClass;
        } else if (age < 7.0) {
                // Visited within past week
                element.className = this.visitedPastWeekClass;
        }
};


//// Livemark Bookmark Node

// Constructor.
//
// resource: RDF resource
// parent: parent node
function LivemarkBookmarkNode(resource,
                              parent)
{
        if (resource) {
                this.base = GeneralBookmarkNode;
                this.base(resource, parent);
        }
}

LivemarkBookmarkNode.prototype = new GeneralBookmarkNode;
LivemarkBookmarkNode.prototype.livemarkLinkClass = 'livemarkLink';

// Renders a bookmark.
//
// document: HTML document
// parentDOMNode: node at which to append tree
LivemarkBookmarkNode.prototype.render = function(document,
                                                 parentDOMNode)
{
        // Call superclass's render method
        var link = this.__proto__.__proto__.render.call(this, document, parentDOMNode);

        // Mark as livemark item
        link.className = this.livemarkLinkClass;
};


//// Smart Bookmark Node

// Constructor.
//
// resource: RDF resource
// parent: parent node
function SmartBookmarkNode(resource,
                           parent)
{
        this.base = BookmarkNode;
        this.base(resource, parent);
}

SmartBookmarkNode.prototype = new BookmarkNode;
SmartBookmarkNode.prototype.textboxIdAttribute = 'textboxId';
SmartBookmarkNode.prototype.smartBookmarkClass = 'smartbookmark';
SmartBookmarkNode.prototype.textboxClass = 'textbox';

// Renders a smart bookmark.
//
// node: BookmarkNode to render
// parentDOMNode: node at which to append tree
SmartBookmarkNode.prototype.render = function(document,
                                              parentDOMNode)
{
        var box = document.createElementNS(XULNS, 'hbox');
        box.className = this.smartBookmarkClass;

        var form = document.createElement('form');

        var textbox = document.createElement('input');
        textbox.type = 'text';
        textbox.id = this.id;
        textbox.className = this.textboxClass;
        textbox.setAttribute('size', 30);
        textbox.setAttribute('url', this.url);

        var button = document.createElementNS(XULNS, 'button');
        button.setAttribute(this.textboxIdAttribute, textbox.id);
        button.id = 'button:' + this.id;

        var command = 'try {return myportal.smartBookmarkHandler.load(event);} catch (e) {return false;}';

        button.setAttribute('oncommand', command);
        button.setAttribute('onclick', command);
        var icon = this.icon;
        if (icon) {
                button.setAttribute('image', icon);
        }
        var name = this.truncate(this.name);
        button.setAttribute('label', name);

        // Set tooltip
        if (showDescriptionTooltips) {
                var description = this.description;
                if (description) {
                        button.setAttribute('tooltiptext', description);
                }
        }

        box.appendChild(textbox);
        box.appendChild(button);

        var formCommand = 'javascript:try {myportal.smartBookmarkHandler.submit(\'' + textbox.id + '\');} catch (e) {}';
        form.setAttribute('action', formCommand);
        form.appendChild(box);

        var div = document.createElement('div');
        div.appendChild(form);
        parentDOMNode.appendChild(div);
};


//// Bookmark Separator Node

// Constructor.
//
// resource: RDF resource
// parent: parent node
function BookmarkSeparatorNode(resource,
                               parent)
{
        this.base = BookmarkNode;
        this.base(resource, parent);
}

BookmarkSeparatorNode.prototype = new BookmarkNode;
BookmarkSeparatorNode.prototype.separatorClass = 'bookmarkSeparator';

// Renders a bookmark separator.
//
// node: BookmarkNode to render
// parentDOMNode: node at which to append tree
BookmarkSeparatorNode.prototype.render = function(document,
                                                  parentDOMNode)
{
        var separator = document.createElement('div');
        separator.className = this.separatorClass;
        parentDOMNode.appendChild(separator);
};


//// BookmarkContainerNode

// Constructor.
//
// resource: RDF resource
// parent: parent node
function BookmarkContainerNode(resource,
                               parent)
{
        if (resource) {
                parent = parent || null;
                this.base = BookmarkNode;
                this.base(resource, parent);
                this.children = new Array();
        }
}

BookmarkContainerNode.prototype = new BookmarkNode;
BookmarkContainerNode.prototype.nodeIdAttribute= 'nodeId';
BookmarkContainerNode.prototype.folderAttribute = 'folder';
BookmarkContainerNode.prototype.folderHeadingLinkAttribute = 'folderHeadingLink';
BookmarkContainerNode.prototype.livemarkAttribute = 'livemark';
BookmarkContainerNode.prototype.folderClass = 'folder';
BookmarkContainerNode.prototype.folderHeadingClass = 'folderHeading';
BookmarkContainerNode.prototype.folderHeadingLinkClass = 'folderHeadingLink';
BookmarkContainerNode.prototype.folderContentsClass = 'folderContents';
BookmarkContainerNode.prototype.livemarkFolderHeadingClass = 'livemarkFolderHeading';
BookmarkContainerNode.prototype.emptyFolderNoteClass = 'emptyFolderNote';
BookmarkContainerNode.prototype.collapseButtonClass = 'collapseButton';

// Returns myportal:// href.
BookmarkContainerNode.prototype.__defineGetter__('href', function()
{
        var href = this.path;
        href = href.split('/');
        href = href.slice(2).join('/');
        return ('myportal://' + href);
});

// Adds a child node.
//
// child: child BookmarkNode
BookmarkContainerNode.prototype.addChild = function(child)
{
        this.children.push(child);
};

// Returns true if node is a leaf node.
BookmarkContainerNode.prototype.isLeaf = function()
{
        return (this.children.length == 0);
};

// Sets livemark-specific attributes.
BookmarkContainerNode.prototype.setLivemark = function() {};

BookmarkContainerNode.prototype.render = function(document,
                                                  parentDOMNode,
                                                  isPortalRoot)
{
        // folder
        //   folderheading
        //     folder name
        //   foldercontents
        //     bookmarks

        // Create folder heading
        var folderHeading = document.createElement('div');
        folderHeading.className = this.folderHeadingClass;

        // Create folder
        var folder = document.createElement('div');
        folder.className = this.folderClass;

        // Mark as folder
        folder.setAttribute(this.folderAttribute, 'true');

        folder.appendChild(folderHeading);

        // Create folder contents
        var folderContents = document.createElement('div');
        folderContents.className = this.folderContentsClass;

        // Create folder name
        if (isPortalRoot) {
                this.createRootFolderHeading(document, folderHeading);
        } else {
                var collapseButton = this.createCollapseButton(document, this, this.collapseButtonClass);
                var link = this.createLink(document, this, this.folderHeadingLinkClass);

                // Set collapsed attributes
                if (myportalDataSource.isCollapsed(this.id)) {
                        myportalService.setCollapsed(collapseButton, folderContents, true);
                }

                folderHeading.appendChild(collapseButton);
                folderHeading.appendChild(link);
        }

        // Set livemark-specific attributes
        this.setLivemark(document, folderHeading);

        // Add note to empty folders
        if (this.isLeaf()) {
                folderContents.appendChild(this.createEmptyFolderNote(document));
        }

        // Render children
        this.renderContents(document, folderContents);
        folder.appendChild(folderContents);
        parentDOMNode.appendChild(folder);
};

// Renders contents of node.
//
// document:
// parentDOMNode:
BookmarkContainerNode.prototype.renderContents = function(document,
                                                          parentDOMNode)
{
        this.children.forEach(function(child) {
                child.render(document, parentDOMNode);
        });
};

// Creates a folder heading including the entire path of a bookmark node.
//
// folderHeading: folder heading in which to insert items
// node: BookmarkNode to render
BookmarkContainerNode.prototype.createRootFolderHeading = function(document,
                                                                   folderHeading)
{
        // Document title
        this.title = '';

        var previousNode = this.createLink(document, this, this.folderHeadingLinkClass);
        folderHeading.appendChild(previousNode);

        // Store id
        this.pathNodeIds = new Array();
        this.pathNodeIds.push(previousNode.id);

        // Build document title
        if (!this.isRoot()) {
                this.title = this.getText(previousNode);
        }

        // Add link for each folder in path
        const pathSeparator = '/';
        var nextNode = null;
        var parent = this.parent;
        while (parent != null) {

                // Insert separator
                nextNode = document.createTextNode(pathSeparator);
                folderHeading.insertBefore(nextNode, previousNode);
                previousNode = nextNode;

                // Insert next node
                nextNode = this.createLink(document, parent, this.folderHeadingLinkClass);
                folderHeading.insertBefore(nextNode, previousNode);
                previousNode = nextNode;

                // Store id
                this.pathNodeIds.push(previousNode.id);

                // Build document title
                if (!parent.isRoot()) {
                        this.title = this.getText(previousNode) + pathSeparator + this.title;
                }
                parent = parent.parent;
        }
};

// Creates a folder heading link.
//
// node: BookmarkNode to render
// className: class name of link (optional)
BookmarkContainerNode.prototype.createLink = function(document,
                                                      node,
                                                      className)
{
        var link = document.createElement('a');
        link.id = node.id;

        // Mark link as folder heading link for popup handler
        link.setAttribute(this.folderHeadingLinkAttribute, 'true');

        if (className) {
                link.className = className;
        }

        // Get full path of node and strip root bookmark node's name
        link.href = node.href;

        // Set tooltip
        if (showDescriptionTooltips) {
                this.setTooltip(node, link);
        }

        var linkText = document.createTextNode(node.name);
        link.appendChild(linkText);
        return link;
};

// Creates a collapse button.
//
// node: BookmarkNode to render
BookmarkContainerNode.prototype.createCollapseButton = function(document,
                                                                node)
{
        // Create button
        var button = document.createElement('button');
        button.className = this.collapseButtonClass;
        button.setAttribute(this.nodeIdAttribute, node.id);

        // Set click handler
        button.setAttribute('onclick', 'try {myportal.collapser.toggle(this);} catch (e) {}');

        // Create image
        var image = document.createElementNS(XULNS, 'image');
        image.id = 'myportal-' + node.id;

        button.appendChild(image);
        return button;
};

// Creates a note to indicate an empty folder.
BookmarkContainerNode.prototype.createEmptyFolderNote = function(document)
{
        var note = document.createElement('span');
        note.className = this.emptyFolderNoteClass;
        note.appendChild(document.createTextNode(stringBundle.GetStringFromName('emptyFolder')));
        return note;
};

// Finds nodes in subtree with specified URL.
//
// list: output list
// url: bookmark URL
BookmarkContainerNode.prototype.findByURL = function(list,
                                                     url)
{
        this.children.forEach(function(child) {
                child.findByURL(list, url);
        });
        return list;
},

// Finds node in subtree with specified id.
// Returns null if id is not found.
//
// id: id of node to find
BookmarkContainerNode.prototype.findById = function(id)
{
        if (id == this.id) {
                return this;
        }

        var node = null;
        var i = 0;
        while (!node && (i < this.children.length)) {
                node = this.children[i].findById(id);
                i++;
        }
        return node;
};

// Finds bookmark nodes with specified ids.
//
// nodes: object with ids as its properties, where each id
// refers to an object with a link and node properties
BookmarkContainerNode.prototype.findByIds = function(nodes)
{
        this.children.forEach(function(child) {
                child.findByIds(nodes);
        });
},

// Finds folder node in subtree with specified id.
// Returns null if id is not found.
//
// id: id of folder node to find
BookmarkContainerNode.prototype.findFolderById = function(id)
{
        if (id == this.id) {
                return this;
        }

        var node = null;
        var child = null;
        var i = 0;
        while (!node && (i < this.children.length)) {
                child = this.children[i];
                if (child instanceof BookmarkContainerNode) {
                        node = child.findFolderById(id);
                }
                i++;
        }
        return node;
};

// Finds folder node in subtree with specified path.
// Returns null if id is not found.
//
// path: URI-encoded path of folder node to find
BookmarkContainerNode.prototype.findFolderByPath = function(path)
{
        if (path == null) {
                return null;
        }
        const separator = '/';

        // Remove trailing slash
        if (path[path.length - 1] == separator) {
                path = path.substr(0, path.length - 1);
        }
        var pathArray = path.split(separator);
        var searchName = pathArray[0];

        var node = null;
        if (decodeURIComponent(searchName) == this.name) {
                if (pathArray.length == 1) {
                        // Found folder
                        node = this;
                } else {
                        // Recurse on child folders
                        var child = null;
                        if (this.children) {
                                var i = 0;
                                while (!node && (i < this.children.length)) {
                                        child = this.children[i];
                                        if (child instanceof BookmarkContainerNode) {
                                                node = child.findFolderByPath(pathArray.slice(1).join(separator));
                                        }
                                        i++;
                                }
                        }
                }
        }
        return node;
};

// Sets the document title.
//
// title: the document title
BookmarkContainerNode.prototype.setTitle = function(document,
                                                    title)
{
        document.title = new String(this.titlePrefix + title);
};


//// Bookmark Folder Node

// Constructor.
//
// resource: RDF resource
// parent: parent node
function BookmarkFolderNode(resource,
                            parent)
{
        this.base = BookmarkContainerNode;
        this.base(resource, parent);
}

BookmarkFolderNode.prototype = new BookmarkContainerNode;


//// Livemark Node

// Constructor.
//
// resource: RDF resource
// parent: parent node
function LivemarkNode(resource,
                      parent)
{
        this.base = BookmarkContainerNode;
        this.base(resource, parent);
}

LivemarkNode.prototype = new BookmarkContainerNode;
LivemarkNode.prototype.livemarkMarkAsReadButtonClass = 'livemarkMarkAsReadButton';
LivemarkNode.prototype.livemarkRefreshButtonClass = 'livemarkRefreshButton';

// Sets livemark-specific attributes.
LivemarkNode.prototype.setLivemark = function(document,
                                              folderHeading)
{
        // Mark link as livemark for popup handler
        folderHeading.lastChild.setAttribute(this.livemarkAttribute, 'true');

        // Create buttons
        var markAsReadButton = document.createElement('button');
        markAsReadButton.className = this.livemarkMarkAsReadButtonClass;
        var refreshButton = document.createElement('button');
        refreshButton.className = this.livemarkRefreshButtonClass;

        // Set button tooltips
        markAsReadButton.title = stringBundle.GetStringFromName('livemark.markAsRead');
        refreshButton.title = stringBundle.GetStringFromName('livemark.refresh');

        // Mark each button as livemark for popup handler
        markAsReadButton.setAttribute(this.livemarkAttribute, 'true');
        markAsReadButton.setAttribute(this.nodeIdAttribute, this.id);
        refreshButton.setAttribute(this.livemarkAttribute, 'true');
        refreshButton.setAttribute(this.nodeIdAttribute, this.id);

        // Set click handlers
        markAsReadButton.setAttribute('onclick', 'try {myportal.livemarkUpdater.markLivemarkAsRead(this);} catch (e) {}');
        refreshButton.setAttribute('onclick', 'try {myportal.livemarkUpdater.refreshLivemark(this);} catch (e) {}');

        // Add images to buttons
        var markAsReadImage = document.createElementNS(XULNS, 'image');
        var refreshImage = document.createElementNS(XULNS, 'image');
        markAsReadButton.appendChild(markAsReadImage);
        refreshButton.appendChild(refreshImage);

        // Add buttons
        folderHeading.appendChild(markAsReadButton);
        folderHeading.appendChild(refreshButton);

        folderHeading.className += ' ' + this.livemarkFolderHeadingClass;
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


//// My Portal Notification Timer
// Implements:
// nsITimerCallback
//
// Timer that notifies observers about RDF updates.
// Using a timer delays notification until some time passes without an RDF update occurring.
// This avoids excessive rebuilding of the bookmarks tree data structure.

// Constructor.
//
// topic: notification topic
// delay: nsITimer delay (ms)
// type: nsITimer type
function myportalNotificationTimer(topic,
                                   delay,
                                   type)
{
        this.topic = topic || null;
        this.delay = delay || 1000;
        this.type = type || nsITimer.TYPE_ONE_SHOT;

        this.timer = Components.classes['@mozilla.org/timer;1'].createInstance(nsITimer);
        this.running = false;

        this.notificationLists = new Array();
}

myportalNotificationTimer.prototype =
{
        // Starts timer.
        start: function()
        {
                this.timer.initWithCallback(this, this.delay, this.type);
                this.running = true;
        },

        // Cancels timer.
        cancel: function()
        {
                if (this.running) {
                        this.timer.cancel();
                        this.running = false;
                }
        },

        // Cancels and restarts timer.
        reset: function()
        {
                this.cancel();
                this.start();
        },

        // Adds a notification list to timer.
        addNotificationList: function(list)
        {
                this.notificationLists.push(list);
        },

        // Cancels timer, clears notification lists, and notifies with timer's topic.
        // Called when a batch RDF update completes and portals are completely reloaded.
        flush: function()
        {
                this.cancel();
                this.notificationLists.forEach(function(list) {
                        list.clear();
                });
                this.notify();
        },


        //// nsITimerCallback methods

        notify: function()
        {
                this.cancel();

                // Notify with timer topic
                observerService.notifyObservers(this, this.topic, null);

                // For each list, notify with list's topic for each item
                this.notificationLists.forEach(function(list) {
                        for (var j in list.data) {
                                observerService.notifyObservers(this, list.topic, j);
                        }
                        list.clear();
                }, this);
        }
};


//// My Portal Update Notifier
//
// Records updated bookmark ids and possibily notifies observers about changed bookmarks.
//
// pushBegin is called when a bookmark attribute like id, name, or URL
// is modified.
//
// pushEnd is called upon completion of bookmark attribute changes,
// i.e. when a bookmark's last modified date is updated.  Because a
// bookmark's last modified date is also updated for other reasons,
// such as when bookmarks are reordered, notification occurs in
// pushEnd only if pushBegin has previously been called for the given
// bookmark id.

// Constructor.
//
// topic: notification topic
function myportalUpdateNotifier(topic)
{
        this.topic = topic;
        this.data = new Object();
}

myportalUpdateNotifier.prototype =
{
        pushBegin: function(id)
        {
                this.data[id] = true;
        },

        // Notifies observers with id if pushBegin was previously called with the same id.
        // Returns true if notification sent.
        pushEnd: function(id)
        {
                if (this.data[id]) {
                        observerService.notifyObservers(this, this.topic, id);
                        delete(this.data[id]);
                        return true;
                }
                return false;
        }
};


//// My Portal Notification List
//
// myportalNotificationTimer uses a list to notify observers with the list's topic for each list item.

// Constructor.
//
// topic: notification topic
function myportalNotificationList(topic)
{
        this.topic = topic;
        this.clear();
}

myportalNotificationList.prototype =
{
        // Clears list.
        clear: function()
        {
                this._data = new Object();
        },

        // Adds id to list.
        add: function(id)
        {
                this._data[id] = true;
        },

        // Removes id from list.
        remove: function(id)
        {
                delete this._data[id];
        },

        // Returns data object.
        get data()
        {
                return this._data;
        }
};


//// My Portal Bookmarks Observer
// Implements:
// nsIRDFObserver

// Constructor.
//
// delay: time after RDF update to notify (ms)
function myportalBookmarksObserver(delay)
{
        this.delay = delay || 500;

        // Base RDF structure predicate
        this.rdfPredicate = RDFNS.substr(0, RDFNS.length - 1);

        // Create notification timer
        this.notificationTimer = new myportalNotificationTimer(bookmarksObserverNotifyTopic, this.delay);

        // Create notification lists
        this.updatedRDFStructureIds = new myportalNotificationList(bookmarksObserverStructureUpdatedTopic);
        this.updatedLivemarkIds = new myportalNotificationList(livemarkUpdateEndedTopic);

        // Add notification lists to timer
        this.notificationTimer.addNotificationList(this.updatedRDFStructureIds);
        this.notificationTimer.addNotificationList(this.updatedLivemarkIds);

        // Create update notifier
        this.updatedQueue = new myportalUpdateNotifier(bookmarksObserverUpdatedTopic);
}

myportalBookmarksObserver.prototype =
{
        // Returns true if a predicate is a bookmark attribute.
        //
        // predicate: RDF predicate
        isBookmarkAttribute: function(predicate)
        {
                return (predicate == RDF_LASTVISITDATE ||
                        predicate == RDF_NAME ||
                        predicate == RDF_URL ||
                        predicate == RDF_DESCRIPTION ||
                        predicate == RDF_ID);
        },


        //// nsIRDFObserver methods

        onAssert: function(ds,
                           source,
                           predicate,
                           target)
        {
                if (this.isBookmarkAttribute(predicate)) {

                        // Bookmark attribute changed
                        this.updatedQueue.pushBegin(source.Value);
                } else if (predicate == RDF_LIVEMARKEXPIRATION) {

                        // Livemark update ended
                        this.updatedLivemarkIds.add(source.Value);
                        this.updatedRDFStructureIds.remove(source.Value);
                        this.notificationTimer.reset();
                } else if (predicate == RDF_LASTMODIFIEDDATE) {

                        // Last modified date added
                        if (this.updatedQueue.pushEnd(source.Value)) {
                                this.notificationTimer.reset();
                        }
                } else if (predicate == RDF_ICON) {

                        // Favicon added
                        // Force update, because updating favicon doesn't update last modified date
                        this.updatedQueue.pushBegin(source.Value);
                        if (this.updatedQueue.pushEnd(source.Value)) {
                                this.notificationTimer.reset();
                        }
                } else {
                        var splitPredicate = predicate.Value.split('#');
                        if (splitPredicate[0] == this.rdfPredicate) {

                                // RDF structure changed
                                this.updatedRDFStructureIds.add(source.Value);
                                this.notificationTimer.reset();
                        }
                }
        },

        onUnassert: function(ds,
                             source,
                             predicate,
                             target)
        {
                if (this.isBookmarkAttribute(predicate)) {

                        // Bookmark attribute changed
                        this.updatedQueue.pushBegin(source.Value);
                } else if (predicate == RDF_ICON) {

                        // Favicon removed
                        // Force update, because updating favicon doesn't update last modified date
                        this.updatedQueue.pushBegin(source.Value);
                        if (this.updatedQueue.pushEnd(source.Value)) {
                                this.notificationTimer.reset();
                        }
                } else if (predicate.Value.split('#')[0] == this.rdfPredicate) {

                        // RDF structure changed
                        this.updatedRDFStructureIds.add(source.Value);
                        this.notificationTimer.reset();
                }
        },

        onChange: function(ds,
                           source,
                           predicate,
                           oldTarget,
                           newTarget)
        {
                if (this.isBookmarkAttribute(predicate)) {

                        // Bookmark attribute changed
                        this.updatedQueue.pushBegin(source.Value);
                } else if (predicate == RDF_LIVEMARKEXPIRATION) {

                        // Livemark update ended
                        this.updatedLivemarkIds.add(source.Value);

                        // Avoid updating livemarks twice
                        this.updatedRDFStructureIds.remove(source.Value);

                        this.notificationTimer.reset();
                } else if (predicate == RDF_LASTMODIFIEDDATE) {

                        // Last modified date changed
                        if (this.updatedQueue.pushEnd(source.Value)) {
                                this.notificationTimer.reset();
                        }
                } else if (predicate == RDF_ICON) {

                        // Favicon changed
                        // Force update, because updating favicon doesn't update last modified date
                        this.updatedQueue.pushBegin(source.Value);
                        if (this.updatedQueue.pushEnd(source.Value)) {
                                this.notificationTimer.reset();
                        }
                }
        },

        onMove: function(ds,
                         oldSource,
                         newSource,
                         predicate,
                         target) {},

        onBeginUpdateBatch: function(ds) {},

        onEndUpdateBatch: function(ds) {

                // Force refresh
                this.notificationTimer.flush();
                observerService.notifyObservers(this, forceRefreshTopic, null);
        }
};


//// My Portal History Observer
// Implements:
// nsIRDFObserver

// Constructor.
function myportalHistoryObserver() {}

myportalHistoryObserver.prototype =
{
        // Notifies observers with a URL.
        //
        // url: URL
        notify: function(url)
        {
                observerService.notifyObservers(this, historyObserverUpdatedTopic, url);
        },


        //// nsIRDFObserver methods

        onAssert: function(ds,
                           source,
                           predicate,
                           target)
        {
                // URL's date added
                if (predicate == RDF_DATE) {
                        this.notify(source.Value);
                }
        },

        onUnassert: function(ds,
                             source,
                             predicate,
                             target)
        {
                // URL removed from history
                if ((source == RDF_HISTORY_ROOT) && (predicate == RDF_CHILD)) {
                        if (target instanceof nsIRDFResource) {
                                this.notify(target.Value);
                        }
                }
        },

        onChange: function(ds,
                           source,
                           predicate,
                           oldTarget,
                           newTarget)
        {
                // URL's date changed
                if (predicate == RDF_DATE) {
                        this.notify(source.Value);
                }
        },

        onMove: function(ds,
                         oldSource,
                         newSource,
                         predicate,
                         target) {},

        onBeginUpdateBatch: function(ds) {},

        onEndUpdateBatch: function(ds) {}
};


//// My Portal Data Source

// Constructor.
function MyPortalDataSource()
{
        this._open();
}

MyPortalDataSource.prototype =
{
        filename: 'myportal.rdf',

        // Get profile path.
        _getProfilePath: function()
        {
                return directoryService.get('ProfD', nsILocalFile);
        },

        // Get URL for datasource file.
        // See http://kb.mozillazine.org/File_IO
        _getURL: function()
        {
                // Create file
                var file = this._getProfilePath();
                file.append(this.filename);
                if (!file.exists()) {
                        file.create(nsILocalFile.NORMAL_FILE_TYPE, 0664);
                }

                // Get file URL
                var fileHandler = ioService.getProtocolHandler('file').QueryInterface(nsIFileProtocolHandler);
                var url = fileHandler.getURLSpecFromFile(file);
                return url;
        },

        // Open datasource.
        _open: function()
        {
                var url = this._getURL();
                this.ds = rdfService.GetDataSourceBlocking(url);
                this.collapsedContainer = Components.classes['@mozilla.org/rdf/container;1'].createInstance(nsIRDFContainer);
                containerUtils.MakeBag(this.ds, RDF_MYPORTAL_COLLAPSED_ROOT);
                this.collapsedContainer.Init(this.ds, RDF_MYPORTAL_COLLAPSED_ROOT);
        },

        // Check if a container contains a node.
        //
        // container: the container
        // node: the node to search for
        _contains: function(container,
                            node)
        {
                return (-1 != container.IndexOf(node));
        },

        // Insert a node into a container.
        //
        // container: the container
        // node: the node to insert
        _insert: function(container,
                          node)
        {
                container.AppendElement(node);
        },

        // Remove a node from a container.
        //
        // container: the container
        // node: the node to remove
        _remove: function(container,
                          node)
        {
                container.RemoveElement(node, true);
        },

        // Flush the datasource to disk.
        flush: function()
        {
                this.ds.QueryInterface(nsIRDFRemoteDataSource);
                this.ds.Flush();
        },

        // Check if a bookmark folder is collapsed.
        //
        // nodeId: the bookmark folder id
        isCollapsed: function(nodeId)
        {
                var node = rdfService.GetLiteral(nodeId);
                return this._contains(this.collapsedContainer, node);
        },

        // Sets a bookmark folder's collapsed state.
        //
        // nodeId: the bookmark folder id
        // collapsed: the collapsed state
        setCollapsed: function(nodeId,
                               collapsed)
        {
                var node = rdfService.GetLiteral(nodeId);
                var exists = this._contains(this.collapsedContainer, node);
                if (collapsed) {
                        if (!exists) {
                                this._insert(this.collapsedContainer, node);
                        }
                } else {
                        if (exists) {
                                this._remove(this.collapsedContainer, node);
                        }
                }
        }
};
