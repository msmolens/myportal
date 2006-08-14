/* myportalLinkExtractors.js
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

//// My Portal Link Extractor
//
// Extracts links from a rendered folder.

// Constructor.
function MyPortalLinkExtractor() {}

// Returns array of links in node.
//
// node: folder contents DOM node
MyPortalLinkExtractor.prototype.extract = function(node)
{
        var urls = new Array();
        var children = node.childNodes;
        var url;
        try {
                for (var i = 0; i < children.length; i++) {
                        var child = children[i];
                        if (child.tagName == 'A') {
                                // Bookmark
                                url = child.href;
                                urls.push(url);
                        } else if (child.tagName == 'SPAN') {
                                // Bookmark w/image
                                url = child.lastChild.href;
                                urls.push(url);
                        } else if (child.tagName == 'DIV' &&
                                   child.firstChild &&
                                   child.firstChild.tagName == 'FORM') {
                                // Smart bookmark
                                var input = child.firstChild.firstChild.firstChild;
                                url = input.getAttribute('url');
                                urls.push(url);
                        }
                }
        } catch (e) {}
        return urls;
};


//// My Portal Unread Link Extractor
//
// Extracts unread links from a rendered folder.

// Constructor.
function MyPortalUnreadLinkExtractor() {}

MyPortalUnreadLinkExtractor.prototype = new MyPortalLinkExtractor;

MyPortalUnreadLinkExtractor.prototype.globalHistoryService = Components.classes['@mozilla.org/browser/global-history;2'].getService(Components.interfaces.nsIGlobalHistory2);

MyPortalUnreadLinkExtractor.prototype.ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);

// Returns array of links in node.
//
// node: folder contents DOM node
MyPortalUnreadLinkExtractor.prototype.extract = function(node)
{
        var allURLs = this.constructor.prototype.extract.call(this, node);
        var unreadURLs = allURLs.filter(function(url) {
                return !this.isVisited(url);
        }, this);
        return unreadURLs;
};

// Returns true if URL is visited.
//
// url: URL
MyPortalUnreadLinkExtractor.prototype.isVisited = function(url)
{
        var uri = this.ioService.newURI(url, null, null);
        return (this.globalHistoryService.isVisited(uri));
};
