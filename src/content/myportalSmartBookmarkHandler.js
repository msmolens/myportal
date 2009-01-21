/* myportalSmartBookmarkHandler.js
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

//// My Portal Smart Bookmark Handler
//
// Smart bookmark operations.

// Constructor.
function MyPortalSmartBookmarkHandler() {}

MyPortalSmartBookmarkHandler.prototype =
{
        // Callback for button press to load smart bookmark.
        load: function(event, itemId)
        {
                return this.submit(itemId, event);
        },

        // Simulates smart bookmark's form submission by adding the search value and browsing to the URL.
        //
        // textboxId: id of smart bookmark's textbox
        // event: event if called from this.load
        submit: function(textboxId,
                         event)
        {
                var textbox = document.getElementById(textboxId);
                var url = textbox.getAttribute('url').replace(/%s/g, textbox.value);
                var shiftPressed = event && event.shiftKey;
                if (!event || event.type == 'command') {
                        if (shiftPressed) {
                                // Command: load in new window
                                window.open(url);
                        } else {
                                // Command: load in self
                                window.location = url;
                        }
                } else if (event.type == 'click' && event.button == 1) {
                        // Middle click: load in new tab
                        event.stopPropagation();
                        this.openInNewTab(url);
                }
                return true;
        },
        
        openInNewTab: function(url)
        {
                var fuelApp = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
                var window = fuelApp.activeWindow;
                var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
                var uri = ioService.newURI(url, null, null);
                window.open(uri);
        }
};
