/* nsMyPortalRDFService.js
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

const MYPORTALRDFSERVICE_NAME = 'My Portal RDF Service';
const MYPORTALRDFSERVICE_CONTRACTID = '@unroutable.org/myportal-rdf-service;1';
const MYPORTALRDFSERVICE_CID = Components.ID('{b15f8dc2-aeb3-4770-a20e-90fcf52ae613}');


//// Interface constants

const nsISupports = Components.interfaces.nsISupports;
const nsIMyPortalRDFService = Components.interfaces.nsIMyPortalRDFService;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIRDFService = Components.interfaces.nsIRDFService;


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


//// nsMyPortalRDFService
// Implements:
// nsIMyPortalRDFService
// nsISupports

function nsMyPortalRDFService()
{
        // Namespaces
        const NCNS = 'http://home.netscape.com/NC-rdf#';
        const WEBNS = 'http://home.netscape.com/WEB-rdf#';
        const RDFNS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
        const HTMLNS = 'http://www.w3.org/1999/xhtml';
        const XULNS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
        const MYPORTALNS = 'http://www.unroutable.org/rdf';

        //
        // Init RDF Resources
        //

        var rdfService = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(nsIRDFService);

        this.resources = new HashTable;
        this.resources['bookmarksRoot'] = rdfService.GetResource('NC:BookmarksRoot');
        this.resources['historyRoot'] = rdfService.GetResource('NC:HistoryRoot');
        this.resources['id'] = rdfService.GetResource(NCNS + 'ID');
        this.resources['name'] = rdfService.GetResource(NCNS + 'Name');
        this.resources['url'] = rdfService.GetResource(NCNS + 'URL');
        this.resources['description'] = rdfService.GetResource(NCNS + 'Description');
        this.resources['icon'] = rdfService.GetResource(NCNS + 'Icon');
        this.resources['type'] = rdfService.GetResource(RDFNS + 'type');
        this.resources['date'] = rdfService.GetResource(NCNS + 'Date');
        this.resources['lastVisitDate'] = rdfService.GetResource(WEBNS + 'LastVisitDate');
        this.resources['lastModifiedDate'] = rdfService.GetResource(WEBNS + 'LastModifiedDate');
        this.resources['folder'] = rdfService.GetResource(NCNS + 'Folder');
        this.resources['bookmark'] = rdfService.GetResource(NCNS + 'Bookmark');
        this.resources['livemark'] = rdfService.GetResource(NCNS + 'Livemark');
        this.resources['livemarkExpiration'] = rdfService.GetResource(NCNS + 'LivemarkExpiration');
        this.resources['bookmarkSeparator'] = rdfService.GetResource(NCNS + 'BookmarkSeparator');
        this.resources['seq'] = rdfService.GetResource(RDFNS + 'Seq');
        this.resources['child'] = rdfService.GetResource(NCNS + 'child');
        this.resources['myportalCollapsedRoot'] = rdfService.GetResource(MYPORTALNS + '/collapsed/all');

        //
        // Init namespaces
        //

        this.namespaces = new HashTable;
        this.namespaces['nc'] = NCNS;
        this.namespaces['web'] = WEBNS;
        this.namespaces['rdf'] = RDFNS;
        this.namespaces['html'] = HTMLNS;
        this.namespaces['xul'] = XULNS;
        this.namespaces['myportal'] = MYPORTALNS;

}

nsMyPortalRDFService.prototype =
{
        //// nsIMyPortalRDFService methods

        rdfResource: function(key)
        {
                return this.resources[key];
        },

        namespace: function(key)
        {
                return this.namespaces[key];
        },

        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsIMyPortalRDFService) &&
                    !iid.equals(nsISupports)) {
                            throw Components.results.NS_ERROR_NO_INTERFACE;
                    }
                return this;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalRDFServiceModule =
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
                compMgr.registerFactoryLocation(MYPORTALRDFSERVICE_CID,
                                                MYPORTALRDFSERVICE_NAME,
                                                MYPORTALRDFSERVICE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALRDFSERVICE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALRDFSERVICE_CID)) {
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
                        return (new nsMyPortalRDFService()).QueryInterface(iid);
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
        return nsMyPortalRDFServiceModule;
}
