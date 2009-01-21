/* nsMyPortalService.js
 * Copyright (C) 2005-2009 Max Smolens
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

Components.utils.import("resource://gre/modules/utils.js");

 //// Component constants

const MYPORTALSERVICE_NAME = 'My Portal Service';
const MYPORTALSERVICE_CONTRACTID = '@unroutable.org/myportal-service;1';
const MYPORTALSERVICE_CID = Components.ID('{34b0eda1-1917-47bd-9143-b6b3a0f2bcca}');


//// Interface constants

const nsIMyPortalService = Components.interfaces.nsIMyPortalService;
const nsIMyPortalDataSource = Components.interfaces.nsIMyPortalDataSource;
const nsIMyPortalHistoryObserver = Components.interfaces.nsIMyPortalHistoryObserver;
const nsIMyPortalNotificationTopicService = Components.interfaces.nsIMyPortalNotificationTopicService;
const nsIMyPortalRenderer = Components.interfaces.nsIMyPortalRenderer;
const nsIMyPortalVisitable = Components.interfaces.nsIMyPortalVisitable;
const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsIMyPortalBookmarkNodeVisitor = Components.interfaces.nsIMyPortalBookmarkNodeVisitor;
const nsIMyPortalBookmarkContainerNode = Components.interfaces.nsIMyPortalBookmarkContainerNode;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
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
const nsINavHistoryContainerResultNode = Components.interfaces.nsINavHistoryContainerResultNode;
const nsINavHistoryResultNode = Components.interfaces.nsINavHistoryResultNode;
const nsINavBookmarkObserver = Components.interfaces.nsINavBookmarkObserver;

//// Namespace constants

const XULNS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';


//// Services
// TODO make members of service

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


//// nsMyPortalService
// Implements:
// nsIMyPortalService
// nsIObserver
// nsISupports

// Constructor.
function nsMyPortalService()
{
        // Init My Portal data source
        this.myportalDataSource = Components.classes['@unroutable.org/myportal-datasource;1'].getService(nsIMyPortalDataSource);

        // Init history services
        this.globalHistoryService = Components.classes['@mozilla.org/browser/global-history;2'].getService(nsIGlobalHistory2);
        this.browserHistoryService = this.globalHistoryService.QueryInterface(nsIBrowserHistory);

        // Init preferences service
        this.prefs = preferencesService.getBranch('myportal.');
        this.prefsInternal = this.prefs.QueryInterface(nsIPrefBranchInternal);

        // Load global preferences
        this.loadGlobalPreferences();

        // Init document title strings
        this.stringBundle = stringBundleService.createBundle('chrome://myportal/locale/myportal.properties');
        this.titlePrefix = this.stringBundle.GetStringFromName('title.prefix');
        this.titleFolderNotFound = this.stringBundle.GetStringFromName('title.folderNotFound') ;

        // Init bookmarks observer
        this.bookmarksObserver = Components.classes['@unroutable.org/myportal-bookmarks-observer;1'].createInstance(nsINavBookmarkObserver);
        PlacesUtils.bookmarks.addObserver(this.bookmarksObserver, false);

        // Init history observer
        this.historyObserver = Components.classes['@unroutable.org/myportal-history-observer;1'].createInstance(nsIMyPortalHistoryObserver);
        PlacesUtils.history.addObserver(this.historyObserver, false);

        // Init notification topics
        var topicService = Components.classes['@unroutable.org/myportal-notification-topic-service;1'].getService(nsIMyPortalNotificationTopicService);
        this.bookmarksObserverUpdatedTopic = topicService.topic('bookmarksObserverUpdated');
        this.bookmarksObserverStructureUpdatedTopic = topicService.topic('bookmarksObserverStructureUpdated');
        this.livemarkUpdateEndedNoFadeTopic = topicService.topic('livemarkUpdateEndedNoFade');
        this.forceRefreshTopic = topicService.topic('forceRefresh');
        this.bookmarkUpdatedTopic = topicService.topic('bookmarkUpdated');
        this.bookmarkStructureUpdatedTopic = topicService.topic('bookmarkStructureUpdated');
        this.shutdownTopic = topicService.topic('shutdown');

        // Observe bookmark changes
        observerService.addObserver(this, this.bookmarksObserverUpdatedTopic, false);
        observerService.addObserver(this, this.bookmarksObserverStructureUpdatedTopic, false);

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
                PlacesUtils.bookmarks.removeObserver(this.bookmarksObserver);
                PlacesUtils.history.removeObserver(this.historyObserver);
                this.myportalDataSource.flush();
                observerService.removeObserver(this, this.bookmarksObserverUpdatedTopic);
                observerService.removeObserver(this, this.bookmarksObserverStructureUpdatedTopic);
                observerService.removeObserver(this, this.shutdownTopic);
                this.prefsInternal.removeObserver('', this);
        },


        //// DOM creation methods
        
        dumpResult: function(rootNode)
        {
			if (!(rootNode instanceof nsINavHistoryContainerResultNode))
			{
				return;
			}

			rootNode.containerOpen = true;

            for (var i = 0; i < rootNode.childCount; i++) {
                var node = rootNode.getChild(i);
                var title = node.title;
                var id = node.itemId;
                var type = node.type;

                switch (type)
                {
				case nsINavHistoryResultNode.RESULT_TYPE_URI:
					dump('bookmark: ' + title + '(' + id + ')\n');
					break;
				case nsINavHistoryResultNode.RESULT_TYPE_VISIT:
					break;
				case nsINavHistoryResultNode.RESULT_TYPE_FULL_VISIT:
					break;
				case nsINavHistoryResultNode.RESULT_TYPE_HOST:
					break;
				case nsINavHistoryResultNode.RESULT_TYPE_REMOTE_CONTAINER:
					break;
				case nsINavHistoryResultNode.RESULT_TYPE_QUERY:	
                                        dump('query: ' + title + '(' + id + ')\n');
                                        this.dumpResult(node);
					break;
				case nsINavHistoryResultNode.RESULT_TYPE_FOLDER:
					dump('folder: ' + title + '(' + id + ')\n');
					this.dumpResult(node);
					break;
				case nsINavHistoryResultNode.RESULT_TYPE_SEPARATOR:
					dump('separator\n');
					break;
				case nsINavHistoryResultNode.RESULT_TYPE_DAY:
					break;
				default:
					dump('default\n');
					break;
                }
            }
			
			rootNode.containerOpen = false;
        },

        buildTree: function(rootNode)
        {
                if (!rootNode) {
                        return null;
                }
                
                var parentNode = null;
                switch (rootNode.type) {
                        case nsINavHistoryResultNode.RESULT_TYPE_URI:
                                if (PlacesUtils.nodeIsLivemarkItem(rootNode)) {
                                        parentNode = Components.classes['@unroutable.org/myportal-livemark-bookmark-node;1'].createInstance(nsIMyPortalBookmarkNode);
                                } else if (/%s/.test(rootNode.uri)) {
                                        parentNode = Components.classes['@unroutable.org/myportal-smart-bookmark-node;1'].createInstance(nsIMyPortalBookmarkNode);
                                } else {
                                        parentNode = Components.classes['@unroutable.org/myportal-normal-bookmark-node;1'].createInstance(nsIMyPortalBookmarkNode);
                                }
                                break;
                        case nsINavHistoryResultNode.RESULT_TYPE_FOLDER:
//                        case nsINavHistoryResultNode.RESULT_TYPE_QUERY:
                                parentNode = PlacesUtils.nodeIsLivemarkContainer(rootNode) ?
                                        Components.classes['@unroutable.org/myportal-livemark-node;1'].createInstance(nsIMyPortalBookmarkNode) :
                                        Components.classes['@unroutable.org/myportal-bookmark-folder-node;1'].createInstance(nsIMyPortalBookmarkNode);
                                parentNode.QueryInterface(nsIMyPortalBookmarkContainerNode);
                                if (rootNode instanceof nsINavHistoryContainerResultNode) {
                                        rootNode.containerOpen = true;

                                        for (var i = 0; i < rootNode.childCount; i++) {
                                                var node = rootNode.getChild(i);
                                                var childNode = this.buildTree(node);
                                                if (childNode) {
                                                        childNode.node = node;
                                                        childNode.parent = parentNode;
                                                        parentNode.addChild(childNode);
                                                }
                                        }
                                        
                                        rootNode.containerOpen = false;
                                }

                                break;
                        case nsINavHistoryResultNode.RESULT_TYPE_SEPARATOR:
                                // Create bookmark separator node
                                parentNode = Components.classes['@unroutable.org/myportal-bookmark-separator-node;1'].createInstance(nsIMyPortalBookmarkNode);
                                break;
                        default:
                                break;
                }
                
                if (parentNode) {
                        parentNode.node = rootNode;
                        parentNode.parent = null;
                }
                
                return parentNode;
        },

        // Creates bookmarks tree.
        //
        // parentNode: DOM node in which to insert the tree
        // nodeId: root bookmark node's id
        createDOMBookmarksTree: function(parentDOMNode,
                                         nodeId)
        {
                var validNode = (nodeId > -1);

                var document = parentDOMNode.ownerDocument;
                var documentTitle = this.titlePrefix;
                var pathNodeIds = null;

                // Render tree
                var documentFragment = document.createDocumentFragment();

                var historyService = PlacesUtils.history;
                var options = historyService.getNewQueryOptions();
                var query = historyService.getNewQuery();

                var result = null;
                var rootNode = null;
                if (validNode) {
                        query.setFolders([nodeId], 1);
                        options.excludeQueries = true;
                        result = historyService.executeQuery(query, options);
                        rootNode = result.root;
                }
//		this.dumpResult(rootNode);

                var node = this.buildTree(rootNode);
                if (node instanceof nsIMyPortalVisitable &&
                        document instanceof nsIDOMDocument &&
                        documentFragment instanceof nsIDOMNode) {

                                // TODO refactor
                                let renderer = Components.classes['@unroutable.org/myportal-renderer;1'].createInstance(nsIMyPortalRenderer);
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
                var historyService = PlacesUtils.history;
                var options = historyService.getNewQueryOptions();
                var query = historyService.getNewQuery();
                
                var bookmarksService = PlacesUtils.bookmarks;
                var folderId = bookmarksService.getFolderIdForItem(nodeId);

                query.setFolders([folderId], 1);

                var result = historyService.executeQuery(query, options);
                var rootNode = result.root;
                
                rootNode.containerOpen = true;

                var foundNode = null;
                for (var i = 0; i < rootNode.childCount; i++) {
                        var childNode = rootNode.getChild(i);
                        if (childNode.itemId == nodeId) {
                                foundNode = childNode;
                                break;
                        }
                }

                rootNode.containerOpen = false;
                
                var bookmarkNode = this.buildTree(foundNode);
                
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
                var historyService = PlacesUtils.history;
                var options = historyService.getNewQueryOptions();
                var query = historyService.getNewQuery();

                query.setFolders([nodeId], 1);

                var result = historyService.executeQuery(query, options);
                var rootNode = result.root;
                if (!(rootNode instanceof nsINavHistoryContainerResultNode)) {
                        return;
                }
        
                //
                // Add livemarks to history
                //

                // FIXME
                // Disable history observer to avoid updating each link separately
//              this.historyObserver.disable();

                rootNode.containerOpen = true;

                for (var i = 0; i < rootNode.childCount; i++) {
                        var node = rootNode.getChild(i);
                        var title = node.title;
                        var id = node.itemId;
                        var type = node.type;
                        if (nsINavHistoryResultNode.RESULT_TYPE_URI == type) {
                                markFunction.call(this, node.uri);
                        }
                }
			
		rootNode.containerOpen = false;

                 // FIXME
                 // Re-enable history observer
  //             this.historyObserver.enable();

                // Redraw
                observerService.notifyObservers(this, this.livemarkUpdateEndedNoFadeTopic, nodeId);
        },

        
        //// Bookmark information methods
		
        getIdForPath_: function(bookmarksPath, folderNode)
        {
                if (!(folderNode instanceof nsINavHistoryContainerResultNode)) {
                        return;
                }
                
                var name;
                var idx = bookmarksPath.indexOf("/");
                if (idx >= 0) {
                        // Decode top folder name
                        name = decodeURIComponent(bookmarksPath.substr(0, idx));
                        
                        // Strip top folder name from path
                        if (idx < bookmarksPath.length) {
                                bookmarksPath = bookmarksPath.substr(idx+1);
                        }
                } else {
                        // Leaf
                        name = decodeURIComponent(bookmarksPath);
                        bookmarksPath = "";
                }
                
                if (name.length == 0) {
                        return folderNode.itemId;
                }
                
                var folderId = -1;

                folderNode.containerOpen = true;

                for (var i = 0; i < folderNode.childCount; i++) {
                        var node = folderNode.getChild(i);
                        if (nsINavHistoryResultNode.RESULT_TYPE_FOLDER == node.type)
                        {
                                if (node.title == name) {
                                        // Recurse
                                        var id = this.getIdForPath_(bookmarksPath, node);
                                        if (id > -1) {
                                                folderId = id;
                                        }
                                        
                                        break;
                                }
                        }
                }
                
                folderNode.containerOpen = false;

                return folderId;
        },

        // Returns id of deepest folder in path.
        //
        // bookmarksPath: path not including root bookmark node name
        getIdForPath: function(bookmarksPath)
        {
                var historyService = PlacesUtils.history;
                var options = historyService.getNewQueryOptions();
                var query = historyService.getNewQuery();
                var bookmarksMenuFolder = PlacesUtils.bookmarksMenuFolderId;

                query.setFolders([bookmarksMenuFolder], 1);

                var result = historyService.executeQuery(query, options);
                var rootNode = result.root;
                var id = this.getIdForPath_(bookmarksPath, rootNode);

                return id;
        },

        // Returns myportal:// href for a bookmark folder.
        //
        // nodeId: bookmark folder id
        getHrefForId: function(nodeId)
        {
                // Get full path of node
                var names = [];
                var bookmarks = PlacesUtils.bookmarks;
                var bookmarksMenuFolderId = PlacesUtils.bookmarksMenuFolderId;
                var id = nodeId;
                while (id != bookmarksMenuFolderId) {
                        var title = bookmarks.getItemTitle(id);
                        names.push(encodeURIComponent(title));

                        id = bookmarks.getFolderIdForItem(id);
                }
                names.reverse();
                var href = 'myportal://' + names.join('/');
                return href;
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
                if (topic == this.bookmarksObserverUpdatedTopic) {
                        if (automaticallyUpdatePortal) {
                                // data: id
                                observerService.notifyObservers(this, this.bookmarkUpdatedTopic, data);
                        }
                } else if (topic == this.bookmarksObserverStructureUpdatedTopic) {
                        if (automaticallyUpdatePortal) {
                                // data: id
                                observerService.notifyObservers(this, this.bookmarkStructureUpdatedTopic, data);
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
