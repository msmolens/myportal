/* nsMyPortalBookmarkContainerNode.js
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

const MYPORTALBOOKMARKCONTAINERNODE_NAME = 'My Portal Bookmark Container Node';
const MYPORTALBOOKMARKCONTAINERNODE_CONTRACTID = '@unroutable.org/myportal-bookmark-container-node;1';
const MYPORTALBOOKMARKCONTAINERNODE_CID = Components.ID('{2b9edc81-a7d4-4b85-bffe-7690f2667688}');


//// Interface constants

const nsIMyPortalBookmarkContainerNode = Components.interfaces.nsIMyPortalBookmarkContainerNode;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIMyPortalVisitable = Components.interfaces.nsIMyPortalVisitable;
const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsIMutableArray = Components.interfaces.nsIMutableArray;
const nsIMyPortalBookmarkContainerNodeVisitor = Components.interfaces.nsIMyPortalBookmarkContainerNodeVisitor;

//// My Portal Bookmark Container Node
// Implements:
// nsIMyPortalVisitable
// nsIMyPortalBookmarkContainerNode
// nsIMyPortalBookmarkNode
// nsISupports

function nsMyPortalBookmarkContainerNode()
{
        this._base = Components.classes['@unroutable.org/myportal-bookmark-node;1'].createInstance(nsIMyPortalBookmarkNode);
        this._children = Components.classes['@mozilla.org/array;1'].createInstance(nsIMutableArray);
}

nsMyPortalBookmarkContainerNode.prototype =
{
        get children()
        {
                return this._children;
        },

        //// nsIMyPortalVisitable methods

        accept: function(visitor)
        {
                if (visitor instanceof nsIMyPortalBookmarkContainerNodeVisitor) {
                        visitor.visitBookmarkContainerNode(this);
                }
        },

        //// nsIMyPortalBookmarkContainerNode methods

        addChild: function(child)
        {
                this._children.appendElement(child, false);
        },

        isEmpty: function()
        {
                return (this._children.length == 0);
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
                    iid.equals(nsIMyPortalBookmarkContainerNode) ||
                    iid.equals(nsIMyPortalBookmarkNode) ||
                    iid.equals(nsISupports)) {
                            return this;
                }
                throw Components.results.NS_ERROR_NO_INTERFACE;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalBookmarkContainerNodeModule =
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
                compMgr.registerFactoryLocation(MYPORTALBOOKMARKCONTAINERNODE_CID,
                                                MYPORTALBOOKMARKCONTAINERNODE_NAME,
                                                MYPORTALBOOKMARKCONTAINERNODE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALBOOKMARKCONTAINERNODE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALBOOKMARKCONTAINERNODE_CID)) {
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
                        return (new nsMyPortalBookmarkContainerNode()).QueryInterface(iid);
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
        return nsMyPortalBookmarkContainerNodeModule;
}
