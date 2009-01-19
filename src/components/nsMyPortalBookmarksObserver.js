/* nsMyPortalBookmarksObserver.js
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
 
 Components.utils.import("resource://gre/modules/utils.js");

//// Component constants

const MYPORTALBOOKMARKSOBSERVER_NAME = 'My Portal Bookmarks Observer';
const MYPORTALBOOKMARKSOBSERVER_CONTRACTID = '@unroutable.org/myportal-bookmarks-observer;1';
const MYPORTALBOOKMARKSOBSERVER_CID = Components.ID('{bd2f09e5-492f-4e23-b4fe-c129666e5338}');


//// Interface constants

const nsISupports = Components.interfaces.nsISupports;
const nsIMyPortalBookmarksObserver = Components.interfaces.nsIMyPortalBookmarksObserver;
const nsIMyPortalNotificationTopicService = Components.interfaces.nsIMyPortalNotificationTopicService;
const nsIMyPortalRDFService = Components.interfaces.nsIMyPortalRDFService;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsITimer = Components.interfaces.nsITimer;
//const nsIRDFObserver = Components.interfaces.nsIRDFObserver;
const nsIObserverService = Components.interfaces.nsIObserverService;
const nsINavBookmarkObserver = Components.interfaces.nsINavBookmarkObserver;


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
                                   type)
{
        this.observerService = Components.classes['@mozilla.org/observer-service;1'].getService(nsIObserverService);

        this.topic = topic || null;
        this.type = type || nsITimer.TYPE_ONE_SHOT;

        this.delay = 1000;

        this.timer = Components.classes['@mozilla.org/timer;1'].createInstance(nsITimer);
        this.running = false;

        this.notificationLists = new Array();
}

myportalNotificationTimer.prototype =
{
        // Sets delay.
        //
        // delay: delay in ms
        setDelay: function(delay)
        {
                this.delay = delay;
        },

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
                this.observerService.notifyObservers(this, this.topic, null);

                // For each list, notify with list's topic for each item
                this.notificationLists.forEach(function(list) {
                        for (var j in list.data) {
                                this.observerService.notifyObservers(this, list.topic, j);
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
        this.observerService = Components.classes['@mozilla.org/observer-service;1'].getService(nsIObserverService);

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
                        this.observerService.notifyObservers(this, this.topic, id);
                        delete(this.data[id]);
                        return true;
                }
                return false;
        }
};



//// nsMyPortalBookmarksObserver
// Implements:
// nsINavBookmarkObserver
// nsISupports

function nsMyPortalBookmarksObserver()
{
        this._batch = false;

        this.observerService = Components.classes['@mozilla.org/observer-service;1'].getService(nsIObserverService);

        // Get notification topics
        var topicService = Components.classes['@unroutable.org/myportal-notification-topic-service;1'].getService(nsIMyPortalNotificationTopicService);
        var bookmarksObserverNotifyTopic = topicService.topic('bookmarksObserverNotify');
        this.bookmarksObserverUpdatedTopic = topicService.topic('bookmarksObserverUpdated');
        this.bookmarksObserverStructureUpdatedTopic = topicService.topic('bookmarksObserverStructureUpdated');
        //var livemarkUpdateEndedTopic = topicService.topic('livemarkUpdateEnded');
        this.livemarkUpdateEndedTopic = topicService.topic('livemarkUpdateEnded');
        

        // Create notification timer
   //     this.notificationTimer = new myportalNotificationTimer(bookmarksObserverNotifyTopic);

        // Create notification lists
  //      this.updatedLivemarkIds = new myportalNotificationList(livemarkUpdateEndedTopic);

        // Add notification lists to timer
   //     this.notificationTimer.addNotificationList(this.updatedLivemarkIds);

        // Create update notifier
//        this.updatedQueue = new myportalUpdateNotifier(bookmarksObserverUpdatedTopic);
}

nsMyPortalBookmarksObserver.prototype =
{
        _isBookmarkAttribute: function(predicate)
        {
                return false;
        },

        //// nsIMyPortalBookmarksObserver methods

        // Sets delay.
        //
        // delay: delay in ms
        setDelay: function(delay)
        {
//                this.notificationTimer.setDelay(delay);
        },
        
        //// nsINavBookmarkObserver methods
        onBeginUpdateBatch: function()
        {
                dump('begin batch\n');
                this._batch = true;
        },
        
        onEndUpdateBatch: function()
        {
                dump('end batch\n');
                this._batch = false;

                //
                // Force refresh
                //

//                this.notificationTimer.flush();

                // var topicService = Components.classes['@unroutable.org/myportal-notification-topic-service;1'].getService(nsIMyPortalNotificationTopicService);
                // var forceRefreshTopic = topicService.topic('forceRefresh');

                // this.observerService.notifyObservers(this, forceRefreshTopic, null);
        },
        
        onItemAdded: function(aItemId, aFolder, aIndex)
        {
                // TODO
        },
        
        onItemRemoved: function(aItemId, aFolder, aIndex)
        {
                // TODO
        },
        
        onItemChanged: function(aBookmarkId, aProperty, aIsAnnotationProperty, aValue)
        {
                if (this._batch) {
                        dump('skip in batch\n');
                        return;
                }

                dump("changed: " + aBookmarkId + ", " + aProperty + ", "  + aIsAnnotationProperty + ", " + aValue + "\n");

                if (aProperty) {
                        var idx = aProperty.indexOf('/');
                        if (idx > -1 ) {
                                var prefix = aProperty.substr(0, idx);
                                if ("livemark" == prefix) {
                                        this.observerService.notifyObservers(this, this.livemarkUpdateEndedTopic, aBookmarkId);
                                }
                        } else {
                                this.observerService.notifyObservers(this, this.bookmarksObserverUpdatedTopic, aBookmarkId);
                        }
                }
        },
        
        onItemVisited: function(aBookmarkId, aVisitID, time)
        {
                // TODO?
                dump('visited: ' + aBookmarkId + ", " + aVisitID + ", " + time + "\n");
        },

        onItemMoved: function(aItemId, aOldParent, aOldIndex, aNewParent, aNewIndex)
        {
                dump('moved: ' + aItemId + ", " + aOldParent + ", " + aOldIndex + ", " + aNewParent + ", " + aNewIndex + "\n");
                this.observerService.notifyObservers(this, this.bookmarksObserverStructureUpdatedTopic, aOldParent);
                if (aOldParent != aNewParent) {
                        this.observerService.notifyObservers(this, this.bookmarksObserverStructureUpdatedTopic, aNewParent);
                }
        },

        //// nsIRDFObserver methods

        onAssert: function(ds,
                           source,
                           predicate,
                           target)
        {
                if (this._isBookmarkAttribute(predicate)) {

                        // Bookmark attribute changed
                        this.updatedQueue.pushBegin(source.Value);
                } else if (predicate == this.rdfLastModifiedDate) {

                        // Last modified date added
                        if (this.updatedQueue.pushEnd(source.Value)) {
                                this.notificationTimer.reset();
                        }
                } else if (predicate == this.rdfIcon) {

                        // Favicon added
                        // Force update, because updating favicon doesn't update last modified date
                        this.updatedQueue.pushBegin(source.Value);
                        if (this.updatedQueue.pushEnd(source.Value)) {
                                this.notificationTimer.reset();
                        }
                }
        },

        onUnassert: function(ds,
                             source,
                             predicate,
                             target)
        {
                if (this._isBookmarkAttribute(predicate)) {

                        // Bookmark attribute changed
                        this.updatedQueue.pushBegin(source.Value);
                } else if (predicate == this.rdfIcon) {

                        // Favicon removed
                        // Force update, because updating favicon doesn't update last modified date
                        this.updatedQueue.pushBegin(source.Value);
                        if (this.updatedQueue.pushEnd(source.Value)) {
                                this.notificationTimer.reset();
                        }
                }
        },

        onChange: function(ds,
                           source,
                           predicate,
                           oldTarget,
                           newTarget)
        {
                if (this._isBookmarkAttribute(predicate)) {

                        // Bookmark attribute changed
                        this.updatedQueue.pushBegin(source.Value);
                } else if (predicate == this.rdfLastModifiedDate) {

                        // Last modified date changed
                        if (this.updatedQueue.pushEnd(source.Value)) {
                                this.notificationTimer.reset();
                        }
                } else if (predicate == this.rdfIcon) {

                        // Favicon changed
                        // Force update, because updating favicon doesn't update last modified date
                        this.updatedQueue.pushBegin(source.Value);
                        if (this.updatedQueue.pushEnd(source.Value)) {
                                this.notificationTimer.reset();
                        }
                }
        },

        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsIMyPortalBookmarksObserver) &&
                    !iid.equals(nsINavBookmarkObserver) &&
                    !iid.equals(nsISupports)) {
                            throw Components.results.NS_ERROR_NO_INTERFACE;
                    }
                return this;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalBookmarksObserverModule =
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
                compMgr.registerFactoryLocation(MYPORTALBOOKMARKSOBSERVER_CID,
                                                MYPORTALBOOKMARKSOBSERVER_NAME,
                                                MYPORTALBOOKMARKSOBSERVER_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALBOOKMARKSOBSERVER_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALBOOKMARKSOBSERVER_CID)) {
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
                        return (new nsMyPortalBookmarksObserver()).QueryInterface(iid);
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
        return nsMyPortalBookmarksObserverModule;
}
