/* myportal.js
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

//// My Portal
// Implements:
// nsIObserver

var myportal =
{
        //// Ids and attributes
        myportalBodyId: 'myportalBody', // matches value in myportal.html

        folderHeadingLinkAttribute: 'folderHeadingLink', // matches value in BookmarkContainerNode


        //// Path ids
        rootNodeId: '',
        pathNodeIds: null,


        //// Services

        myportalService: Components.classes['@unroutable.org/myportal-service;1'].getService(Components.interfaces.nsIMyPortalService),
        observerService: Components.classes['@mozilla.org/observer-service;1'].getService(Components.interfaces.nsIObserverService),


        //// Methods

        // Loads My Portal.
        load: function()
        {
                // Get path by stripping protocol and all slashes from URL
                this.path = document.location.href.slice('myportal:'.length);
                this.path = this.path.replace(/^\/*/, '');

                // Get id for path
                this.rootNodeId = this.myportalService.getIdForPath(this.path);

                // Update style sheets
                this.colorStyleSheet = Components.classes['@unroutable.org/myportal-color-stylesheet;1'].createInstance(Components.interfaces.nsIMyPortalColorStyleSheet);
                this.colorStyleSheet.setStyleSheet(document.styleSheets[1]);
                this.colorStyleSheet.update();

                this.customStyleSheet = Components.classes['@unroutable.org/myportal-custom-stylesheet;1'].createInstance(Components.interfaces.nsIMyPortalCustomStyleSheet);
                this.customStyleSheet.setStyle(document.getElementById('customStyleSheet'));
                this.customStyleSheet.update();

                // Init logo
                this.logo = Components.classes['@unroutable.org/myportal-logo;1'].createInstance(Components.interfaces.nsIMyPortalLogo);
                this.logo.setDocument(document);
                this.logo.update();

                // Init image
                this.image = Components.classes['@unroutable.org/myportal-image;1'].createInstance(Components.interfaces.nsIMyPortalImage);
                this.image.setImage(document.getElementById('myportalImage'));
                this.image.update();

                // Init smart bookmark handler
                this.smartBookmarkHandler = new MyPortalSmartBookmarkHandler();

                // Init age timer
                this.ageTimer = new MyPortalAgeTimer();

                // Render bookmarks
                this.renderBookmarks();

                // Init notification topics
                var topicService =  Components.classes['@unroutable.org/myportal-notification-topic-service;1'].getService(Components.interfaces.nsIMyPortalNotificationTopicService);
                this.bookmarkUpdatedTopic = topicService.topic('bookmarkUpdated');
                this.bookmarkStructureUpdatedTopic = topicService.topic('bookmarkStructureUpdated');
                this.forceRefreshTopic = topicService.topic('forceRefresh');

                // Init livemark updater and register livemark update observers
                this.livemarkUpdater = new MyPortalLivemarkUpdater(this);
                this.observerService.addObserver(this.livemarkUpdater, this.livemarkUpdater.livemarkUpdateEndedTopic, false);
                this.observerService.addObserver(this.livemarkUpdater, this.livemarkUpdater.livemarkUpdateEndedNoFadeTopic, false);

                // Register bookmark update observer
                this.observerService.addObserver(this, this.bookmarkUpdatedTopic, false);
                this.observerService.addObserver(this, this.bookmarkStructureUpdatedTopic, false);

                // Register force refresh observer
                this.observerService.addObserver(this, this.forceRefreshTopic, false);
       },

        // Unloads My Portal.
        unload: function()
        {
                // Cancel age timer
                this.ageTimer.cancel();

                // Unregister observers
                this.observerService.removeObserver(this.livemarkUpdater, this.livemarkUpdater.livemarkUpdateEndedTopic);
                this.observerService.removeObserver(this.livemarkUpdater, this.livemarkUpdater.livemarkUpdateEndedNoFadeTopic);
                this.observerService.removeObserver(this, this.bookmarkUpdatedTopic);
                this.observerService.removeObserver(this, this.bookmarkStructureUpdatedTopic);
                this.observerService.removeObserver(this, this.forceRefreshTopic);

                // Unload elements
                this.logo.unload();
                this.image.unload();
                this.colorStyleSheet.unload();
                this.customStyleSheet.unload();

                // Aid garbage collection
                this.colorStyleSheet = null;
                this.customStyleSheet = null;
                this.logo = null;
                this.image = null;
                this.smartbookmarkhandler = null;
                this.ageTimer = null;
                this.livemarkUpdater = null;
        },


        //// Rendering methods

        // Renders bookmarks.
        renderBookmarks: function()
        {
                // Render into My Portal body
                var body = document.getElementById(this.myportalBodyId);
                this.clearNode(body);
                this.pathNodeIds = this.myportalService.createDOMBookmarksTree(body, this.rootNodeId);

                if (!this.pathNodeIds) {

                        // Hide image on error
                        this.image.visible = false;
                } else {

                        // Start age timer
                        this.ageTimer.start();
                }
        },

        // Clears a DOM node.
        //
        // node: a DOM node
        clearNode: function(node)
        {
                while (node.hasChildNodes()) {
                        node.removeChild(node.firstChild);
                }
        },


        //// Update methods

       // Redraws element or reloads portal if element is in path.
       //
       // nodeId: id of element that changed
       updatePortalOrReload: function(nodeId)
       {
               if (this.isInPath(nodeId)) {
                       // Open a new portal if a folder in current path has been updated to ensure valid URL in the URL bar
                       window.location.href = this.myportalService.getHrefForId(this.rootNodeId);
               } else {
                       this.updatePortal(nodeId);
               }
       },

       // Redraws element.
       //
       // nodeId: id of element that changed
       updatePortal: function(nodeId)
       {
               // Update node in place if exists in this portal
               var node = document.getElementById(nodeId);
               var isPortalRoot = (this.rootNodeId == nodeId);
               if (node && (isPortalRoot || !this.isInPath(nodeId))) {

                       node = this.getTopLevelNodeFromIdNode(node);

                       // Save any textbox values
                       var savedTextboxValues = new MyPortalSavedTextboxValues(node);
                       savedTextboxValues.save();

                       // Re-render node
                       var newNode = this.myportalService.updateDOMNode(node, nodeId, isPortalRoot).firstChild;
                       node.parentNode.replaceChild(newNode, node);

                       // Restore textbox values
                       savedTextboxValues.restore();
               }
       },


       //// Miscellaneous methods

       // Returns true if node id is in portal's path.
       //
       // nodeId: bookmark node id
       isInPath: function(nodeId)
       {
                var found = false;
               
                if (this.pathNodeIds) {
                        var it = this.pathNodeIds.enumerate();
                        while (it.hasMoreElements()) {
                                var id = it.getNext();
                                if (id instanceof Components.interfaces.nsISupportsString) {
                                        if (id.data == nodeId) {
                                                found = true;
                                                break;
                                        }
                                }
                        }
               }

               return found;
       },

       // Given the DOM node that contains a bookmark's id, returns
       // the top-level DOM node of all the nodes rendered for that
       // bookmark.
       //
       // node: a DOM node
       getTopLevelNodeFromIdNode: function(node)
       {
               // TODO move logic to renderer?

               if ((node.hasAttribute(this.folderHeadingLinkAttribute)) &&
                   (node.getAttribute(this.folderHeadingLinkAttribute) == 'true')) {
                       // Folder
                       node = node.parentNode.parentNode;
               } else if (node.nodeName == 'INPUT') {
                       // Smart Bookmark
                       node = node.parentNode.parentNode.parentNode;
               }
               return node;
       },


       //// nsIObserver methods

       observe: function(subject,
                         topic,
                         data)
       {
               if (topic == this.bookmarkUpdatedTopic) {
                       this.updatePortalOrReload(data);
               } else if (topic == this.bookmarkStructureUpdatedTopic) {
                       this.updatePortal(data);
               } else if (topic == this.forceRefreshTopic) {
                       this.renderBookmarks();
               }
       }
};
