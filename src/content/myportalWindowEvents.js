/* myportalWindowEvents.js
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

//// My Portal Window Events
//
// Handles window events such as the popup context menu.

var myportalWindowEvents =
{
        //// Services

        myportalService: Components.classes['@unroutable.org/myportal-service;1'].getService(Components.interfaces.nsIMyPortalService),
        observerService: Components.classes['@mozilla.org/observer-service;1'].getService(Components.interfaces.nsIObserverService),


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

                // Determine clicked node's type
                const myportalURL = 'myportal://';
                var location = getBrowser().contentDocument.location.href;
                var isMyPortal = (location.substr(0, myportalURL.length) == myportalURL);
                var isLink = (node.nodeName == 'A');

                // True if clicked folder's title link
                var isFolder = isMyPortal && myportalWindowEvents.isFolderHeadingLink(node);

                // True if clicked livemark's title link or icon
                var isLivemark = isMyPortal && myportalWindowEvents.isLivemark(node);

                // True if clicked livemark link
                var isLivemarkLink = isMyPortal && node.className == 'livemarkLink';

                // True if clicked smart bookmark's textbox
                var isSmartBookmark = isMyPortal && (node.nodeName == 'INPUT');

                // True if clicked node represents any type of bookmark
                var isBookmark = isFolder || isLivemark || isSmartBookmark || (isMyPortal && isLink);

                // True if clicked on root
                var isBookmarksRoot = isMyPortal && node.id == 'NC:BookmarksRoot';

                // Set menuitem visibility
                livemarkMenuItems.setVisible(isLivemark);
                openFolderMenuItems.setVisible(isFolder);
                openUnreadMenuItems.setVisible(isFolder && isLivemark);

                // When clicked on bookmark, set 'Properties' menu item to open bookmark properties
                // Don't show bookmark properties when clicked on livemark link or NC:BookmarksRoot
                var propertiesMenuItem = document.getElementById('context-metadata');
                var bookmarkPropertiesMenuItem = document.getElementById('myportalBookmarkProperties');
                var showBookmarkProperties = isBookmark && !isLivemarkLink && !isBookmarksRoot;
                propertiesMenuItem.hidden = showBookmarkProperties;
                bookmarkPropertiesMenuItem.hidden = !showBookmarkProperties;
        },

        // Returns true if node is a folder heading link.
        isFolderHeadingLink: function(node)
        {
                const folderHeadingLinkAttribute = 'folderHeadingLink';
                return ((node.hasAttribute(folderHeadingLinkAttribute)) &&
                        (node.getAttribute(folderHeadingLinkAttribute) == 'true'));
        },

        // Returns true if node is livemark's title link or icon.
        isLivemark: function(node)
        {
                const livemarkAttribute = 'livemark';
                return ((node.hasAttribute(livemarkAttribute)) &&
                        (node.getAttribute(livemarkAttribute) == 'true'));
        },


        //// Livemark methods

        // Marks livemark's contents as read.
        //
        // node: clicked DOM node
        markLivemarkAsRead: function(node)
        {
                var id = this.getNodeId(node);
                this.myportalService.markLivemarkAsRead(id);
        },

        // Marks livemark's contents as unread.
        //
        // node: clicked DOM node
        markLivemarkAsUnread: function(node)
        {
                var id = this.getNodeId(node);
                this.myportalService.markLivemarkAsUnread(id);
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
                var id = this.getNodeId(node);
                this.myportalService.refreshLivemark(id);
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

        // Gets a node's id from its own or its parent's 'id' or 'nodeId' attribute.
        //
        // node: a DOM node
        getNodeId: function(node)
        {
                var id = node.id;
                if (!id) {
                        if (node.hasAttribute('nodeId')) {
                                id = node.getAttribute('nodeId');
                        } else {
                                // Link with favicon
                                id = node.parentNode.id;
                       }
                }
                return id;
        },

        // Opens bookmark properties dialog.
        //
        // node: clicked DOM node of bookmark
        openBookmarkProperties: function(node)
        {
                var id = this.getNodeId(node);
                var value = {};
                window.openDialog('chrome://browser/content/bookmarks/bookmarksProperties.xul', '', 'centerscreen,chrome,modal,resizable=no', id, value);
        }
};

// Add event listeners
window.addEventListener('load', myportalWindowEvents.load, false);
window.addEventListener('unload', myportalWindowEvents.unload, false);
