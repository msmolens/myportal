/* nsMyPortalBookmarksObserver.js
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
 
//// Component constants

const MYPORTALBOOKMARKSOBSERVER_NAME = 'My Portal Bookmarks Observer';
const MYPORTALBOOKMARKSOBSERVER_CONTRACTID = '@unroutable.org/myportal-bookmarks-observer;1';
const MYPORTALBOOKMARKSOBSERVER_CID = Components.ID('{bd2f09e5-492f-4e23-b4fe-c129666e5338}');


//// Interface constants

const nsISupports = Components.interfaces.nsISupports;
const nsIMyPortalNotificationTopicService = Components.interfaces.nsIMyPortalNotificationTopicService;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIObserverService = Components.interfaces.nsIObserverService;
const nsINavBookmarkObserver = Components.interfaces.nsINavBookmarkObserver;


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
        this.bookmarksObserverUpdatedTopic = topicService.topic('bookmarksObserverUpdated');
        this.bookmarksObserverStructureUpdatedTopic = topicService.topic('bookmarksObserverStructureUpdated');
        this.livemarkUpdateEndedTopic = topicService.topic('livemarkUpdateEnded');
}

nsMyPortalBookmarksObserver.prototype =
{
		_updateItem: function(id)
		{
				this.observerService.notifyObservers(this, this.bookmarksObserverUpdatedTopic, id);
		},

		_updateParent: function(id)
		{
                this.observerService.notifyObservers(this, this.bookmarksObserverStructureUpdatedTopic, id);
		},
		
		_updateLivemark: function(id)
		{
				this.observerService.notifyObservers(this, this.livemarkUpdateEndedTopic, id);
		},

        //// nsINavBookmarkObserver methods
        onBeginUpdateBatch: function()
        {
                this._batch = true;
        },
        
        onEndUpdateBatch: function()
        {
                this._batch = false;
        },
        
        onItemAdded: function(aItemId, aFolder, aIndex)
        {
                if (this._batch) {
                        return;
                }

                this._updateParent(aFolder);
        },
        
        onItemRemoved: function(aItemId, aFolder, aIndex)
        {
                if (this._batch) {
                        return;
                }

		this._updateParent(aFolder);
        },
        
        onItemChanged: function(aBookmarkId, aProperty, aIsAnnotationProperty, aValue)
        {
                if (this._batch) {
                        return;
                }

                if (aProperty) {
                        var idx = aProperty.indexOf('/');
                        if (idx > -1 ) {
                                var prefix = aProperty.substr(0, idx);
				if ("livemark" == prefix) {
					this._updateLivemark(aBookmarkId);
                                }
                        } else {
				this._updateItem(aBookmarkId);
                        }
                }
        },
        
        onItemVisited: function(aBookmarkId, aVisitID, time)
        {
        },

        onItemMoved: function(aItemId, aOldParent, aOldIndex, aNewParent, aNewIndex)
        {
		this._updateParent(aOldParent);
                if (aOldParent != aNewParent) {
			this._updateParent(aNewParent);
                }
        },

        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsINavBookmarkObserver) &&
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
