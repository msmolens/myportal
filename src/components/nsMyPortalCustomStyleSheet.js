/* nsMyPortalCustomStyleSheet.js
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

const MYPORTALCUSTOMSTYLESHEET_NAME = 'My Portal Custom Style Sheet';
const MYPORTALCUSTOMSTYLESHEET_CONTRACTID = '@unroutable.org/myportal-custom-stylesheet;1';
const MYPORTALCUSTOMSTYLESHEET_CID = Components.ID('{8fb11216-9461-4343-867e-168f6d458401}');


//// Interface constants

const nsIMyPortalCustomStyleSheet = Components.interfaces.nsIMyPortalCustomStyleSheet;
const nsIMyPortalPreferencesService = Components.interfaces.nsIMyPortalPreferencesService;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIIOService = Components.interfaces.nsIIOService;
const nsIFileProtocolHandler = Components.interfaces.nsIFileProtocolHandler;


//// My Portal Custom Style Sheet
// Implements:
// nsIMyPortalCustomStyleSheet
// nsIObserver
// nsISupports

function nsMyPortalCustomStyleSheet()
{
        this.prefs = Components.classes['@unroutable.org/myportal-preferences-service;1'].getService(nsIMyPortalPreferencesService);

        // Register preference observer
        this.prefs.addObserver('', this, false);
}

nsMyPortalCustomStyleSheet.prototype =
{
        // Reads custom style sheet from file.
        //
        // file: nsIFile containing the style sheet
        _readCustomStyleSheet: function(file)
        {
                var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
                var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
                fstream.init(file, 0x01, 0x444, 0); // PR_RDONLY, PR_IRUSR | PR_IRGRP | PR_IROTH
                sstream.init(fstream);

                var css = '';
                const BufSize = 4096;
                var buf = sstream.read(BufSize);
                while (buf.length > 0) {
                        css += buf;
                        buf = sstream.read(BufSize);
                }
                sstream.close();
                fstream.close();

                return css;
        },


        //// nsIMyPortalCustomStyleSheet methods

        setStyle: function(style)
        {
                this.style = style;
        },

        update: function()
        {
                var useCustomStyleSheet = this.useCustomStyleSheet;
                this.style.disabled = !useCustomStyleSheet;
                if (useCustomStyleSheet) {
                        try {
                                // Make sure file exists and is local
                                var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(nsIIOService);
                                var fileHandler = ioService.getProtocolHandler('file').QueryInterface(nsIFileProtocolHandler);
                                var file = fileHandler.getFileFromURLSpec(this.customStyleSheetFilename);
                                if (file.exists() && file.isFile()) {
                                        // FIREFOX2 import causes security error, load CSS directly from file instead
//                                      this.style.innerHTML = '@import url("' + this.customStyleSheetFilename + '");';
                                        var css = this._readCustomStyleSheet(file);
                                        this.style.innerHTML = css;
                                }
                        } catch (e) {
                                this.style.innerHTML = '';
                        }
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
                        if (data == 'useCustomStyleSheet' ||
                            data == 'customStyleSheetFilename') {
                                    this.update();
                            }
                }
        },


        //// Preference getter methods

        get useCustomStyleSheet()
        {
                return this.prefs.getBoolPref('useCustomStyleSheet');
        },

        get customStyleSheetFilename()
        {
                return this.prefs.getCharPref('customStyleSheetFilename');
        },


        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsIMyPortalCustomStyleSheet) &&
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
var nsMyPortalCustomStyleSheetModule =
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
                compMgr.registerFactoryLocation(MYPORTALCUSTOMSTYLESHEET_CID,
                                                MYPORTALCUSTOMSTYLESHEET_NAME,
                                                MYPORTALCUSTOMSTYLESHEET_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALCUSTOMSTYLESHEET_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALCUSTOMSTYLESHEET_CID)) {
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
                        return (new nsMyPortalCustomStyleSheet()).QueryInterface(iid);
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
        return nsMyPortalCustomStyleSheetModule;
}
