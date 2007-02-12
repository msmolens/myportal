/* nsMyPortalPreferencesService.js
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

const MYPORTALPREFERENCESSERVICE_NAME = 'My Portal Preferences Service';
const MYPORTALPREFERENCESSERVICE_CONTRACTID = '@unroutable.org/myportal-preferences-service;1';
const MYPORTALPREFERENCESSERVICE_CID = Components.ID('{03d6a2e5-b546-4116-bb9d-344b2d9ff87e}');


//// Interface constants

const nsISupports = Components.interfaces.nsISupports;
const nsIMyPortalPreferencesService = Components.interfaces.nsIMyPortalPreferencesService;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIPrefService = Components.interfaces.nsIPrefService;
const nsIPrefBranch2 = Components.interfaces.nsIPrefBranch2;


//// nsMyPortalPreferencesService
// Implements:
// nsIMyPortalPreferencesService
// nsISupports

function nsMyPortalPreferencesService()
{
        // Init preferences service
        var preferencesService = Components.classes['@mozilla.org/preferences-service;1'].getService(nsIPrefService);
        this.prefs = preferencesService.getBranch('myportal.');
        this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
}

nsMyPortalPreferencesService.prototype =
{
        getBoolPref: function(name)
        {
                return this.prefs.getBoolPref(name);
        },

        setBoolPref: function(name,
                              value)
        {
                this.prefs.setBoolPref(name, value);
        },

        getCharPref: function(name)
        {
                return this.prefs.getCharPref(name);
        },

        setCharPref: function(name,
                              value)
        {
                this.prefs.setCharPref(name, value);
        },

        getIntPref: function(name)
        {
                return this.prefs.getIntPref(name);
        },

        setIntPref: function(name,
                             value)
        {
                this.prefs.setIntPref(name, value);
        },

        addObserver: function(domain,
                              observer)
        {
                this.prefs.addObserver(domain, observer, false);
        },

        removeObserver: function(domain,
                                 observer)
        {
                this.prefs.removeObserver(domain, observer);
        },


        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsIMyPortalPreferencesService) &&
                    !iid.equals(nsISupports)) {
                            throw Components.results.NS_ERROR_NO_INTERFACE;
                    }
                return this;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalPreferencesServiceModule =
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
                compMgr.registerFactoryLocation(MYPORTALPREFERENCESSERVICE_CID,
                                                MYPORTALPREFERENCESSERVICE_NAME,
                                                MYPORTALPREFERENCESSERVICE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALPREFERENCESSERVICE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALPREFERENCESSERVICE_CID)) {
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
                        return (new nsMyPortalPreferencesService()).QueryInterface(iid);
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
        return nsMyPortalPreferencesServiceModule;
}
