/* nsMyPortalBookmarkSeparatorNode.js
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

const MYPORTALBOOKMARKSEPARATORNODE_NAME = 'My Portal Bookmark Separator Node';
const MYPORTALBOOKMARKSEPARATORNODE_CONTRACTID = '@unroutable.org/myportal-bookmark-separator-node;1';
const MYPORTALBOOKMARKSEPARATORNODE_CID = Components.ID('{150f769c-51bb-4c3d-9dbe-2b13bfe918e4}');


//// Interface constants

const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIMyPortalVisitable = Components.interfaces.nsIMyPortalVisitable;
const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsIMyPortalBookmarkSeparatorNode = Components.interfaces.nsIMyPortalBookmarkSeparatorNode;
const nsIMyPortalBookmarkSeparatorNodeVisitor = Components.interfaces.nsIMyPortalBookmarkSeparatorNodeVisitor;


//// My Portal Bookmark Separator Node
// Implements:
// nsIMyPortalVisitable
// nsIMyPortalBookmarkNode
// nsIMyPortalBookmarkSeparatorNode
// nsISupports

function nsMyPortalBookmarkSeparatorNode()
{
        this._base = Components.classes['@unroutable.org/myportal-bookmark-node;1'].createInstance(nsIMyPortalBookmarkNode);
}

nsMyPortalBookmarkSeparatorNode.prototype =
{
        //// nsIMyPortalVisitable methods

        accept: function(visitor)
        {
                if (visitor instanceof nsIMyPortalBookmarkSeparatorNodeVisitor) {
                        visitor.visitBookmarkSeparatorNode(this);
                }
        },

        //// nsIMyPortalBookmarkNode methods

        set resource(resource)
        {
                this._base.QueryInterface(nsIMyPortalBookmarkNode).resource = resource;
        },

        get resource()
        {
                return this._base.QueryInterface(nsIMyPortalBookmarkNode).resource;
        },

        set parent(parent)
        {
                this._base.QueryInterface(nsIMyPortalBookmarkNode).parent = parent;
        },

        get parent()
        {
                return this._base.QueryInterface(nsIMyPortalBookmarkNode).parent;
        },

        get id()
        {
                return this._base.QueryInterface(nsIMyPortalBookmarkNode).id;
        },

        get name()
        {
                return this._base.QueryInterface(nsIMyPortalBookmarkNode).name;
        },

        get url()
        {
                return this._base.QueryInterface(nsIMyPortalBookmarkNode).url;
        },

        get description()
        {
                return this._base.QueryInterface(nsIMyPortalBookmarkNode).description;
        },

        get icon()
        {
                return this._base.QueryInterface(nsIMyPortalBookmarkNode).icon;
        },

        get lastVisitDate()
        {
                return this._base.QueryInterface(nsIMyPortalBookmarkNode).lastVisitDate;
        },

        get historyDate()
        {
                return this._base.QueryInterface(nsIMyPortalBookmarkNode).historyDate;
        },

        get path()
        {
                return this._base.QueryInterface(nsIMyPortalBookmarkNode).path;
        },

        isRoot: function()
        {
                return this._base.QueryInterface(nsIMyPortalBookmarkNode).isRoot();
        },

        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (iid.equals(nsIMyPortalVisitable) ||
                    iid.equals(nsIMyPortalBookmarkNode) ||
                    iid.equals(nsIMyPortalBookmarkSeparatorNode) ||
                    iid.equals(nsISupports)) {
                            return this;
                }
                throw Components.results.NS_ERROR_NO_INTERFACE;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalBookmarkSeparatorNodeModule =
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
                compMgr.registerFactoryLocation(MYPORTALBOOKMARKSEPARATORNODE_CID,
                                                MYPORTALBOOKMARKSEPARATORNODE_NAME,
                                                MYPORTALBOOKMARKSEPARATORNODE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALBOOKMARKSEPARATORNODE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALBOOKMARKSEPARATORNODE_CID)) {
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
                        return (new nsMyPortalBookmarkSeparatorNode()).QueryInterface(iid);
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
        return nsMyPortalBookmarkSeparatorNodeModule;
}
