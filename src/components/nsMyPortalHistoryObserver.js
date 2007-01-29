/* nsMyPortalHistoryObserver.js
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

const MYPORTALHISTORYOBSERVER_NAME = 'My Portal History Observer';
const MYPORTALHISTORYOBSERVER_CONTRACTID = '@unroutable.org/myportal-history-observer;1';
const MYPORTALHISTORYOBSERVER_CID = Components.ID('{3763a620-ec2b-4619-b30c-a677eb297f33}');


//// Interface constants

const nsISupports = Components.interfaces.nsISupports;
const nsIMyPortalHistoryObserver = Components.interfaces.nsIMyPortalHistoryObserver;
const nsIMyPortalNotificationTopicService = Components.interfaces.nsIMyPortalNotificationTopicService;
const nsIMyPortalRDFService = Components.interfaces.nsIMyPortalRDFService;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsITimer = Components.interfaces.nsITimer;
const nsIRDFObserver = Components.interfaces.nsIRDFObserver;
const nsIObserverService = Components.interfaces.nsIObserverService;


//// My Portal History Observer
// Implements:
// nsIMyPortalHistoryObserver
// nsIRDFObserver
// nsISupports

// Constructor.
function nsMyPortalHistoryObserver()
{
        // Init services
        this.observerService = Components.classes['@mozilla.org/observer-service;1'].getService(nsIObserverService);

        // Get notification topics
        var topicService = Components.classes['@unroutable.org/myportal-notification-topic-service;1'].getService(nsIMyPortalNotificationTopicService);

        this.historyObserverUpdatedTopic = topicService.topic('historyObserverUpdated');

        // Get RDF resources
        var rdfService = Components.classes['@unroutable.org/myportal-rdf-service;1'].getService(nsIMyPortalRDFService);
        this.rdfHistoryRoot = rdfService.rdfResource('historyRoot');
        this.rdfDate = rdfService.rdfResource('date');
        this.rdfChild = rdfService.rdfResource('child');

}

nsMyPortalHistoryObserver.prototype =
{
        // Notify observers with a URL.
        //
        // url: URL
        notify: function(url)
        {
                this.observerService.notifyObservers(this, this.historyObserverUpdatedTopic, url);
        },


        //// nsIRDFObserver methods

        onAssert: function(ds,
                           source,
                           predicate,
                           target)
        {
                // URL's date added
                if (predicate == this.rdfDate) {
                        this.notify(source.Value);
                }
        },

        onUnassert: function(ds,
                             source,
                             predicate,
                             target)
        {
                // URL removed from history
                if ((source == this.rdfHistoryRoot) && (predicate == this.rdfChild)) {
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
                if (predicate == this.rdfDate) {
                        this.notify(source.Value);
                }
        },

        onMove: function(ds,
                         oldSource,
                         newSource,
                         predicate,
                         target) {},

        onBeginUpdateBatch: function(ds) {},

        onEndUpdateBatch: function(ds) {},


        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsIMyPortalHistoryObserver) &&
                    !iid.equals(nsIRDFObserver) &&
                    !iid.equals(nsISupports)) {
                            throw Components.results.NS_ERROR_NO_INTERFACE;
                    }
                return this;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalHistoryObserverModule =
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
                compMgr.registerFactoryLocation(MYPORTALHISTORYOBSERVER_CID,
                                                MYPORTALHISTORYOBSERVER_NAME,
                                                MYPORTALHISTORYOBSERVER_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALHISTORYOBSERVER_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALHISTORYOBSERVER_CID)) {
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
                        return (new nsMyPortalHistoryObserver()).QueryInterface(iid);
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
        return nsMyPortalHistoryObserverModule;
}
