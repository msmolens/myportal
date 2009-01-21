/* nsMyPortalProtocol.js
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

const MYPORTALPROTOCOL_NAME = 'My Portal';
const MYPORTALPROTOCOL_SCHEME = 'myportal';
const MYPORTALPROTOCOL_CONTRACTID = '@mozilla.org/network/protocol;1?name=' + MYPORTALPROTOCOL_SCHEME;
const MYPORTALPROTOCOL_CID = Components.ID('{45baabb1-21e8-46da-bf36-73537ad13eb7}');

const nsISupports = Components.interfaces.nsISupports;
const nsIIOService = Components.interfaces.nsIIOService;
const nsIProtocolHandler = Components.interfaces.nsIProtocolHandler;
const nsIURI = Components.interfaces.nsIURI;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;

//// nsMyPortalProtocol
// Implements:
//   nsISupports
//   nsIProtocolHandler

function nsMyPortalProtocol()
{
}

nsMyPortalProtocol.prototype =
{
        //// nsIProtocolHandler attributes

        scheme: MYPORTALPROTOCOL_SCHEME,
        defaultPort: -1,
        protocolFlags: nsIProtocolHandler.URI_NORELATIVE | nsIProtocolHandler.URI_NOAUTH,


        //// nsIProtocolHandler methods

        allowPort: function(port,
                            scheme)
        {
                return false;
        },

        newURI: function(spec,
                         charset,
                         baseURI)
        {
                var uri = Components.classes['@mozilla.org/network/simple-uri;1'].createInstance(nsIURI);
                if (spec.indexOf('://') != -1) {
                        uri.spec = spec;
                } else {
                        // Assume missing scheme is http
                        uri.spec = 'http://' + spec;
                }
                return uri;
        },

        newChannel: function(aURI)
        {
                const url = 'chrome://myportal/content/myportal.html';
                var ioServ = Components.classes['@mozilla.org/network/io-service;1'].getService(nsIIOService);
                var uri = ioServ.newURI(url, null, null);
                var chan = ioServ.newChannelFromURI(uri);
                return chan;
        },


        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsIProtocolHandler) &&
                    !iid.equals(nsISupports)) {
                        throw Components.results.NS_ERROR_NO_INTERFACE;
                }
                return this;
        }
}


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalProtocolModule =
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
                compMgr.registerFactoryLocation(MYPORTALPROTOCOL_CID,
                                                MYPORTALPROTOCOL_NAME,
                                                MYPORTALPROTOCOL_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALPROTOCOL_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALPROTOCOL_CID)) {
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
                        if (!iid.equals(nsIProtocolHandler) &&
                            !iid.equals(nsISupports)) {
                                throw Components.results.NS_ERROR_NO_INTERFACE;
                        }
                        return (new nsMyPortalProtocol()).QueryInterface(iid);
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
        return nsMyPortalProtocolModule;
}
