/* nsMyPortalGeneralBookmarkNode.js
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

const MYPORTALGENERALBOOKMARKNODE_NAME = 'My Portal General Bookmark Node';
const MYPORTALGENERALBOOKMARKNODE_CONTRACTID = '@unroutable.org/myportal-general-bookmark-node;1';
const MYPORTALGENERALBOOKMARKNODE_CID = Components.ID('{6e61935b-a660-4c67-a1ce-a85f2757f003}');


//// Interface constants

const nsIMyPortalGeneralBookmarkNode = Components.interfaces.nsIMyPortalGeneralBookmarkNode;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIMyPortalVisitable = Components.interfaces.nsIMyPortalVisitable;
const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsIMyPortalGeneralBookmarkNodeVisitor = Components.interfaces.nsIMyPortalGeneralBookmarkNodeVisitor;


//// My Portal General Bookmark Node
// Implements:
// nsIMyPortalVisitable
// nsIMyPortalBookmarkNode
// nsIMyPortalGeneralBookmarkNode
// nsISupports

function nsMyPortalGeneralBookmarkNode()
{
        this._base = Components.classes['@unroutable.org/myportal-bookmark-node;1'].createInstance(nsIMyPortalBookmarkNode);
}

nsMyPortalGeneralBookmarkNode.prototype =
{
        //// nsIMyPortalVisitable methods

        accept: function(visitor)
        {
                if (visitor instanceof nsIMyPortalGeneralBookmarkNodeVisitor) {
                        visitor.visitGeneralBookmarkNode(this);
                }
        },

        //// nsIMyPortalBookmarkNode methods

        set node(node)
        {
                this._base.node = node;
        },

        get node()
        {
                return this._base.node;
        },

        set parent(parent)
        {
                this._base.parent = parent;
        },

        get parent()
        {
                return this._base.parent;
        },

        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (iid.equals(nsIMyPortalVisitable) ||
                    iid.equals(nsIMyPortalBookmarkNode) ||
                    iid.equals(nsIMyPortalGeneralBookmarkNode) ||
                    iid.equals(nsISupports)) {
                            return this;
                }
                throw Components.results.NS_ERROR_NO_INTERFACE;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalGeneralBookmarkNodeModule =
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
                compMgr.registerFactoryLocation(MYPORTALGENERALBOOKMARKNODE_CID,
                                                MYPORTALGENERALBOOKMARKNODE_NAME,
                                                MYPORTALGENERALBOOKMARKNODE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALGENERALBOOKMARKNODE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALGENERALBOOKMARKNODE_CID)) {
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
                        return (new nsMyPortalGeneralBookmarkNode()).QueryInterface(iid);
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
        return nsMyPortalGeneralBookmarkNodeModule;
}
