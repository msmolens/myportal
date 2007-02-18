/* myportalAgeTimer.js
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

//// My Portal Age Timer
// Implements:
// nsITimerCallback
//
// Ages visited links by re-rendering them every time the timer fires.

function MyPortalAgeTimer()
{
        this.prefs = Components.classes['@unroutable.org/myportal-preferences-service;1'].getService(Components.interfaces.nsIMyPortalPreferencesService);
}

MyPortalAgeTimer.prototype =
{
        //// Services

        myportalService: Components.classes['@unroutable.org/myportal-service;1'].getService(Components.interfaces.nsIMyPortalService),


        //// Methods

        // Starts timer.
        start: function()
        {
                var millisecondsDelay = 1000 * this.ageVisitedLinksDelay;
                if (millisecondsDelay > 0) {
                        this.timer = Components.classes['@mozilla.org/timer;1'].createInstance(Components.interfaces.nsITimer);
                        this.timer.initWithCallback(this, millisecondsDelay, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
                }
        },

        // Cancels timer.
        cancel: function()
        {
                this.timer.cancel();
                this.timer = null;
        },


        //// nsITimerCallback methods

        // Re-renders links with a 'visited' class.
        // If My Portal remains open for a long time, calling this
        // occasionally ensures accurate representation of links'
        // ages.
        notify: function()
        {
                // Enumerate links
                var links = document.getElementsByTagName('A');

                // Limit to links with a 'visited' class
                var link = null;
                var newLink = null;
                var visitedLinks = new Array();
                for (var i = 0; i < links.length; i++) {
                        link = links[i];
                        if (link.className.substr(0, 7) == 'visited') {
                                visitedLinks.push(link);
                        }
                }

                // Re-render links
                this.myportalService.updateVisitedLinks(visitedLinks.length, visitedLinks);
        },


        //// Preference getter methods

        get ageVisitedLinksDelay()
        {
                return this.prefs.getIntPref('ageVisitedLinksDelay');
        }
};
