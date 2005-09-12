/* myportalCustomStyleSheet.js
 * Copyright (C) 2005 Max Smolens
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

//// My Portal Custom Style Sheet
//
// Custom style sheet operations.

// Constructor.
//
// prefs: preferences service
function MyPortalCustomStyleSheet(prefs)
{
        this.prefs = prefs;
}

MyPortalCustomStyleSheet.prototype =
{
        //// Ids

        // Matches value in myportal.html
        customStyleSheetId: 'customStyleSheet',


        //// Methods

        update: function()
        {
                var customStyleSheet = document.getElementById(this.customStyleSheetId);
                var useCustomStyleSheet = this.useCustomStyleSheet;
                customStyleSheet.disabled = !useCustomStyleSheet;
                if (useCustomStyleSheet) {
                        try {
                                // Make sure file exists and is local
                                var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
                                var fileHandler = ioService.getProtocolHandler('file').QueryInterface(Components.interfaces.nsIFileProtocolHandler);
                                var file = fileHandler.getFileFromURLSpec(this.customStyleSheetFilename);
                                if (file.exists() && file.isFile()) {
                                        customStyleSheet.innerHTML = '@import url("' + this.customStyleSheetFilename + '");';
                                }
                        } catch (e) {
                                customStyleSheet.innerHTML = '';
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
        }
};
