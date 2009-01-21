/* myportalWindowEvents.js
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

//// My Portal Window Events
//
// Handles window events such as the popup context menu.

var myportalWindowEvents =
{
        //// Popup menu methods

        load: function(event)
        {
                // Add event listener to popup menu
                var popup = document.getElementById('contentAreaContextMenu');
                popup.addEventListener('popupshowing', myportalWindowEvents.popupShowing, false);
        },

        unload: function(event)
        {
                // Remove event listener from popup menu
                var popup = document.getElementById('contentAreaContextMenu');
                popup.removeEventListener('popupshowing', myportalWindowEvents.popupShowing, false);
        },

        popupShowing: function(event)
        {
                // MenuItems class extends Array
                function MenuItems() {};
                MenuItems.prototype = new Array;

                // Sets menuitems' visibilities.
                //
                // visible: if true, show menu items
                MenuItems.prototype.setVisible = function(visible)
                {
                        this.forEach(function(item) {
                                item.hidden = !visible;
                        });
                };

                // Clicked DOM node
                var node = document.popupNode;
                
                // Create list of open folder menuitems
                var openFolderMenuItems = new MenuItems();
                openFolderMenuItems.push(document.getElementById('myportalOpenFolderInTabs'));
                openFolderMenuItems.push(document.getElementById('myportalOpenFolderInWindows'));

                // Create list of open unread menuitems
                var openUnreadMenuItems = new MenuItems();
                openUnreadMenuItems.push(document.getElementById('myportalOpenUnreadInTabs'));
                openUnreadMenuItems.push(document.getElementById('myportalOpenUnreadInWindows'));

                // Create list of livemark menuitems
                var livemarkMenuItems = new MenuItems();
                livemarkMenuItems.push(document.getElementById('myportalLivemarkSeparator'));
                livemarkMenuItems.push(document.getElementById('myportalLivemarkMarkAsRead'));
                livemarkMenuItems.push(document.getElementById('myportalLivemarkMarkAsUnread'));
                livemarkMenuItems.push(document.getElementById('myportalLivemarkRefresh'));

                // Create list of livemark location menuitems
                var livemarkLocationMenuItems = new MenuItems();
                livemarkLocationMenuItems.push(document.getElementById('myportalOpenLivemarkLocationInWindow'));
                livemarkLocationMenuItems.push(document.getElementById('myportalOpenLivemarkLocationInTab'));
                
                const myportalURL = 'myportal://';
                var fuelApp = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
                var window = fuelApp.activeWindow;
                var tab = window.activeTab;
                var location = tab.uri.spec;
                var isMyPortal = (location.substr(0, myportalURL.length) == myportalURL);
                
                var isLink = false;
                var isFolder = false;
                var isLivemark = false;
                var isLivemarkWithLocation = false;
                var isLivemarkLink = false;
                var isSmartBookmark = false;
                var isBookmark = false;
                var isBookmarksRoot = false;
                
                if (isMyPortal) {
                        // Get bookmark item id
                        let id = myportalWindowEvents.getNodeId(node);
                        if (id) {
                        
                                // Get item type
                                let bookmarksService = PlacesUtils.bookmarks;
                                let itemType = bookmarksService.getItemType(id);
                                if (Components.interfaces.nsINavBookmarksService.TYPE_BOOKMARK == itemType) {
                                        isLink = true;

                                        let folderId = bookmarksService.getFolderIdForItem(id);

                                        let historyService = PlacesUtils.history;
                                        let options = historyService.getNewQueryOptions();
                                        let query = historyService.getNewQuery();

                                        query.setFolders([folderId], 1);

                                        let result = historyService.executeQuery(query, options);
                                        let rootNode = result.root;

                                        rootNode.containerOpen = true;

                                        let foundNode = null;
                                        for (var i = 0; i < rootNode.childCount; i++) {
                                                let childNode = rootNode.getChild(i);
                                                if (childNode.itemId == id) {
                                                        foundNode = childNode;
                                                        break;
                                                }
                                        }

                                        rootNode.containerOpen = false;

                                        if (foundNode) {
                                                isLivemarkLink = PlacesUtils.nodeIsLivemarkItem(foundNode);
                                                if (!isLivemarkLink) {
                                                        isSmartBookmark = /%s/.test(foundNode.uri);
                                                }
                                        }
                                } else if (Components.interfaces.nsINavBookmarksService.TYPE_FOLDER == itemType) {
                                        isFolder = true;

                                        // True if clicked on root folder
                                        isBookmarksRoot = id == PlacesUtils.bookmarksMenuFolderId;

                                        // Check for livemark folder
                                        if (!isBookmarksRoot) {
                                                let historyService = PlacesUtils.history;
                                                let options = historyService.getNewQueryOptions();
                                                let query = historyService.getNewQuery();

                                                query.setFolders([id], 1);

                                                let result = historyService.executeQuery(query, options);
                                                let rootNode = result.root;
                                                
                                                isLivemark = PlacesUtils.nodeIsLivemarkContainer(rootNode);
                                                if (isLivemark) {
                                                        isLivemarkWithLocation = PlacesUtils.annotations.itemHasAnnotation(id, "livemark/siteURI");
                                                }
                                        }
                                }
                                
                                // True if clicked node represents any type of bookmark
                                isBookmark = isFolder || isLivemark || isSmartBookmark || isLink;
                        }
                }

                // Set menuitem visibility
                livemarkMenuItems.setVisible(isLivemark);
                livemarkLocationMenuItems.setVisible(isLivemarkWithLocation);
                openFolderMenuItems.setVisible(isFolder);
                openUnreadMenuItems.setVisible(isFolder && isLivemark);

                // When clicked on bookmark, set 'Properties' menu item to open bookmark properties
                // Don't show bookmark properties when clicked on livemark link or bookmarks menu folder
                var propertiesMenuItem = document.getElementById('context-metadata');
                var bookmarkPropertiesMenuItem = document.getElementById('myportalBookmarkProperties');
                
                var showBookmarkProperties = isBookmark && !isLivemarkLink && !isBookmarksRoot;
                propertiesMenuItem.hidden = showBookmarkProperties;
                bookmarkPropertiesMenuItem.hidden = !showBookmarkProperties;
        },

        //// Livemark methods

        // Opens livemark's location URL in a new window.
        //
        // node: clicked DOM node
        openLivemarkLocationInWindow: function(node)
        {
                var opener = new MyPortalWindowLinkOpener();
                this._openLivemarkLocation(node, opener);
        },

        // Opens livemark's location URL in a new tab.
        //
        // node: clicked DOM node
        openLivemarkLocationInTab: function(node)
        {
                var opener = new MyPortalTabLinkOpener();
                this._openLivemarkLocation(node, opener);
        },

        // Opens URL with opener.
        //
        // node: clicked DOM node
        // opener: link opener
        _openLivemarkLocation: function(node, opener)
        {
                var id = this.getNodeId(node);
                var siteURI = PlacesUtils.annotations.getItemAnnotation(id, "livemark/siteURI");
                opener.open(siteURI);
        },

        // Marks livemark's contents as read.
        //
        // node: clicked DOM node
        markLivemarkAsRead: function(node)
        {
                var myportalService = Components.classes['@unroutable.org/myportal-service;1'].getService(Components.interfaces.nsIMyPortalService);
                var id = this.getNodeId(node);
                myportalService.markLivemarkAsRead(id);
        },

        // Marks livemark's contents as unread.
        //
        // node: clicked DOM node
        markLivemarkAsUnread: function(node)
        {
                var myportalService = Components.classes['@unroutable.org/myportal-service;1'].getService(Components.interfaces.nsIMyPortalService);
                var id = this.getNodeId(node);
                myportalService.markLivemarkAsUnread(id);
        },

        // Livemark refresh click handler.
        //
        // node: clicked DOM node
        refreshLivemark: function(node)
        {
                // Set livemark buttons active
                var children = node.parentNode.childNodes;
                var child;
                for (var i = 0; i < children.length; i++) {
                        child = children[i];
                        if (child.nodeName == 'BUTTON') {
                                child.setAttribute('disabled', 'true');
                                child.removeAttribute('onclick');
                        }
                }

                // Refresh livemark
                var livemarkService = PlacesUtils.livemarks;
                var id = this.getNodeId(node);
                livemarkService.reloadLivemarkFolder(id);
        },


        //// Bookmark Open methods

        // Opens all links in a folder in new windows.
        //
        // node: clicked DOM node
        openFolderInWindows: function(node)
        {
                const promptTitleKey = 'open.folder.windows.title';
                const promptMessageKey = 'open.folder.windows.message';
                var folderOpener = new MyPortalFolderOpener(promptTitleKey, promptMessageKey, new MyPortalLinkExtractor(), new MyPortalWindowLinkOpener());
                folderOpener.open(node);
        },

        // Opens all links in a folder in new tabs.
        //
        // node: clicked DOM node
        openFolderInTabs: function(node)
        {
                const promptTitleKey = 'open.folder.tabs.title';
                const promptMessageKey = 'open.folder.tabs.message';
                var folderOpener = new MyPortalFolderOpener(promptTitleKey, promptMessageKey, new MyPortalLinkExtractor(), new MyPortalTabLinkOpener());
                folderOpener.open(node);
        },

        // Opens unread links in a folder in new windows.
        //
        // node: clicked DOM node
        openUnreadInWindows: function(node)
        {
                const promptTitleKey = 'open.folder.windows.title';
                const promptMessageKey = 'open.unread.windows.message';
                var folderOpener = new MyPortalFolderOpener(promptTitleKey, promptMessageKey, new MyPortalUnreadLinkExtractor(), new MyPortalWindowLinkOpener());
                folderOpener.open(node);
        },

        // Opens unread links in a folder in new tabs.
        //
        // node: clicked DOM node
        openUnreadInTabs: function(node)
        {
                const promptTitleKey = 'open.folder.tabs.title';
                const promptMessageKey = 'open.unread.tabs.message';
                var folderOpener = new MyPortalFolderOpener(promptTitleKey, promptMessageKey, new MyPortalUnreadLinkExtractor(), new MyPortalTabLinkOpener());
                folderOpener.open(node);
        },


        //// Miscellaneous methods

        // Gets a node's associated bookmark item id
        //
        // node: a DOM node
        getNodeId: function(node)
        {
                var id = node.id;
                let (node = node) {
                        while (!id && (node.previousSibling || node.parentNode)) {
                                if (node.previousSibling) {
                                        node = node.previousSibling;
                                } else {
                                        node = node.parentNode;
                                }
                                id = node.id;
                        }
                }
                id = parseInt(id);
                return isNaN(id) ? null : id;
        },

        // Opens bookmark properties dialog.
        //
        // node: clicked DOM node of bookmark
        openBookmarkProperties: function(node)
        {
                var bookmarksService = PlacesUtils.bookmarks;
                var id = this.getNodeId(node);
                var type = "";
                var itemType = bookmarksService.getItemType(id);
                switch (itemType) {
                        case Components.interfaces.nsINavBookmarksService.TYPE_BOOKMARK:
                                type = "bookmark";
                                break;
                        case Components.interfaces.nsINavBookmarksService.TYPE_FOLDER:
                                type = "folder";
                                break;
                        default:
                                break;
                }

                if (type.length) {
                        PlacesUIUtils.showItemProperties(id, type);
                }
        }
};

// Add event listeners
window.addEventListener('load', myportalWindowEvents.load, false);
window.addEventListener('unload', myportalWindowEvents.unload, false);
