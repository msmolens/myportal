/* nsMyPortalLogo.js
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

const MYPORTALLOGO_NAME = 'My Portal Logo';
const MYPORTALLOGO_CONTRACTID = '@unroutable.org/myportal-logo;1';
const MYPORTALLOGO_CID = Components.ID('{7712db62-d619-4f89-9ecd-4d47ef2fc61b}');


//// Interface constants

const nsIMyPortalLogo = Components.interfaces.nsIMyPortalLogo;
const nsIMyPortalPreferencesService = Components.interfaces.nsIMyPortalPreferencesService;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;


//// My Portal Logo
// Implements:
// nsIMyPortalLogo
// nsIObserver
// nsISupports

function nsMyPortalLogo()
{
        this.prefs = Components.classes['@unroutable.org/myportal-preferences-service;1'].getService(nsIMyPortalPreferencesService);

        // Register preference observer
        this.prefs.addObserver('', this, false);
}

nsMyPortalLogo.prototype =
{
        //// Ids

        // Match values in myportal.html
        myportalLogoContainerId: 'myportalLogoContainer',
        myportalLogoId: 'myportalLogo',
        myportalLogoLinkId: 'myportalLogoLink',

        // Return a new logo element.
        _newLogo: function()
        {
                var link = this.document.createElement('a');
                link.id = this.myportalLogoLinkId;
                link.href = 'myportal://';

                var image = this.document.createElement('img');
                image.id = this.myportalLogoId;
                image.src = this.logoFilename;
                image.alt = "My Portal";

                link.appendChild(image);
                return link;
        },


        //// nsIMyPortalLogo methods

        setDocument: function(document)
        {
                this.document = document;
        },

        update: function()
        {
                // Clear container
                var container = this.document.getElementById(this.myportalLogoContainerId);
                while (container.hasChildNodes()) {
                        container.removeChild(container.firstChild);
                }

                // Add logo
                if (this.displayLogo) {
                        container.appendChild(this._newLogo());
                }
        },

        unload: function()
        {
                this.prefs.removeObserver('', this);
        },

        //// nsIObserver methods

        observe: function(subject,
                          topic,
                          data)
        {
                if (topic == 'nsPref:changed') {
                        if (data == 'displayLogo' ||
                            data == 'logoFilename') {
                                    this.update();
                            }
                }
        },


        //// Preference getter methods

        get displayLogo()
        {
                return this.prefs.getBoolPref('displayLogo');
        },

        get logoFilename()
        {
                return this.prefs.getCharPref('logoFilename');
        },


        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsIMyPortalLogo) &&
                    !iid.equals(nsIObserver) &&
                    !iid.equals(nsISupports)) {
                            throw Components.results.NS_ERROR_NO_INTERFACE;
                    }
                return this;
        }
};


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalLogoModule =
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
                compMgr.registerFactoryLocation(MYPORTALLOGO_CID,
                                                MYPORTALLOGO_NAME,
                                                MYPORTALLOGO_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALLOGO_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALLOGO_CID)) {
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
                        return (new nsMyPortalLogo()).QueryInterface(iid);
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
        return nsMyPortalLogoModule;
}
