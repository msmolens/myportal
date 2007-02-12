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
//
// Implements:
// nsIObserver

function MyPortalCustomStyleSheet()
{
        this.prefs = Components.classes['@unroutable.org/myportal-preferences-service;1'].getService(Components.interfaces.nsIMyPortalPreferencesService);

        // Register preference observer
        this.prefs.addObserver('', this, false);
}

MyPortalCustomStyleSheet.prototype =
{
        //// Ids

        // Matches value in myportal.html
        customStyleSheetId: 'customStyleSheet',


        //// Methods

        unload: function()
        {
                this.prefs.removeObserver('', this);
        },

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
                                        // FIREFOX2 import causes security error, load CSS directly from file instead
//                                      customStyleSheet.innerHTML = '@import url("' + this.customStyleSheetFilename + '");';
                                        var css = this._readCustomStyleSheet(file);
                                        customStyleSheet.innerHTML = css;
                                }
                        } catch (e) {
                                customStyleSheet.innerHTML = '';
                        }
                }
        },

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
        }
};
