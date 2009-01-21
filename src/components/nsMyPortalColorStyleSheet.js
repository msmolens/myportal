/* nsMyPortalColorStyleSheet.js
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

const MYPORTALCOLORSTYLESHEET_NAME = 'My Portal Color Style Sheet';
const MYPORTALCOLORSTYLESHEET_CONTRACTID = '@unroutable.org/myportal-color-stylesheet;1';
const MYPORTALCOLORSTYLESHEET_CID = Components.ID('{55c08feb-34cf-4bce-80cd-ddb87d8189ae}');


//// Interface constants

const nsIMyPortalColorStyleSheet = Components.interfaces.nsIMyPortalColorStyleSheet;
const nsIMyPortalPreferencesService = Components.interfaces.nsIMyPortalPreferencesService;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;


//// My Portal Color Style Sheet
// Implements:
// nsIMyPortalColorStyleSheet
// nsIObserver
// nsISupports

function nsMyPortalColorStyleSheet()
{
        this.prefs = Components.classes['@unroutable.org/myportal-preferences-service;1'].getService(nsIMyPortalPreferencesService);

        // Register preference observer
        this.prefs.addObserver('', this, false);
}

nsMyPortalColorStyleSheet.prototype =
{
        //// System color CSS properties

        systemTextColor: 'HighlightText',
        systemBackgroundColor: 'Highlight',


        //// nsIMyPortalColorStyleSheet methods

        setStyleSheet: function(styleSheet)
        {
                this.styleSheet = styleSheet;
        },

        update: function()
        {
                // myportalColors.css
                // Index matches order in myportal.html
                var rules = this.styleSheet.cssRules;

                // Indexes match order in myportalColors.css
                var folderHeadingRule = rules[1];
                var folderHeadingLinkRule = rules[2];

                // Set colors using system colors or from preferences
                var folderHeadingTextColor = null;
                var folderHeadingBackgroundColor = null;
                if (this.matchSystemTheme) {
                        folderHeadingTextColor = this.systemTextColor;
                        folderHeadingBackgroundColor = this.systemBackgroundColor;
                } else {
                        folderHeadingTextColor = this.folderHeadingTextColor;
                        folderHeadingBackgroundColor = this.folderHeadingBackgroundColor;
                }
                folderHeadingRule.style.color = folderHeadingTextColor;
                folderHeadingLinkRule.style.color = folderHeadingTextColor;
                folderHeadingRule.style.backgroundColor = folderHeadingBackgroundColor;
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
                        if (data == 'matchSystemTheme' ||
                            data == 'folderHeadingTextColor' ||
                            data == 'folderHeadingBackgroundColor') {
                                    this.update();
                            }
                }
        },


        //// Preference getter methods

        get matchSystemTheme()
        {
                return this.prefs.getBoolPref('matchSystemTheme');
        },

        get folderHeadingTextColor()
        {
                return this.prefs.getCharPref('folderHeadingTextColor');
        },

        get folderHeadingBackgroundColor()
        {
                return this.prefs.getCharPref('folderHeadingBackgroundColor');
        },


        //// nsISupports methods

        QueryInterface: function(iid)
        {
                if (!iid.equals(nsIMyPortalColorStyleSheet) &&
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
var nsMyPortalColorStyleSheetModule =
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
                compMgr.registerFactoryLocation(MYPORTALCOLORSTYLESHEET_CID,
                                                MYPORTALCOLORSTYLESHEET_NAME,
                                                MYPORTALCOLORSTYLESHEET_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALCOLORSTYLESHEET_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALCOLORSTYLESHEET_CID)) {
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
                        return (new nsMyPortalColorStyleSheet()).QueryInterface(iid);
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
        return nsMyPortalColorStyleSheetModule;
}
