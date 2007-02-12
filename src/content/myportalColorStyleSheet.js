/* myportalColorStyleSheet.js
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

//// My Portal Color Style Sheet
//
// Color style sheet operations.
//
// Implements:
// nsIObserver

function MyPortalColorStyleSheet()
{
        this.prefs = Components.classes['@unroutable.org/myportal-preferences-service;1'].getService(Components.interfaces.nsIMyPortalPreferencesService);

        // Register preference observer
        this.prefs.addObserver('', this, false);
}

MyPortalColorStyleSheet.prototype =
{
        //// System color CSS properties

        systemTextColor: 'HighlightText',
        systemBackgroundColor: 'Highlight',


        //// Methods

        unload: function()
        {
                this.prefs.removeObserver('', this);
        },

        // Sets folder heading colors.
        update: function()
        {
                // myportalColors.css
                // Index matches order in myportal.html
                var rules = document.styleSheets[1].cssRules;

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
        }
};
