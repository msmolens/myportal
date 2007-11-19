/* nsMyPortalBookmarkNode.js
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

const MYPORTALBOOKMARKNODE_NAME = 'My Portal Bookmark Node';
const MYPORTALBOOKMARKNODE_CONTRACTID = '@unroutable.org/myportal-bookmark-node;1';
const MYPORTALBOOKMARKNODE_CID = Components.ID('{d0d14c77-520a-44e7-960b-a4a70aba9a5f}');


//// Interface constants

const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIStringBundleService = Components.interfaces.nsIStringBundleService;
const nsIRDFService = Components.interfaces.nsIRDFService;
const nsIRDFResource = Components.interfaces.nsIRDFResource;
const nsIRDFLiteral = Components.interfaces.nsIRDFLiteral;
const nsIRDFDate = Components.interfaces.nsIRDFDate;
const nsIMyPortalRDFService = Components.interfaces.nsIMyPortalRDFService;


//// Services

var rdfService = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(nsIRDFService);


//// My Portal Bookmark Node
// Implements:
// nsIMyPortalBookmarkNode
// nsISupports

function nsMyPortalBookmarkNode()
{
        this._resource = null;
        this._parent = null;

        this._rdfService = Components.classes['@unroutable.org/myportal-rdf-service;1'].getService(nsIMyPortalRDFService);
}

nsMyPortalBookmarkNode.prototype =
{
        _bookmarksDataSource: rdfService.GetDataSource('rdf:bookmarks'),
        _historyDataSource: rdfService.GetDataSource('rdf:history'),


        //// nsIMyPortalBookmarkNode methods

        set resource(resource)
        {
                this._resource = resource;
        },

        get resource()
        {
                return this._resource;
        },

        set parent(parent)
        {
                this._parent = parent;
        },

        get parent()
        {
                return this._parent;
        },

        get id()
        {
                if (this._resource instanceof nsIRDFResource) {
                        return this._resource.Value;
                }
                return null;
        },

        get name()
        {
                var rdfName = this._rdfService.rdfResource('name');
                var target = this._bookmarksDataSource.GetTarget(this._resource, rdfName, true);
                if (target instanceof nsIRDFLiteral) {
                        return target.Value;
                }

                var stringBundleService = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(nsIStringBundleService);
                var stringBundle = stringBundleService.createBundle('chrome://myportal/locale/myportal.properties');
                return stringBundle.GetStringFromName('unnamedBookmark');
        },

        get url()
        {
                var rdfURL = this._rdfService.rdfResource('url');
                var target = this._bookmarksDataSource.GetTarget(this._resource, rdfURL, true);
                if (target instanceof nsIRDFLiteral) {
                        return target.Value;
                }
                return '';
        },

        get description()
        {
                var rdfDescription = this._rdfService.rdfResource('description');
                var target = this._bookmarksDataSource.GetTarget(this._resource, rdfDescription, true);
                if (target instanceof nsIRDFLiteral) {
                        return target.Value;
                }
                return null;
        },

        get icon()
        {
                var rdfIcon = this._rdfService.rdfResource('icon');
                var target = this._bookmarksDataSource.GetTarget(this._resource, rdfIcon, true);
                if (target instanceof nsIRDFLiteral) {
                        return target.Value;
                }
                return null;
        },

        get lastVisitDate()
        {
                var rdfLastVisitDate = this._rdfService.rdfResource('lastVisitDate');
                var target = this._bookmarksDataSource.GetTarget(this._resource, rdfLastVisitDate, true);
                if (target instanceof nsIRDFDate) {
                        return target.Value;
                }
                return null;
        },

        get historyDate()
        {
                var url = this.url;
                if (url) {
                        var resource = rdfService.GetResource(url);
                        var rdfDate = this._rdfService.rdfResource('date');
                        var target = this._historyDataSource.GetTarget(resource, rdfDate, true);
                        if (target instanceof nsIRDFDate) {
                                return target.Value;
                        }
                }
                return null;
        },

        get path()
        {
                var node = this;
                const separator = '/';
                var path = separator + encodeURIComponent(node.name);
                while (node.parent) {
                        path = separator + encodeURIComponent(node.parent.name) + path;
                        node = node.parent;
                }
                return path;
        },

        isRoot: function()
        {
                return (this._parent == null);
        },

        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (iid.equals(nsIMyPortalBookmarkNode) ||
                    iid.equals(nsISupports)) {
                        return this;
                }
                throw Components.results.NS_ERROR_NO_INTERFACE;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalBookmarkNodeModule =
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
                compMgr.registerFactoryLocation(MYPORTALBOOKMARKNODE_CID,
                                                MYPORTALBOOKMARKNODE_NAME,
                                                MYPORTALBOOKMARKNODE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALBOOKMARKNODE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALBOOKMARKNODE_CID)) {
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
                        return (new nsMyPortalBookmarkNode()).QueryInterface(iid);
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
        return nsMyPortalBookmarkNodeModule;
}
