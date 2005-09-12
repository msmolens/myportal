/* myportalLogo.js
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

//// My Portal Logo
//
// Logo operations.

// Constructor.
//
// prefs: preferences service
function MyPortalLogo(prefs)
{
        this.prefs = prefs;
}

MyPortalLogo.prototype =
{
        //// Ids

        // Match values in myportal.html
        myportalLogoContainerId: 'myportalLogoContainer',
        myportalLogoId: 'myportalLogo',
        myportalLogoLinkId: 'myportalLogoLink',


        //// Methods

        // Adds or removes logo.
        update: function()
        {
                // Clear container
                var container = document.getElementById(this.myportalLogoContainerId);
                while (container.hasChildNodes()) {
                        container.removeChild(container.firstChild);
                }

                // Add logo
                if (this.displayLogo) {
                        container.appendChild(this.createLogo());
                }
        },

        // Returns a new logo element.
        createLogo: function()
        {
                var link = document.createElement('a');
                link.id = this.myportalLogoLinkId;
                link.href = 'myportal://';

                var image = document.createElement('img');
                image.id = this.myportalLogoId;
                image.src = this.logoFilename;
                image.alt = "My Portal";

                link.appendChild(image);
                return link;
        },


        //// Preference getter methods

        get displayLogo()
        {
                return this.prefs.getBoolPref('displayLogo');
        },

        get logoFilename()
        {
                return this.prefs.getCharPref('logoFilename');
        }
};
