/* nsMyPortalNotificationTopicService.js
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

const MYPORTALNOTIFICATIONTOPICSERVICE_NAME = 'My Portal Notification Topic Service';
const MYPORTALNOTIFICATIONTOPICSERVICE_CONTRACTID = '@unroutable.org/myportal-notification-topic-service;1';
const MYPORTALNOTIFICATIONTOPICSERVICE_CID = Components.ID('{52010a43-2af8-4a6f-99e8-6005bf3a640e}');


//// Interface constants

const nsISupports = Components.interfaces.nsISupports;
const nsIMyPortalNotificationTopicService = Components.interfaces.nsIMyPortalNotificationTopicService;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;


//// Hash table

function HashTable()
{
}

HashTable.prototype =
{
        // Get the value corresponding to key
        get: function(key)
        {
                if (this.hasOwnProperty(key)) {
                        return this[key];
                } else {
                        throw("Key not found: " + key);
                }
        }
};


//// nsMyPortalNotificationTopicService
// Implements:
// nsIMyPortalNotificationTopicService
// nsISupports

function nsMyPortalNotificationTopicService()
{
        //
        // Set up notification topics
        //

        const Prefix = 'myportal-'

        this.topics = new HashTable;
        this.topics['bookmarkUpdated'] = Prefix + 'bookmark-updated';
        this.topics['bookmarksObserverUpdated'] = Prefix + 'bookmarksobserver-updated';
        this.topics['bookmarksObserverStructureUpdated'] = Prefix + 'bookmarksobserver-structure-updated';
        this.topics['bookmarkStructureUpdated'] = Prefix + 'bookmark-structure-updated';
        this.topics['forceRefresh'] = Prefix + 'force-refresh';
        this.topics['livemarkUpdateEnded'] = Prefix + 'livemark-update-ended';
        this.topics['livemarkUpdateEndedNoFade'] = Prefix + 'livemark-update-ended-nofade';
        this.topics['shutdown'] = 'xpcom-shutdown';
}

nsMyPortalNotificationTopicService.prototype =
{
        /// nsIMyPortalNotificationTopicService methods

        topic: function(key)
        {
                return this.topics[key];
        },

        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsIMyPortalNotificationTopicService) &&
                    !iid.equals(nsISupports)) {
                            throw Components.results.NS_ERROR_NO_INTERFACE;
                    }
                return this;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalNotificationTopicServiceModule =
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
                compMgr.registerFactoryLocation(MYPORTALNOTIFICATIONTOPICSERVICE_CID,
                                                MYPORTALNOTIFICATIONTOPICSERVICE_NAME,
                                                MYPORTALNOTIFICATIONTOPICSERVICE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALNOTIFICATIONTOPICSERVICE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALNOTIFICATIONTOPICSERVICE_CID)) {
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
                        return (new nsMyPortalNotificationTopicService()).QueryInterface(iid);
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
        return nsMyPortalNotificationTopicServiceModule;
}
