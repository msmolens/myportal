/* nsMyPortalLivemarkBookmarkNode.js
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

const MYPORTALLIVEMARKBOOKMARKNODE_NAME = 'My Portal Livemark Bookmark Node';
const MYPORTALLIVEMARKBOOKMARKNODE_CONTRACTID = '@unroutable.org/myportal-livemark-bookmark-node;1';
const MYPORTALLIVEMARKBOOKMARKNODE_CID = Components.ID('{06a0f268-ef4d-4930-8390-a8fb07112a89}');


//// Interface constants

const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIMyPortalVisitable = Components.interfaces.nsIMyPortalVisitable;
const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsIMyPortalLivemarkBookmarkNode = Components.interfaces.nsIMyPortalLivemarkBookmarkNode;
const nsIMyPortalLivemarkBookmarkNodeVisitor = Components.interfaces.nsIMyPortalLivemarkBookmarkNodeVisitor;
const nsIMyPortalGeneralBookmarkNode = Components.interfaces.nsIMyPortalGeneralBookmarkNode;
const nsIMyPortalGeneralBookmarkNodeVisitor = Components.interfaces.nsIMyPortalGeneralBookmarkNodeVisitor;


//// My Portal Livemark Bookmark Node
// Implements:
// nsIMyPortalVisitable
// nsIMyPortalBookmarkNode
// nsIMyPortalLivemarkBookmarkNode
// nsISupports

function nsMyPortalLivemarkBookmarkNode()
{
        this._base = Components.classes['@unroutable.org/myportal-general-bookmark-node;1'].createInstance(nsIMyPortalBookmarkNode);
}

nsMyPortalLivemarkBookmarkNode.prototype =
{
        //// nsIMyPortalVisitable methods

        accept: function(visitor)
        {
                if (visitor instanceof nsIMyPortalLivemarkBookmarkNodeVisitor) {
                        visitor.visitLivemarkBookmarkNode(this);
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
                    iid.equals(nsIMyPortalLivemarkBookmarkNode) ||
                    iid.equals(nsISupports)) {
                            return this;
                }
                throw Components.results.NS_ERROR_NO_INTERFACE;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalLivemarkBookmarkNodeModule =
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
                compMgr.registerFactoryLocation(MYPORTALLIVEMARKBOOKMARKNODE_CID,
                                                MYPORTALLIVEMARKBOOKMARKNODE_NAME,
                                                MYPORTALLIVEMARKBOOKMARKNODE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALLIVEMARKBOOKMARKNODE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALLIVEMARKBOOKMARKNODE_CID)) {
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
                        return (new nsMyPortalLivemarkBookmarkNode()).QueryInterface(iid);
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
        return nsMyPortalLivemarkBookmarkNodeModule;
}
