/* nsMyPortalNormalBookmarkNode.js
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

const MYPORTALNORMALBOOKMARKNODE_NAME = 'My Portal Normal Bookmark Node';
const MYPORTALNORMALBOOKMARKNODE_CONTRACTID = '@unroutable.org/myportal-normal-bookmark-node;1';
const MYPORTALNORMALBOOKMARKNODE_CID = Components.ID('{992c5977-8f3d-49c2-ad23-42683eb3c69f}');


//// Interface constants

const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIMyPortalVisitable = Components.interfaces.nsIMyPortalVisitable;
const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsIMyPortalNormalBookmarkNode = Components.interfaces.nsIMyPortalNormalBookmarkNode;
const nsIMyPortalNormalBookmarkNodeVisitor = Components.interfaces.nsIMyPortalNormalBookmarkNodeVisitor;
const nsIMyPortalGeneralBookmarkNode = Components.interfaces.nsIMyPortalGeneralBookmarkNode;
const nsIMyPortalGeneralBookmarkNodeVisitor = Components.interfaces.nsIMyPortalGeneralBookmarkNodeVisitor;


//// My Portal Normal Bookmark Node
// Implements:
// nsIMyPortalVisitable
// nsIMyPortalBookmarkNode
// nsIMyPortalNormalBookmarkNode
// nsISupports

function nsMyPortalNormalBookmarkNode()
{
        this._base = Components.classes['@unroutable.org/myportal-general-bookmark-node;1'].createInstance(nsIMyPortalBookmarkNode);
}

nsMyPortalNormalBookmarkNode.prototype =
{
        //// nsIMyPortalVisitable methods

        accept: function(visitor)
        {
                if (visitor instanceof nsIMyPortalNormalBookmarkNodeVisitor) {
                        visitor.visitNormalBookmarkNode(this);
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
                    iid.equals(nsIMyPortalNormalBookmarkNode) ||
                    iid.equals(nsISupports)) {
                            return this;
                }
                throw Components.results.NS_ERROR_NO_INTERFACE;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalNormalBookmarkNodeModule =
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
                compMgr.registerFactoryLocation(MYPORTALNORMALBOOKMARKNODE_CID,
                                                MYPORTALNORMALBOOKMARKNODE_NAME,
                                                MYPORTALNORMALBOOKMARKNODE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALNORMALBOOKMARKNODE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALNORMALBOOKMARKNODE_CID)) {
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
                        return (new nsMyPortalNormalBookmarkNode()).QueryInterface(iid);
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
        return nsMyPortalNormalBookmarkNodeModule;
}
