/* nsMyPortalDataSource.js
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

const MYPORTALDATASOURCE_NAME = 'My Portal Data Source';
const MYPORTALDATASOURCE_CONTRACTID = '@unroutable.org/myportal-datasource;1';
const MYPORTALDATASOURCE_CID = Components.ID('{197d7627-9fc6-45ae-a442-a96ddbdb78fa}');


//// Interface constants

const nsIMyPortalDataSource = Components.interfaces.nsIMyPortalDataSource;
const nsIMyPortalRDFService = Components.interfaces.nsIMyPortalRDFService;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIRDFContainer = Components.interfaces.nsIRDFContainer;
const nsIRDFContainerUtils = Components.interfaces.nsIRDFContainerUtils;
const nsIRDFService = Components.interfaces.nsIRDFService;
const nsIRDFRemoteDataSource = Components.interfaces.nsIRDFRemoteDataSource;
const nsILocalFile = Components.interfaces.nsILocalFile;
const nsIFileProtocolHandler = Components.interfaces.nsIFileProtocolHandler;
const nsIIOService = Components.interfaces.nsIIOService;
const nsIProperties = Components.interfaces.nsIProperties;


//// My Portal Data Source
// Implements:
// nsIMyPortalDataSource
// nsISupports

function nsMyPortalDataSource()
{
       this.rdfService = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(nsIRDFService);
      this._open();
}

nsMyPortalDataSource.prototype =
{
       filename: 'myportal.rdf',

        // Get profile path.
        _getProfilePath: function()
        {
                var directoryService = Components.classes['@mozilla.org/file/directory_service;1'].getService(nsIProperties);
                return directoryService.get('ProfD', nsILocalFile);
        },

        // Get URL for datasource file.
        // See http://kb.mozillazine.org/File_IO
        _getURL: function()
        {
                // Create file
                var file = this._getProfilePath();
                file.append(this.filename);
                if (!file.exists()) {
                        file.create(nsILocalFile.NORMAL_FILE_TYPE, 0664);
                }

                // Get file URL
                var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(nsIIOService);
                var fileHandler = ioService.getProtocolHandler('file').QueryInterface(nsIFileProtocolHandler);
                var url = fileHandler.getURLSpecFromFile(file);
                return url;
        },

        // Open datasource.
        _open: function()
        {
                var url = this._getURL();
                this.ds = this.rdfService.GetDataSourceBlocking(url);
                this.collapsedContainer = Components.classes['@mozilla.org/rdf/container;1'].createInstance(nsIRDFContainer);

                var rdfService = Components.classes['@unroutable.org/myportal-rdf-service;1'].getService(nsIMyPortalRDFService);
                var collapsedRoot = rdfService.rdfResource('myportalCollapsedRoot');

                var containerUtils = Components.classes['@mozilla.org/rdf/container-utils;1'].getService(nsIRDFContainerUtils);
                containerUtils.MakeBag(this.ds, collapsedRoot);
                this.collapsedContainer.Init(this.ds, collapsedRoot);
        },

        // Check if a container contains a node.
        //
        // container: the container
        // node: the node to search for
        _contains: function(container,
                            node)
        {
                return (-1 != container.IndexOf(node));
        },

        // Insert a node into a container.
        //
        // container: the container
        // node: the node to insert
        _insert: function(container,
                          node)
        {
                container.AppendElement(node);
        },

        // Remove a node from a container.
        //
        // container: the container
        // node: the node to remove
        _remove: function(container,
                          node)
        {
                container.RemoveElement(node, true);
        },


        //// nsIMyPortalDataSource methods

        // Flush the datasource to disk.
        flush: function()
        {
                this.ds.QueryInterface(nsIRDFRemoteDataSource);
                this.ds.Flush();
        },

        // Check if a bookmark folder is collapsed.
        //
        // nodeId: the bookmark folder id
        isCollapsed: function(nodeId)
        {
                var node = this.rdfService.GetLiteral(nodeId);
                return this._contains(this.collapsedContainer, node);
        },

        // Sets a bookmark folder's collapsed state.
        //
        // nodeId: the bookmark folder id
        // collapsed: the collapsed state
        setCollapsed: function(nodeId,
                               collapsed)
        {
                var node = this.rdfService.GetLiteral(nodeId);
                var exists = this._contains(this.collapsedContainer, node);
                if (collapsed) {
                        if (!exists) {
                                this._insert(this.collapsedContainer, node);
                        }
                } else {
                        if (exists) {
                                this._remove(this.collapsedContainer, node);
                        }
                }
        },


        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsIMyPortalDataSource) &&
                    !iid.equals(nsISupports)) {
                            throw Components.results.NS_ERROR_NO_INTERFACE;
                    }
                return this;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalDataSourceModule =
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
                compMgr.registerFactoryLocation(MYPORTALDATASOURCE_CID,
                                                MYPORTALDATASOURCE_NAME,
                                                MYPORTALDATASOURCE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALDATASOURCE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALDATASOURCE_CID)) {
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
                        return (new nsMyPortalDataSource()).QueryInterface(iid);
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
        return nsMyPortalDataSourceModule;
}
