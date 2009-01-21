/* nsMyPortalLivemarkNode.js
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

const MYPORTALLIVEMARKNODE_NAME = 'My Portal Livemark Node';
const MYPORTALLIVEMARKNODE_CONTRACTID = '@unroutable.org/myportal-livemark-node;1';
const MYPORTALLIVEMARKNODE_CID = Components.ID('{afc9e7d6-1456-4609-b6bd-4a853b23b139}');


//// Interface constants

const nsIMyPortalLivemarkNode = Components.interfaces.nsIMyPortalLivemarkNode;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIMyPortalVisitable = Components.interfaces.nsIMyPortalVisitable;
const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsIMyPortalBookmarkContainerNode = Components.interfaces.nsIMyPortalBookmarkContainerNode;
const nsIMyPortalLivemarkNodeVisitor = Components.interfaces.nsIMyPortalLivemarkNodeVisitor;
const nsIMyPortalBookmarkContainerNodeVisitor = Components.interfaces.nsIMyPortalBookmarkContainerNodeVisitor;


//// My Portal Livemark Node
// Implements:
// nsIMyPortalVisitable
// nsIMyPortalBookmarkContainerNode
// nsIMyPortalLivemarkNode
// nsIMyPortalNode
// nsISupports

function nsMyPortalLivemarkNode()
{
        this._base = Components.classes['@unroutable.org/myportal-bookmark-container-node;1'].createInstance(nsIMyPortalBookmarkContainerNode);
}

nsMyPortalLivemarkNode.prototype =
{
        //// nsIMyPortalVisitable methods

        accept: function(visitor)
        {
                if (visitor instanceof nsIMyPortalLivemarkNodeVisitor) {
                        visitor.visitLivemarkNode(this);
                }
        },

        //// nsIMyPortalBookmarkContainerNode methods

        get children()
        {
                return this._base.children;
        },

        addChild: function(child)
        {
                this._base.addChild(child);
        },

        isEmpty: function()
        {
                return this._base.isEmpty();
        },

        //// nsIMyPortalBookmarkNode methods

        set node(node)
        {
                this._base.QueryInterface(nsIMyPortalBookmarkNode).node = node;
        },

        get node()
        {
                return this._base.QueryInterface(nsIMyPortalBookmarkNode).node;
        },

        set parent(parent)
        {
                this._base.QueryInterface(nsIMyPortalBookmarkNode).parent = parent;
        },

        get parent()
        {
                return this._base.QueryInterface(nsIMyPortalBookmarkNode).parent;
        },

        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (iid.equals(nsIMyPortalVisitable) ||
                    iid.equals(nsIMyPortalBookmarkContainerNode) ||
                    iid.equals(nsIMyPortalBookmarkNode) ||
                    iid.equals(nsIMyPortalLivemarkNode) ||
                    iid.equals(nsISupports)) {
                            return this;
                }
                throw Components.results.NS_ERROR_NO_INTERFACE;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalLivemarkNodeModule =
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
                compMgr.registerFactoryLocation(MYPORTALLIVEMARKNODE_CID,
                                                MYPORTALLIVEMARKNODE_NAME,
                                                MYPORTALLIVEMARKNODE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALLIVEMARKNODE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALLIVEMARKNODE_CID)) {
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
                        return (new nsMyPortalLivemarkNode()).QueryInterface(iid);
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
        return nsMyPortalLivemarkNodeModule;
}
