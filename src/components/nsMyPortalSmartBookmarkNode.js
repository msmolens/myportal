/* nsMyPortalSmartBookmarkNode.js
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

const MYPORTALSMARTBOOKMARKNODE_NAME = 'My Portal Smart Bookmark Node';
const MYPORTALSMARTBOOKMARKNODE_CONTRACTID = '@unroutable.org/myportal-smart-bookmark-node;1';
const MYPORTALSMARTBOOKMARKNODE_CID = Components.ID('{090c360e-c157-4aea-9305-e01277cc223f}');


//// Interface constants

const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIMyPortalVisitable = Components.interfaces.nsIMyPortalVisitable;
const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsIMyPortalSmartBookmarkNode = Components.interfaces.nsIMyPortalSmartBookmarkNode;
const nsIMyPortalSmartBookmarkNodeVisitor = Components.interfaces.nsIMyPortalSmartBookmarkNodeVisitor;


//// My Portal Smart Bookmark Node
// Implements:
// nsIMyPortalVisitable
// nsIMyPortalBookmarkNode
// nsIMyPortalSmartBookmarkNode
// nsISupports

function nsMyPortalSmartBookmarkNode()
{
        this._base = Components.classes['@unroutable.org/myportal-bookmark-node;1'].createInstance(nsIMyPortalBookmarkNode);
}

nsMyPortalSmartBookmarkNode.prototype =
{
        //// nsIMyPortalVisitable methods

        accept: function(visitor)
        {
                if (visitor instanceof nsIMyPortalSmartBookmarkNodeVisitor) {
                        visitor.visitSmartBookmarkNode(this);
                }
        },

        //// nsIMyPortalBookmarkNode methods

        set resource(resource)
        {
                this._base.resource = resource;
        },

        get resource()
        {
                return this._base.resource;
        },

        set parent(parent)
        {
                this._base.parent = parent;
        },

        get parent()
        {
                return this._base.parent;
        },

        get id()
        {
                return this._base.id;
        },

        get name()
        {
                return this._base.name;
        },

        get url()
        {
                return this._base.url;
        },

        get description()
        {
                return this._base.description;
        },

        get icon()
        {
                return this._base.icon;
        },

        get lastVisitDate()
        {
                return this._base.lastVisitDate;
        },

        get historyDate()
        {
                return this._base.historyDate;
        },

        get path()
        {
                return this._base.path;
        },

        isRoot: function()
        {
                return this._base.isRoot();
        },

        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (iid.equals(nsIMyPortalVisitable) ||
                    iid.equals(nsIMyPortalBookmarkNode) ||
                    iid.equals(nsIMyPortalSmartBookmarkNode) ||
                    iid.equals(nsISupports)) {
                            return this;
                }
                throw Components.results.NS_ERROR_NO_INTERFACE;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalSmartBookmarkNodeModule =
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
                compMgr.registerFactoryLocation(MYPORTALSMARTBOOKMARKNODE_CID,
                                                MYPORTALSMARTBOOKMARKNODE_NAME,
                                                MYPORTALSMARTBOOKMARKNODE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALSMARTBOOKMARKNODE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALSMARTBOOKMARKNODE_CID)) {
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
                        return (new nsMyPortalSmartBookmarkNode()).QueryInterface(iid);
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
        return nsMyPortalSmartBookmarkNodeModule;
}
