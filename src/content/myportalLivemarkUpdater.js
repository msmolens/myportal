/* myportalLivemarkUpdater.js
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

//// My Portal Livemark Updater.
// Implements:
// nsIObserver
//
// Livemark update operations.

// Constructor.
//
// prefs: preferences service
// myportal: myportal object
function MyPortalLivemarkUpdater(prefs,
                                 myportal)
{
        this.prefs = prefs;
        this.myportal = myportal;

        // Init notification topics
        var topicService =  Components.classes['@unroutable.org/myportal-notification-topic-service;1'].getService(Components.interfaces.nsIMyPortalNotificationTopicService);
        this.livemarkUpdateEndedTopic = topicService.topic('livemarkUpdateEnded');
        this.livemarkUpdateEndedNoFadeTopic = topicService.topic('livemarkUpdateEndedNoFade');

        // Stores fade timers
        this.timers = new Object();
}

MyPortalLivemarkUpdater.prototype =
{
        //// Services

        myportalService: Components.classes['@unroutable.org/myportal-service;1'].getService(Components.interfaces.nsIMyPortalService),


        //// Methods

        // Re-renders livemark.
        //
        // nodeId: livemark id
        // noFade: if true, don't use fade effect
        updateLivemarkContents: function(nodeId,
                                         noFade)
        {
                try {
                        var folderHeading = document.getElementById(nodeId);
                        if (folderHeading) {

                                // Render livemark
                                var isPortalRoot = this.myportal.isInPath(nodeId);
                                var oldFolder = this.myportal.getTopLevelNodeFromIdNode(folderHeading);
                                var newFolder = this.myportalService.updateDOMNode(oldFolder, nodeId, isPortalRoot).firstChild;

                                if (this.animateLivemarkRefresh && !noFade) {

                                        // Fade out folder contents
                                        var folderContents = oldFolder.childNodes[1];
                                        var timer = new MyPortalFadeOutTimer(this, folderContents, nodeId, this.notify);
                                        timer.folders = {newFolder: newFolder,
                                                         oldFolder: oldFolder};
                                        this.addTimer(timer);
                                        timer.start();
                                } else {

                                        // Add to document
                                        this.replaceFolder(newFolder, oldFolder);
                                }
                        }
                } catch (e) {}
        },

        // Replaces old folder with new folder.
        //
        // newFolder: new folder
        // oldFolder: old folder
        replaceFolder: function(newFolder,
                                oldFolder)
        {
                oldFolder.parentNode.replaceChild(newFolder, oldFolder);
        },

        // Replaces old livemark with new livemark and fades in.
        //
        // newFolder: new livemark folder
        // oldFolder: old livemark folder
        // id: livemark id
        fadeInLivemark: function(newFolder,
                                 oldFolder,
                                 id)
        {
                try {
                        // Set new folder contents transparent
                        var folderContents = newFolder.childNodes[1];
                        folderContents.style.opacity = 0.0;

                        // Add to document
                        this.replaceFolder(newFolder, oldFolder);

                        // Fade in
                        var newTimer = new MyPortalFadeInTimer(this, folderContents, id, this.notify);
                        this.addTimer(newTimer);
                        newTimer.start();
                } catch (e) {}
        },

        // Livemark mark as read icon click callback.
        // Marks livemark's contents as read.
        //
        // node: clicked DOM node
        markLivemarkAsRead: function(node)
        {
                var id = node.getAttribute('nodeId');
                this.myportalService.markLivemarkAsRead(id);
        },

        // Livemark refresh icon click callback.
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
                var id = node.getAttribute('nodeId');
                this.myportalService.refreshLivemark(id);
        },


        //// Timer methods

        // Adds a timer.
        //
        // timer: timer to add
        addTimer: function(timer)
        {
                this.deleteTimer(timer.id);
                this.timers[timer.id] = timer;
        },

        // Deletes a timer.
        //
        // id: id of timer to delete
        deleteTimer: function(id)
        {
                if (this.timers[id]) {
                        this.timers[id].cancel();
                        delete this.timers[id];
                }
        },

        // Timer callback.
        notify: function(timer)
        {
                if (timer.folders) {
                        var newFolder = timer.folders.newFolder;
                        var oldFolder = timer.folders.oldFolder;
                        timer.parent.fadeInLivemark(newFolder, oldFolder, timer.id);
                } else {
                        timer.parent.deleteTimer(timer.id);
                }
        },


        //// nsIObserver methods

        observe: function(subject,
                          topic,
                          data)
        {
                if (topic == this.livemarkUpdateEndedTopic) {
                        this.updateLivemarkContents(data);
                } else if (topic == this.livemarkUpdateEndedNoFadeTopic) {
                        this.updateLivemarkContents(data, true);
                }
        },


        //// Preference getter methods

        get animateLivemarkRefresh()
        {
                return this.prefs.getBoolPref('animateLivemarkRefresh');
        }
};
