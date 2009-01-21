/* myportalLinkExtractors.js
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

//// My Portal Link Extractor
//
// Extracts links from a rendered folder.

// Constructor.
function MyPortalLinkExtractor() {}

// Returns array of links in node.
//
// itemId: bookmark item id
MyPortalLinkExtractor.prototype.extract = function(itemId)
{
        var urls = new Array();

        var historyService = PlacesUtils.history;
        var options = historyService.getNewQueryOptions();
        var query = historyService.getNewQuery();
 
        query.setFolders([itemId], 1);

        var result = historyService.executeQuery(query, options);
        var rootNode = result.root;
        
        rootNode.containerOpen = true;

        for (var i = 0; i < rootNode.childCount; i++) {
                let childNode = rootNode.getChild(i);
                let type = childNode.type;
                if (Components.interfaces.nsINavHistoryResultNode.RESULT_TYPE_URI == type) {
                        urls.push(childNode.uri);
                }
         }

        rootNode.containerOpen = false;
        
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
// itemId: bookmark item id
MyPortalUnreadLinkExtractor.prototype.extract = function(itemId)
{
        var allURLs = this.constructor.prototype.extract.call(this, itemId);
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
