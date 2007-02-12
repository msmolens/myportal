/* myportalImage.js
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

//// My Portal Image
//
// Customizable image.
//
// Implements:
// nsIObserver

function MyPortalImage()
{
        this.prefs = Components.classes['@unroutable.org/myportal-preferences-service;1'].getService(Components.interfaces.nsIMyPortalPreferencesService);
        this.image = document.getElementById(this.myportalImageId);

        // Register preference observer
        this.prefs.addObserver('', this, false);
}

MyPortalImage.prototype =
{
        //// Ids

        // Matches value in myportal.html
        myportalImageId: 'myportalImage',


        //// Methods

        unload: function()
        {
                this.prefs.removeObserver('', this);
        },

        update: function()
        {
                var filename = this.imageFilename;
                if (this.displayImage && filename) {
                        try {
                                // Make sure file exists and is local
                                var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
                                var fileHandler = ioService.getProtocolHandler('file').QueryInterface(Components.interfaces.nsIFileProtocolHandler);
                                var file = fileHandler.getFileFromURLSpec(filename);
                                if (file.exists() && file.isFile()) {
                                        this.image.src = filename;
                                        this.show();
                                }
                        } catch (e) {
                                this.image.src = '';
                                this.hide();
                        }
                } else {
                        this.image.src = '';
                        this.hide();
                }
        },

        // Hides image.
        hide: function()
        {
                this.image.style.visibility = 'hidden';
        },

        // Shows image.
        show: function()
        {
                this.image.style.visibility = 'visible';
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
        }
};
