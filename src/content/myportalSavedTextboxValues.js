/* myportalSavedTextboxValues.js
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

//// My Portal Saved Textbox Values
//
// Saves and restores textbox values from a node and its subtree.

// Constructor.
//
// node: top-level node of DOM tree
function MyPortalSavedTextboxValues(node)
{
        this.node = node;
        this.document = node.ownerDocument;
        this.values = new Object();
}

MyPortalSavedTextboxValues.prototype =
{
        // Replacement for range.intersectsNode() from MDC
        rangeIntersectsNode: function(node)
        {
                var nodeRange = node.ownerDocument.createRange();
                try {
                        nodeRange.selectNode(node);
                } catch (e) {
                        nodeRange.selectNodeContents(node);
                }
                
                return this.range.compareBoundaryPoints(Range.END_TO_START, nodeRange) == -1 &&
                        this.range.compareBoundaryPoints(Range.START_TO_END, nodeRange) == 1;
        },

        // Saves values from all textboxes in subtree
        save: function()
        {
                this.range = this.document.createRange();
                this.range.selectNode(this.node);

                var inputs = this.document.getElementsByTagName('input');
                var input = null;
                for (var i = 0; i < inputs.length; i++) {
                        input = inputs.item(i);
                        if (this.rangeIntersectsNode(input) && input.value) {
                                this.values[input.id] = input.value;
                        }
                }
                this.range.detach();
                this.range = null;
        },

        // Restores textbox values
        restore: function()
        {
                for (id in this.values) {
                        this.document.getElementById(id).value = this.values[id];
                        delete this.values[id];
                }
        }
};
