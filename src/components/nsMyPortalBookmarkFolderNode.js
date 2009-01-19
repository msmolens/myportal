/* nsMyPortalBookmarkFolderNode.js
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

const MYPORTALBOOKMARKFOLDERNODE_NAME = 'My Portal Bookmark Folder Node';
const MYPORTALBOOKMARKFOLDERNODE_CONTRACTID = '@unroutable.org/myportal-bookmark-folder-node;1';
const MYPORTALBOOKMARKFOLDERNODE_CID = Components.ID('{fed1cc95-c0ef-4077-a4bd-b23f3c196a8f}');


//// Interface constants

const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIMyPortalVisitable = Components.interfaces.nsIMyPortalVisitable;
const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsIMyPortalBookmarkContainerNode = Components.interfaces.nsIMyPortalBookmarkContainerNode;
const nsIMyPortalBookmarkFolderNode = Components.interfaces.nsIMyPortalBookmarkFolderNode;
const nsIMyPortalBookmarkFolderNodeVisitor = Components.interfaces.nsIMyPortalBookmarkFolderNodeVisitor;
const nsIMyPortalBookmarkContainerNodeVisitor = Components.interfaces.nsIMyPortalBookmarkContainerNodeVisitor;

//// My Portal Bookmark Folder Node
// Implements:
// nsIMyPortalVisitable
// nsIMyPortalBookmarkContainerNode
// nsIMyPortalBookmarkFolderNode
// nsIMyPortalBookmarkNode
// nsISupports

function nsMyPortalBookmarkFolderNode()
{
        this._base = Components.classes['@unroutable.org/myportal-bookmark-container-node;1'].createInstance(nsIMyPortalBookmarkContainerNode);
}

nsMyPortalBookmarkFolderNode.prototype =
{
        //// nsIMyPortalVisitable methods

        accept: function(visitor)
        {
                if (visitor instanceof nsIMyPortalBookmarkFolderNodeVisitor) {
                        visitor.visitBookmarkFolderNode(this);
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

        findById: function(id)
        {
                return this._base.findById(id);
        },

        // TODO findByIds

        findByURL: function(url)
        {
                return this._base.findByURL(url);
        },

        findFolderById: function(id)
        {
                return this._base.findFolderById(id);
        },

        findFolderByPath: function(path)
        {
                return this._base.findFolderByPath(path);
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
                    iid.equals(nsIMyPortalBookmarkContainerNode) ||
                    iid.equals(nsIMyPortalBookmarkFolderNode) ||
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
var nsMyPortalBookmarkFolderNodeModule =
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
                compMgr.registerFactoryLocation(MYPORTALBOOKMARKFOLDERNODE_CID,
                                                MYPORTALBOOKMARKFOLDERNODE_NAME,
                                                MYPORTALBOOKMARKFOLDERNODE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALBOOKMARKFOLDERNODE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALBOOKMARKFOLDERNODE_CID)) {
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
                        return (new nsMyPortalBookmarkFolderNode()).QueryInterface(iid);
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
        return nsMyPortalBookmarkFolderNodeModule;
}
