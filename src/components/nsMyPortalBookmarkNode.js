/* nsMyPortalBookmarkNode.js
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

const MYPORTALBOOKMARKNODE_NAME = 'My Portal Bookmark Node';
const MYPORTALBOOKMARKNODE_CONTRACTID = '@unroutable.org/myportal-bookmark-node;1';
const MYPORTALBOOKMARKNODE_CID = Components.ID('{d0d14c77-520a-44e7-960b-a4a70aba9a5f}');


//// Interface constants

const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;


//// My Portal Bookmark Node
// Implements:
// nsIMyPortalBookmarkNode
// nsISupports

function nsMyPortalBookmarkNode()
{
	this._node = null;
        this._parent = null;
}

nsMyPortalBookmarkNode.prototype =
{
        //// nsIMyPortalBookmarkNode methods

        set node(node)
        {
               this._node = node;
        },

        get node()
        {
               return this._node;
        },

        set parent(parent)
        {
                this._parent = parent;
        },

        get parent()
        {
                return this._parent;
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
