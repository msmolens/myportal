/* nsMyPortalBookmarksTree.js
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

const MYPORTALBOOKMARKSTREE_NAME = 'My Portal Bookmarks Tree';
const MYPORTALBOOKMARKSTREE_CONTRACTID = '@unroutable.org/myportal-bookmarks-tree;1';
const MYPORTALBOOKMARKSTREE_CID = Components.ID('{90cc1d57-ec8c-4acd-96fc-2181a679da36}');


//// Interface constants

const nsIMyPortalBookmarksTree = Components.interfaces.nsIMyPortalBookmarksTree;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIMutableArray = Components.interfaces.nsIMutableArray;
const nsIRDFService = Components.interfaces.nsIRDFService;
const nsIRDFContainerUtils = Components.interfaces.nsIRDFContainerUtils;
const nsIRDFLiteral = Components.interfaces.nsIRDFLiteral;
const nsIMyPortalRDFService = Components.interfaces.nsIMyPortalRDFService;
const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsIMyPortalBookmarkContainerNode = Components.interfaces.nsIMyPortalBookmarkContainerNode;
const nsIMyPortalLivemarkNode = Components.interfaces.nsIMyPortalLivemarkNode;
const nsIMyPortalVisitable = Components.interfaces.nsIMyPortalVisitable;
const nsIMyPortalBookmarkNodeVisitor = Components.interfaces.nsIMyPortalBookmarkNodeVisitor;
const nsIMyPortalBookmarkContainerNodeVisitor = Components.interfaces.nsIMyPortalBookmarkContainerNodeVisitor;
const nsIMyPortalBookmarkFolderNodeVisitor = Components.interfaces.nsIMyPortalBookmarkFolderNodeVisitor;
const nsIMyPortalNormalBookmarkNodeVisitor = Components.interfaces.nsIMyPortalNormalBookmarkNodeVisitor;


//// Services

var rdfService = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(nsIRDFService);
var containerUtils = Components.classes['@mozilla.org/rdf/container-utils;1'].getService(nsIRDFContainerUtils);


//// Hash table

function HashTable()
{
}

HashTable.prototype =
{
        // Get the value corresponding to key
        get: function(key)
        {
                if (this.hasOwnProperty(key)) {
                        return this[key];
                }
                return null;
        }
};

function URLHashTableVisitor(hashTable)
{
        this._hashTable = hashTable;
}


URLHashTableVisitor.prototype =
{
        visitBookmarkFolderNode: function(node)
        {
                if (!(node instanceof nsIMyPortalBookmarkContainerNode)) {
                        return;
                }

                var children = node.children.enumerate();
                while (children.hasMoreElements()) {
                        let child = children.getNext().QueryInterface(nsIMyPortalVisitable);
                        child.accept(this);
                }
        },

        visitNormalBookmarkNode: function(node)
        {
                if (!(node instanceof nsIMyPortalBookmarkNode)) {
                        return;
                }

                var url = node.url;
                if (url) {
                        var array = this._hashTable.get(url);
                        if (!array) {
                                array = new Array();
                                this._hashTable[url] = array;
                        }
                        array.push(node);
                }
        },

        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (iid.equals(nsIMyPortalNormalBookmarkNodeVisitor) ||
                    iid.equals(nsIMyPortalBookmarkFolderNodeVisitor) ||
                    iid.equals(nsIMyPortalBookmarkNodeVisitor) ||
                    iid.equals(nsISupports)) {
                            return this;
                }
                throw Components.results.NS_ERROR_NO_INTERFACE;
        }
};


//// My Portal Bookmarks Tree
//
// Bookmarks tree data structure.
//
// Implements:
// nsIMyPortalBookmarksTree
// nsISupports
//

// Constructor.
function nsMyPortalBookmarksTree()
{
        this.root = null;
        this._dirty = true;

        // Init bookmarks data source
        this.bookmarksDataSource = rdfService.GetDataSource('rdf:bookmarks');

        // Init bookmark node factory
        this.factory = new BookmarkNodeFactory();
}

nsMyPortalBookmarksTree.prototype =
{

        // Builds tree recursively.
        //
        // resource: RDF resource
        // parent: parent BookmarkNode
        _build: function(resource,
                         parent)
        {
                var node = this.factory.createBookmarkNode(resource, parent);
                if (parent) {
                        parent.addChild(node);
                }
                if (node instanceof nsIMyPortalBookmarkContainerNode)
                {
                        var container = containerUtils.MakeSeq(this.bookmarksDataSource, node.resource);
                        var children = container.GetElements();
                        while (children.hasMoreElements()) {
                                this._build(children.getNext(), node);
                        }
                }
                return node;
        },

        // Rebuilds tree if necessary.
        _ensureCurrent: function()
        {
                if (this._dirty) {
                        this.rebuild();
                }
        },

        //// nsIMyPortalBookmarksTree methods

        rebuild: function()
        {
                // TEMP
                dump('rebuild\n');

                var myportalRDFService = Components.classes['@unroutable.org/myportal-rdf-service;1'].getService(nsIMyPortalRDFService);
                var rdfBookmarksRoot = myportalRDFService.rdfResource('bookmarksRoot');
                this.root = this._build(rdfBookmarksRoot, null).QueryInterface(nsIMyPortalBookmarkContainerNode);
                this._dirty = false;

                this._urlHashTable = new HashTable();
                var urlHashTableVisitor = new URLHashTableVisitor(this._urlHashTable);
                urlHashTableVisitor.QueryInterface(nsIMyPortalBookmarkNodeVisitor);
                this.root.QueryInterface(nsIMyPortalVisitable);
                this.root.accept(urlHashTableVisitor);
        },

        findById: function(id)
        {
                this._ensureCurrent();
                return this.root.findById(id);
        },

        // TODO
//        findByIds: function(nodes)
//        {
//                this._ensureCurrent();
//                this.root.findByIds(nodes);
//        },

        findByURL: function(url)
        {
                this._ensureCurrent();
                // TEMP
//                return this.root.findByURL(url);

                var nodes = this._urlHashTable.get(url);
                if (!nodes) {
                        return null;
                }

                var array = Components.classes['@mozilla.org/array;1'].createInstance(nsIMutableArray);
                for (var i = 0; i < nodes.length; i++) {
                        array.appendElement(nodes[i], false);
                }
                return array;
        },

        findFolderById: function(id)
        {
                this._ensureCurrent();
                return this.root.findFolderById(id);
        },

        findFolderByPath: function(path)
        {
                this._ensureCurrent();
                return this.root.findFolderByPath(path);
        },

        get rootName()
        {
                this._ensureCurrent();
                this.root.QueryInterface(nsIMyPortalBookmarkNode);
                return this.root.name;
        },

        set dirty(dirty)
        {
                this._dirty = dirty;
        },

        get dirty()
        {
                return this._dirty;
        },

        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (iid.equals(nsIMyPortalBookmarksTree) ||
                    iid.equals(nsISupports)) {
                            return this;
                }
                throw Components.results.NS_ERROR_NO_INTERFACE;
        }
};

//// BookmarkNode Factory
//
// Creates BookmarkNode instances.

// Constructor.
function BookmarkNodeFactory()
{
        // Init bookmarks data source
        this.bookmarksDataSource = rdfService.GetDataSource('rdf:bookmarks');

        var myportalRDFService = Components.classes['@unroutable.org/myportal-rdf-service;1'].getService(nsIMyPortalRDFService);
        this._rdfBookmark = myportalRDFService.rdfResource('bookmark');
        this._rdfFolder = myportalRDFService.rdfResource('folder');
        this._rdfLivemark = myportalRDFService.rdfResource('livemark');
        this._rdfBookmarkSeparator = myportalRDFService.rdfResource('bookmarkSeparator');
        this._rdfType = myportalRDFService.rdfResource('type');
        this._rdfURL = myportalRDFService.rdfResource('url');
}

BookmarkNodeFactory.prototype =
{
        // Returns an appropriate BookmarkNode subclass based on the resource type.
        //
        // resource: RDF resource
        // parent: parent BookmarkNode
        createBookmarkNode: function(resource,
                                     parent)
        {
                if (this.isBookmark(resource)) {
                        if (parent instanceof nsIMyPortalLivemarkNode)
                        {
                                var node = Components.classes['@unroutable.org/myportal-livemark-bookmark-node;1'].createInstance(nsIMyPortalBookmarkNode);
                                node.resource = resource;
                                node.parent = parent;
                                return node;
                        }

                        if (this.isSmartBookmark(resource)) {
                                var node = Components.classes['@unroutable.org/myportal-smart-bookmark-node;1'].createInstance(nsIMyPortalBookmarkNode);
                                node.resource = resource;
                                node.parent = parent;
                                return node;
                        }

                        var node = Components.classes['@unroutable.org/myportal-normal-bookmark-node;1'].createInstance(nsIMyPortalBookmarkNode);
                        node.resource = resource;
                        node.parent = parent;
                        return node;

                } else if (this.isFolder(resource)) {
                        var node = Components.classes['@unroutable.org/myportal-bookmark-folder-node;1'].createInstance(nsIMyPortalBookmarkNode);
                        node.resource = resource;
                        node.parent = parent;
                        return node;
                } else if (this.isLivemark(resource)) {
                        var node = Components.classes['@unroutable.org/myportal-livemark-node;1'].createInstance(nsIMyPortalBookmarkNode);
                        node.resource = resource;
                        node.parent = parent;
                        return node;
                } else if (this.isSeparator(resource)) {
                        var node = Components.classes['@unroutable.org/myportal-bookmark-separator-node;1'].createInstance(nsIMyPortalBookmarkNode);
                        node.resource = resource;
                        node.parent = parent;
                        return node;
                }

                throw 'Unrecognized resource type';
                return null;
        },

        // Returns true if resource is a bookmark.
        isBookmark: function(resource)
        {
                return (this._rdfBookmark == this.bookmarksDataSource.GetTarget(resource, this._rdfType, true));
        },

        // Returns true if resource is a smart bookmark.
        isSmartBookmark: function(resource)
        {
                var target = this.bookmarksDataSource.GetTarget(resource, this._rdfURL, true);
                if (target instanceof nsIRDFLiteral) {
                        return /%s/.test(target.Value);
                }
                return false;
        },

        // Returns true if resource is a folder.
        isFolder: function(resource)
        {
                return (this._rdfFolder == this.bookmarksDataSource.GetTarget(resource, this._rdfType, true));
        },

        // Returns true if resource is a livemark.
        isLivemark: function(resource)
        {
                return (this._rdfLivemark == this.bookmarksDataSource.GetTarget(resource, this._rdfType, true));
        },

        // Returns true if resource is a separator.
        isSeparator: function(resource)
        {
                return (this._rdfBookmarkSeparator == this.bookmarksDataSource.GetTarget(resource, this._rdfType, true));
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalBookmarksTreeModule =
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
                compMgr.registerFactoryLocation(MYPORTALBOOKMARKSTREE_CID,
                                                MYPORTALBOOKMARKSTREE_NAME,
                                                MYPORTALBOOKMARKSTREE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALBOOKMARKSTREE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALBOOKMARKSTREE_CID)) {
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
                        return (new nsMyPortalBookmarksTree()).QueryInterface(iid);
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
        return nsMyPortalBookmarksTreeModule;
}
