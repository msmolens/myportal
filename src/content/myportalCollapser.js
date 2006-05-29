/* myportalCollapser.js
 * Copyright (C) 2006 Max Smolens
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

//// My Portal Collapser.
//
// Handles folder collapsing.

// Constructor.
function MyPortalCollapser() {}

MyPortalCollapser.prototype =
{
        //// Services

        myportalService: Components.classes['@unroutable.org/myportal-service;1'].getService(Components.interfaces.nsIMyPortalService),


        //// Methods

        // Toggles collapsed state.
        //
        // node: clicked DOM node
        toggle: function(node) {
                var folderContents = node.parentNode.nextSibling;
                var id = node.getAttribute('nodeId');
                this.myportalService.toggleCollapsed(node, folderContents, id);
        }
};
