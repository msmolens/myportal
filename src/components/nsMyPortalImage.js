/* nsMyPortalImage.js
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

const MYPORTALIMAGE_NAME = 'My Portal Image';
const MYPORTALIMAGE_CONTRACTID = '@unroutable.org/myportal-image;1';
const MYPORTALIMAGE_CID = Components.ID('{ae4bf6db-69e7-46c8-a996-9ab293cf1d14}');


//// Interface constants

const nsIMyPortalImage = Components.interfaces.nsIMyPortalImage;
const nsIMyPortalPreferencesService = Components.interfaces.nsIMyPortalPreferencesService;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIIOService = Components.interfaces.nsIIOService;
const nsIFileProtocolHandler = Components.interfaces.nsIFileProtocolHandler;


//// My Portal Image
// Implements:
// nsIMyPortalImage
// nsIObserver
// nsISupports

function nsMyPortalImage()
{
        this.prefs = Components.classes['@unroutable.org/myportal-preferences-service;1'].getService(Components.interfaces.nsIMyPortalPreferencesService);

        // Register preference observer
        this.prefs.addObserver('', this, false);
}

nsMyPortalImage.prototype =
{
        //// nsIMyPortalImage methods

        set visible(visible)
        {
                this.image.style.visibility = (visible ? 'visible' : 'hidden');
        },

        get visible()
        {
                return (this.image.style.visibility == 'visible');
        },

        set src(src)
        {
                this.image.src = src;
        },

        get src()
        {
                return this.image.src;
        },

        setImage: function(image)
        {
                this.image = image;
        },

        update: function()
        {
                var filename = this.imageFilename;
                if (this.displayImage && filename) {
                        try {
                                // Make sure file exists and is local
                                var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(nsIIOService);
                                var fileHandler = ioService.getProtocolHandler('file').QueryInterface(nsIFileProtocolHandler);
                                var file = fileHandler.getFileFromURLSpec(filename);
                                if (file.exists() && file.isFile()) {
                                        this.src = filename;
                                        this.visible = true;
                                }
                        } catch (e) {
                                this.src = '';
                                this.visible = false;
                        }
                } else {
                        this.src = '';
                        this.visible = false;
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
                        if (data == 'displayImage' ||
                            data == 'imageFilename') {
                                    this.update();
                            }
                }
        },


        //// Preference getter methods

        get displayImage()
        {
                return this.prefs.getBoolPref('displayImage');
        },

        get imageFilename()
        {
                return this.prefs.getCharPref('imageFilename');
        },

        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsIMyPortalImage) &&
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
var nsMyPortalImageModule =
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
                compMgr.registerFactoryLocation(MYPORTALIMAGE_CID,
                                                MYPORTALIMAGE_NAME,
                                                MYPORTALIMAGE_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALIMAGE_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALIMAGE_CID)) {
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
                        return (new nsMyPortalImage()).QueryInterface(iid);
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
        return nsMyPortalImageModule;
}
