/* nsMyPortalPreferencesUtil.js
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

const MYPORTALPREFERENCESUTIL_NAME = 'My Portal Preferences Utility';
const MYPORTALPREFERENCESUTIL_CONTRACTID = '@unroutable.org/myportal-preferences-util;1';
const MYPORTALPREFERENCESUTIL_CID = Components.ID('{21f8d880-897d-46d0-8b16-cfbf15cc635d}');


//// Interface constants

const nsISupports = Components.interfaces.nsISupports;
const nsIMyPortalPreferencesUtil = Components.interfaces.nsIMyPortalPreferencesUtil;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIPromptService = Components.interfaces.nsIPromptService;
const nsIStringBundleService = Components.interfaces.nsIStringBundleService;
const nsIIOService = Components.interfaces.nsIIOService;
const nsIFilePicker = Components.interfaces.nsIFilePicker;


//// nsMyPortalPreferencesUtil
// Implements:
// nsIMyPortalPreferencesUtil
// nsISupports

function nsMyPortalPreferencesUtil()
{
        this._window = null;
        this._document = null;

        // Init stringbundle service
        const stringBundleURL = 'chrome://myportal/locale/myportal.properties';
        var stringBundleService = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(nsIStringBundleService);
        this.stringBundle = stringBundleService.createBundle(stringBundleURL);
}

nsMyPortalPreferencesUtil.prototype =
{
        // Load the default value for a preference.
        //
        // pref: preference
        _loadDefault: function(pref)
        {
                if (pref.hasUserValue) {
                        pref.reset();
                }
        },

        // Show file picker and apply selection to textbox.
        //
        // fp: file picker
        // textboxId: id of textbox
        _showFilePicker: function(fp,
                                  textboxId)
        {
                var result = fp.show();
                if (result == nsIFilePicker.returnOK) {
                        try {
                                var uri = Components.classes["@mozilla.org/network/io-service;1"].getService(nsIIOService).newFileURI(fp.file, null, null);
                                var element = this._document.getElementById(textboxId);
                                element.value = uri.spec;
                                element.doCommand();
                        } catch (e) {}
                }
        },


        //// nsIMyPortalPreferencesUtil methods

        get window()
        {
                return this._window;
        },

        set window(aWindow)
        {
                this._window = aWindow;
                this._document = this._window.document;
        },

        loadDefaults: function()
        {
                var promptService = Components.classes['@mozilla.org/embedcomp/prompt-service;1'].getService(nsIPromptService);
                var title = this.stringBundle.GetStringFromName('preferences.prompt.default.title');
                var message = this.stringBundle.GetStringFromName('preferences.prompt.default.message');
                var confirmed = promptService.confirm(this._window, title, message);
                if (confirmed) {
                        var preferences = this._document.getElementsByTagName('preference');
                        for (var i = 0; i < preferences.length; i++) {
                                this._loadDefault(preferences[i]);
                        }
                }
        },

        updateDisabled: function(preferenceId,
                                 updateIdList,
                                 invert)
        {
                // Determine if related elements should be disabled
                var preference = this._document.getElementById(preferenceId);
                var disabled = invert ? preference.value : !preference.value;

                // Extract element ids from list
                var ids = updateIdList.split(',').map(function(s) {
                        return s.replace(/^\s*(.*)\s*$/, '$1');
                });

                // Set disabled property for elements
                ids.forEach(function(id) {
                        var element = this.getElementById(id);
                        element.disabled = disabled;
                }, this._document);
        },

        clampMin: function(id,
                            min)
        {
                var element = this._document.getElementById(id);
                var value = parseInt(element.value);
                if (isNaN(value)) {
                        value = '';
                } else if (value < min) {
                        value = min;
                }
                element.value = value;
                return value;
        },

        browseCustomImage: function(event)
        {
                const title = 'preferences.filepicker.image.title';
                const textboxId = 'imageFilenameTextbox';
                const nsIFilePicker = Components.interfaces.nsIFilePicker;
                var fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
                fp.init(this._window, this.stringBundle.GetStringFromName(title), nsIFilePicker.modeOpen);

                // Append filters separately to force image filter to be default
                fp.appendFilters(nsIFilePicker.filterImages);
                fp.appendFilters(nsIFilePicker.filterAll);
                this._showFilePicker(fp, textboxId);
        },

        browseCustomStyleSheet: function(event)
        {
                const title = 'preferences.filepicker.stylesheet.title';
                const styleSheetsFileDescription = 'preferences.filepicker.stylesheet.description';
                const textboxId = 'customStyleSheetFilenameTextbox';
                const nsIFilePicker = Components.interfaces.nsIFilePicker;
                var fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
                fp.init(this._window, this.stringBundle.GetStringFromName(title), nsIFilePicker.modeOpen);
                fp.appendFilter(this.stringBundle.GetStringFromName(styleSheetsFileDescription), '*.css');
                fp.appendFilters(nsIFilePicker.filterAll);
                this._showFilePicker(fp, textboxId);
        },


        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsIMyPortalPreferencesUtil) &&
                    !iid.equals(nsISupports)) {
                            throw Components.results.NS_ERROR_NO_INTERFACE;
                    }
                return this;
        }
};

//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalPreferencesUtilModule =
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
                compMgr.registerFactoryLocation(MYPORTALPREFERENCESUTIL_CID,
                                                MYPORTALPREFERENCESUTIL_NAME,
                                                MYPORTALPREFERENCESUTIL_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALPREFERENCESUTIL_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALPREFERENCESUTIL_CID)) {
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
                        return (new nsMyPortalPreferencesUtil()).QueryInterface(iid);
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
        return nsMyPortalPreferencesUtilModule;
}
