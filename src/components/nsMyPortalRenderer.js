/* nsMyPortalRenderer.js
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

Components.utils.import("resource://gre/modules/utils.js");


 //// Component constants

const MYPORTALRENDERER_NAME = 'My Portal Renderer';
const MYPORTALRENDERER_CONTRACTID = '@unroutable.org/myportal-renderer;1';
const MYPORTALRENDERER_CID = Components.ID('{ca8c943d-1099-4113-ba5d-1ff723ed97c8}');


//// Interface constants

const nsIMyPortalService = Components.interfaces.nsIMyPortalService;
const nsIMyPortalDataSource = Components.interfaces.nsIMyPortalDataSource;
const nsIMyPortalRenderer = Components.interfaces.nsIMyPortalRenderer;
const nsIMyPortalBookmarkNode = Components.interfaces.nsIMyPortalBookmarkNode;
const nsIMyPortalBookmarkNodeVisitor = Components.interfaces.nsIMyPortalBookmarkNodeVisitor;
const nsIMyPortalBookmarkContainerNode = Components.interfaces.nsIMyPortalBookmarkContainerNode;
const nsIMyPortalBookmarkContainerNodeVisitor = Components.interfaces.nsIMyPortalBookmarkContainerNodeVisitor;
const nsIMyPortalBookmarkFolderNode = Components.interfaces.nsIMyPortalBookmarkFolderNode;
const nsIMyPortalBookmarkFolderNodeVisitor = Components.interfaces.nsIMyPortalBookmarkFolderNodeVisitor;
const nsIMyPortalBookmarkSeparatorNode = Components.interfaces.nsIMyPortalBookmarkSeparatorNode;
const nsIMyPortalBookmarkSeparatorNodeVisitor = Components.interfaces.nsIMyPortalBookmarkSeparatorNodeVisitor;
const nsIMyPortalLivemarkNodeVisitor = Components.interfaces.nsIMyPortalLivemarkNodeVisitor;
const nsIMyPortalLivemarkBookmarkNodeVisitor = Components.interfaces.nsIMyPortalLivemarkBookmarkNodeVisitor;
const nsIMyPortalGeneralBookmarkNodeVisitor = Components.interfaces.nsIMyPortalGeneralBookmarkNodeVisitor;
const nsIMyPortalNormalBookmarkNodeVisitor = Components.interfaces.nsIMyPortalNormalBookmarkNodeVisitor;
const nsIMyPortalSmartBookmarkNode = Components.interfaces.nsIMyPortalSmartBookmarkNode;
const nsIMyPortalSmartBookmarkNodeVisitor = Components.interfaces.nsIMyPortalSmartBookmarkNodeVisitor;
const nsIMyPortalVisitable = Components.interfaces.nsIMyPortalVisitable;
const nsISupports = Components.interfaces.nsISupports;
const nsIFactory = Components.interfaces.nsIFactory;
const nsIComponentRegistrar = Components.interfaces.nsIComponentRegistrar;
const nsIStringBundleService = Components.interfaces.nsIStringBundleService;
const nsIMutableArray = Components.interfaces.nsIMutableArray;
const nsISupportsString = Components.interfaces.nsISupportsString;


//// Namespace constants

const XULNS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';


//// Services

var stringBundleService = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(nsIStringBundleService);


/// Miscellaneous globals

var stringBundle = stringBundleService.createBundle('chrome://myportal/locale/myportal.properties');

const DESCRIPTION_ANNO = "bookmarkProperties/description";


//// Utility functions

// Convert date in microseconds to days.
//
// date: microseconds since epoch
function toDays(date)
{
        // Convert microseconds to ms
        date *= 0.001;

        // Get current date in ms
        var now = (new Date()).valueOf();

        // Return difference in days
        return ((now - date) / 86400000); // divisor: ms in a day
}

//
// Truncate string at maximum length and append an ellipsis.
//
// name: string
// length: length at which to truncate name
function truncate(name,
                  length)
{
        if (name.length > length) {
                name = name.slice(0, length);
                name = name.replace(/\s*$/, stringBundle.GetStringFromName('ellipsis'));
        }
        return name;
}

// Sets node's description as tooltip
//
// itemId: item id
// element: element to set tooltip on
function setTooltip(itemId,
                    element)
{
		var annotations = PlacesUtils.annotations;
		if (annotations.itemHasAnnotation(itemId, DESCRIPTION_ANNO)) {
			var description = annotations.getItemAnnotation(itemId, DESCRIPTION_ANNO);
			element.title = description;
		}
}

//// My Portal Renderer
//// nsMyPortalRenderer
// Implements:
// nsIMyPortalRenderer
// nsIMyPortalBookmarkNodeVisitor
// nsIMyPortalBookmarkContainerNodeVisitor
// nsIMyPortalGeneralBookmarkNodeVisitor
// nsIMyPortalNormalBookmarkNodeVisitor
// FIXME docs
// nsISupports

function nsMyPortalRenderer()
{
}

nsMyPortalRenderer.prototype.init = function(document,
                                             parent,
                                             portalRoot)
{
        this.document = document;
        this.parents = new Array();
        this.parents.push(parent);
        this.portalRoot = portalRoot;

        this._title = '';
        this._pathNodeIds = Components.classes['@mozilla.org/array;1'].createInstance(nsIMutableArray);
        this._properties = new Object();


        this.bookmarkContainerRenderer = new BookmarkContainerRenderer(this.document, this._properties);
};

nsMyPortalRenderer.prototype.setBoolProperty = function(name,
                                                        value)
{
        this._properties[name] = value;
};

nsMyPortalRenderer.prototype.setIntProperty = function(name,
                                                       value)
{
        this._properties[name] = value;
};

nsMyPortalRenderer.prototype.__defineGetter__('parent', function()
{
        return this.parents[this.parents.length - 1];
});

nsMyPortalRenderer.prototype.__defineSetter__('title', function(title)
{
        this._title = title;
});

nsMyPortalRenderer.prototype.__defineGetter__('title', function()
{
        return this._title;
});

nsMyPortalRenderer.prototype.__defineSetter__('pathNodeIds', function(pathNodeIds)
{
        this._pathNodeIds = pathNodeIds;
});

nsMyPortalRenderer.prototype.__defineGetter__('pathNodeIds', function()
{
        return this._pathNodeIds;
});

nsMyPortalRenderer.prototype.__defineGetter__('showDescriptionTooltips', function()
{
        return this._properties['showDescriptionTooltips'];
});

nsMyPortalRenderer.prototype.__defineGetter__('showFavicons', function()
{
        return this._properties['showFavicons'];
});

nsMyPortalRenderer.prototype.__defineGetter__('openLinksNewTabOrWindow', function()
{
        return this._properties['openLinksNewTabOrWindow'];
});

nsMyPortalRenderer.prototype.__defineGetter__('truncateBookmarkNames', function()
{
        return this._properties['truncateBookmarkNames'];
});

nsMyPortalRenderer.prototype.__defineGetter__('truncateBookmarkNamesLength', function()
{
        return this._properties['truncateBookmarkNamesLength'];
});

nsMyPortalRenderer.prototype.__defineGetter__('increaseRecentlyVisitedSize', function()
{
        return this._properties['increaseRecentlyVisitedSize'];
});

nsMyPortalRenderer.prototype.visitGeneralBookmarkNode = function(myportalNode)
{
        if (!(myportalNode instanceof nsIMyPortalBookmarkNode)) {
                return null;
        }

        var parent = this.parent;
        var node = myportalNode.node;

        // Create link
        var link = this.document.createElement('a');
        link.href = node.uri;

        // Set tooltip
        if (this.showDescriptionTooltips) {
                setTooltip(node.itemId, link);
        }

        // Set target to open in new tab or window
        if (this.openLinksNewTabOrWindow) {
                link.setAttribute('target', '_blank');
        }

        var name = node.title;
        if (!name.length) {
                name = node.uri;
        }
        if (this.truncateBookmarkNames) {
                name = truncate(name, this.truncateBookmarkNamesLength);
        }
        var text = this.document.createTextNode(name);
        link.appendChild(text);

        // Set favicon
        var faviconURI = node.icon;
        if (this.showFavicons && faviconURI)
        {
                // Insert icon and link into a container
                var image = this.document.createElement('img');
                image.src = faviconURI.spec;
                image.className = 'favicon';

                var container = this.document.createElement('span');
                container.className = 'faviconLinkContainer';
                container.appendChild(image);
                container.appendChild(link);

                // Assign container id
                container.id = node.itemId;
                parent.appendChild(container);
        }
        else
        {
                link.id = node.itemId;
                parent.appendChild(link);
        }

        // Separator forces line wrapping
        var separator = this.document.createElementNS(XULNS, 'separator');
        parent.appendChild(separator);

        return link;
}

nsMyPortalRenderer.prototype.visitedPastDayClass = 'visitedPastDay';
nsMyPortalRenderer.prototype.visitedPastTwoDaysClass = 'visitedPastTwoDays';
nsMyPortalRenderer.prototype.visitedPastThreeDaysClass = 'visitedPastThreeDays';
nsMyPortalRenderer.prototype.visitedPastWeekClass = 'visitedPastWeek';

nsMyPortalRenderer.prototype.visitNormalBookmarkNode = function(myportalNode)
{
        // Call superclass's render method
        var link = this.visitGeneralBookmarkNode(myportalNode);

        if (!(myportalNode instanceof nsIMyPortalBookmarkNode)) {
                return;
        }
        
        var node = myportalNode.node;

        // Set class based on last visit date
        if (this.increaseRecentlyVisitedSize) {
		var lastVisitDate = node.time;
                if (lastVisitDate) {
                        var age = toDays(lastVisitDate);
                        if (age < 1.0) {
                                // Visited within past day
                                link.className = this.visitedPastDayClass;
                        } else if (age < 2.0) {
                                // Visited within past two days
                                link.className = this.visitedPastTwoDaysClass;
                        } else if (age < 3.0) {
                                // Visited within past three days
                                link.className = this.visitedPastThreeDaysClass;
                        } else if (age < 7.0) {
                                // Visited within past week
                                link.className = this.visitedPastWeekClass;
                        }
                }
        }
}

nsMyPortalRenderer.prototype.livemarkLinkClass = 'livemarkLink';

nsMyPortalRenderer.prototype.visitLivemarkBookmarkNode = function(myportalNode)
{
        // Call superclass's render method
        var link = this.visitGeneralBookmarkNode(myportalNode);

        // Mark as livemark item
        link.className = this.livemarkLinkClass;
}

nsMyPortalRenderer.prototype.textboxIdAttribute = 'textboxId';
nsMyPortalRenderer.prototype.smartBookmarkClass = 'smartbookmark';
nsMyPortalRenderer.prototype.textboxClass = 'textbox';

nsMyPortalRenderer.prototype.visitSmartBookmarkNode = function(myportalNode)
{
        myportalNode.QueryInterface(nsIMyPortalBookmarkNode);
        
        var node = myportalNode.node;
        
        var itemId = node.itemId;

        var box = this.document.createElementNS(XULNS, 'hbox');
        box.className = this.smartBookmarkClass;

        var form = this.document.createElement('form');

        var textbox = this.document.createElement('input');
        textbox.type = 'text';
        textbox.id = itemId;
        textbox.className = this.textboxClass;
        textbox.setAttribute('size', 30);
        textbox.setAttribute('url', node.uri);

        var button = this.document.createElementNS(XULNS, 'button');
        var command = 'try {return myportal.smartBookmarkHandler.load(event, ' + itemId + ');} catch (e) {return false;}';
        button.setAttribute('oncommand', command);
        button.setAttribute('onclick', command);
        var faviconURI = node.icon;
        if (faviconURI) {
                button.setAttribute('image', faviconURI.spec);
        }
        var name = node.title;
        if (this.truncateBookmarkNames) {
                name = truncate(name, this.truncateBookmarkNamesLength);
        }
        button.setAttribute('label', name);

        // Set tooltip
        // FIXME doesn't show?
        if (this.showDescriptionTooltips) {
		var annotations = PlacesUtils.annotations;
		if (annotations.itemHasAnnotation(itemId, DESCRIPTION_ANNO)) {
			var description = annotations.getItemAnnotation(itemId, DESCRIPTION_ANNO);
			button.setAttribute('tooltiptext', description);
		}
        }

        box.appendChild(textbox);
        box.appendChild(button);

        var formCommand = 'javascript:try {myportal.smartBookmarkHandler.submit(\'' + textbox.id + '\');} catch (e) {}';
        form.setAttribute('action', formCommand);
        form.appendChild(box);

        var div = this.document.createElement('div');
        div.appendChild(form);
        this.parent.appendChild(div);
}

nsMyPortalRenderer.prototype.separatorClass = 'bookmarkSeparator';

nsMyPortalRenderer.prototype.visitBookmarkSeparatorNode = function(myportalNode)
{
        var separator = this.document.createElement('div');
        separator.className = this.separatorClass;
        this.parent.appendChild(separator);
}

nsMyPortalRenderer.prototype.visitBookmarkContainerNode = function(myportalNode,
                                                                   livemark)
{
        var portalRoot = this.portalRoot;
        this.bookmarkContainerRenderer.portalRoot = portalRoot;

        var container = this.bookmarkContainerRenderer.render(myportalNode, this.parent, livemark);

        this.portalRoot = false;

        if (portalRoot)
        {
                this.title = this.bookmarkContainerRenderer.title;
                this.bookmarkContainerRenderer.title = '';

                this.pathNodeIds = this.bookmarkContainerRenderer.pathNodeIds;
                this.bookmarkContainerRenderer.pathNodeIds = null;
        }

        // Render children
        this.parents.push(container);
        var children = myportalNode.children.enumerate();
        while (children.hasMoreElements()) {
                let child = children.getNext().QueryInterface(nsIMyPortalVisitable);
                child.accept(this);
        }
        this.parents.pop();
}

nsMyPortalRenderer.prototype.visitBookmarkFolderNode = function(myportalNode)
{
        this.visitBookmarkContainerNode(myportalNode, false);
}

nsMyPortalRenderer.prototype.visitLivemarkNode = function(myportalNode)
{
        this.visitBookmarkContainerNode(myportalNode, true);
}

nsMyPortalRenderer.prototype.QueryInterface = function(iid)
{
        if (iid.equals(nsIMyPortalRenderer) ||
            iid.equals(nsIMyPortalNormalBookmarkNodeVisitor) ||
            iid.equals(nsIMyPortalBookmarkContainerNodeVisitor) ||
            iid.equals(nsIMyPortalBookmarkFolderNodeVisitor) ||
            iid.equals(nsIMyPortalLivemarkNodeVisitor) ||
            iid.equals(nsIMyPortalGeneralBookmarkNodeVisitor) ||
            iid.equals(nsIMyPortalLivemarkBookmarkNodeVisitor) ||
            iid.equals(nsIMyPortalSmartBookmarkNodeVisitor) ||
            iid.equals(nsIMyPortalBookmarkSeparatorNodeVisitor) ||
            iid.equals(nsIMyPortalBookmarkNodeVisitor) ||
            iid.equals(nsISupports)) {
                    return this;
            }
        throw Components.results.NS_ERROR_NO_INTERFACE;
}


//// Bookmark container renderer

function BookmarkContainerRenderer(document,
                                   properties)
{
        this.document = document;

        this._portalRoot = false;
        this._title = '';
        this._properties = properties;

        this.livemarkHeaderRenderer = new LivemarkHeaderRenderer(this.document);
}

BookmarkContainerRenderer.prototype.__defineSetter__('portalRoot', function(portalRoot)
{
        this._portalRoot = portalRoot;
});

BookmarkContainerRenderer.prototype.__defineGetter__('portalRoot', function()
{
        return this._portalRoot;
});

BookmarkContainerRenderer.prototype.__defineSetter__('title', function(title)
{
        this._title = title;
});

BookmarkContainerRenderer.prototype.__defineGetter__('title', function()
{
        return this._title;
});

BookmarkContainerRenderer.prototype.__defineGetter__('showDescriptionTooltips', function()
{
        return this._properties['showDescriptionTooltips'];
});

BookmarkContainerRenderer.prototype.collapseButtonClass = 'collapseButton';
BookmarkContainerRenderer.prototype.emptyFolderNoteClass = 'emptyFolderNote';
BookmarkContainerRenderer.prototype.folderAttribute = 'folder';
BookmarkContainerRenderer.prototype.folderClass = 'folder';
BookmarkContainerRenderer.prototype.folderContentsClass = 'folderContents';
BookmarkContainerRenderer.prototype.folderHeadingClass = 'folderHeading';
BookmarkContainerRenderer.prototype.folderHeadingLinkAttribute = 'folderHeadingLink';
BookmarkContainerRenderer.prototype.folderHeadingLinkClass = 'folderHeadingLink';

BookmarkContainerRenderer.prototype.render = function(myportalNode,
                                                      parent,
                                                      livemark)
{
        // folder
        //   folderheading
        //     folder name
        //   foldercontents
        //     bookmarks

        // Create folder heading
        var folderHeading = this.document.createElement('div');
        folderHeading.className = this.folderHeadingClass;

        // Create folder
        var folder = this.document.createElement('div');
        folder.className = this.folderClass;

        // Mark as folder
        folder.setAttribute(this.folderAttribute, 'true');

        folder.appendChild(folderHeading);

        // Create folder contents
        var folderContents = this.document.createElement('div');
        folderContents.className = this.folderContentsClass;
        folderContents.style.display = 'block';
        
        // Create folder name
        myportalNode.QueryInterface(nsIMyPortalBookmarkNode);
        var node = myportalNode.node;
        if (this.portalRoot) {
                this.createRootFolderHeading(myportalNode, folderHeading);
                this.portalRoot = false;
        } else {
                var collapseButton = this.newCollapseButton(myportalNode);
                var link = this.createLink(node.itemId, node.title, this.folderHeadingLinkClass);
                
                collapseButton.setAttribute('onclick',
                        'var folderContents = this.parentNode.nextSibling;' +
                        'var display = folderContents.style.display;' +
                        'var isCollapsed = display && display == "none";' +
                        'this.setAttribute("collapsed", isCollapsed ? "false" : "true");' +
                        'folderContents.style.display = isCollapsed ? "block" : "none";' +
                        'var myportalDataSource = Components.classes["@unroutable.org/myportal-datasource;1"].getService(Components.interfaces.nsIMyPortalDataSource);' +
                        'myportalDataSource.setCollapsed(' + node.itemId + ', !isCollapsed)');

                // Set collapsed attributes
                var myportalDataSource = Components.classes['@unroutable.org/myportal-datasource;1'].getService(nsIMyPortalDataSource);
                var isCollapsed = myportalDataSource.isCollapsed(node.itemId);
                collapseButton.setAttribute('collapsed', isCollapsed ? 'true' : 'false');
                folderContents.style.display = isCollapsed ? 'none' : 'block';

                folderHeading.appendChild(collapseButton);
                folderHeading.appendChild(link);
        }

        // Set livemark-specific attributes
        if (livemark)
        {
                this.livemarkHeaderRenderer.render(myportalNode, folderHeading);
        }

        // Add note to empty folders
        myportalNode.QueryInterface(nsIMyPortalBookmarkContainerNode);
        if (myportalNode.isEmpty()) {
                folderContents.appendChild(this.newEmptyFolderNote());
        }

        folder.appendChild(folderContents);
        parent.appendChild(folder);

        return folderContents;
}

// Create a folder heading including the entire path of a bookmark node.
//
// myportalNode: BookmarkNode to render
// folderHeading: folder heading in which to insert items
BookmarkContainerRenderer.prototype.createRootFolderHeading = function(myportalNode,
                                                                       folderHeading)
{
        // Document title
        this.title = '';
        
        var node = myportalNode.node;

        var previousNode = this.createLink(node.itemId, node.title, this.folderHeadingLinkClass);
        folderHeading.appendChild(previousNode);

        // Store id
        this.pathNodeIds = Components.classes['@mozilla.org/array;1'].createInstance(nsIMutableArray);
        var str = Components.classes['@mozilla.org/supports-string;1'].createInstance(nsISupportsString);
        str.data = previousNode.id;
        this.pathNodeIds.appendElement(str, false);

        const placesRootId = PlacesUtils.placesRootId;
        const bookmarksMenuFolderId = PlacesUtils.bookmarksMenuFolderId;

        // Build document title
        // Use blank instead of bookmark menu folder name
        if (node.itemId != bookmarksMenuFolderId) {
                this.title = previousNode.firstChild.nodeValue;
        }
        
        var bookmarks = PlacesUtils.bookmarks;
        var folderId = bookmarks.getFolderIdForItem(node.itemId);

        // Add link for each folder in path
        const pathSeparator = '/';
        while (folderId != placesRootId) {
                var nextNode = null;

                // Insert separator
                nextNode = this.document.createTextNode(pathSeparator);
                folderHeading.insertBefore(nextNode, previousNode);
                previousNode = nextNode;

                // Insert next node
                var folderName = bookmarks.getItemTitle(folderId);
                nextNode = this.createLink(folderId, folderName, this.folderHeadingLinkClass);
                folderHeading.insertBefore(nextNode, previousNode);
                previousNode = nextNode;

                // Store id
                str = Components.classes['@mozilla.org/supports-string;1'].createInstance(nsISupportsString);
                str.data = folderId;
                this.pathNodeIds.appendElement(str, false);

                // Build document title
                this.title = folderName + pathSeparator + this.title;
                
                folderId = bookmarks.getFolderIdForItem(folderId);
        }
}

// Create a folder heading link.
//
// itemId: item id
// itemTitle: item title
// className: class name of link (optional)
BookmarkContainerRenderer.prototype.createLink = function(itemId,
                                                          itemTitle,
                                                          className)
{
        /*
        var link = null;
        if (itemId < 0)
        {
                link = this.document.createElement("span");
                link.appendChild(this.document.createTextNode(itemTitle));
                if (className) {
                        link.className = className;
                }
                return link;
        }
        */

        var link = this.document.createElement('a');
        link.id = itemId;

        // Mark link as folder heading link for popup handler
        link.setAttribute(this.folderHeadingLinkAttribute, 'true');

        if (className) {
                link.className = className;
        }

        var myportalService = Components.classes['@unroutable.org/myportal-service;1'].getService(nsIMyPortalService);
        var href = myportalService.getHrefForId(itemId);
        link.href = href;

        // Set tooltip
        if (this.showDescriptionTooltips) {
                setTooltip(itemId, link);
        }

        var linkText = this.document.createTextNode(itemTitle);
        link.appendChild(linkText);
        return link;
}

BookmarkContainerRenderer.prototype.newCollapseButton = function(myportalNode)
{
        var node = myportalNode.node;

        // Create button
        var button = this.document.createElement('button');
        button.className = this.collapseButtonClass;

        // Create image
        var image = this.document.createElementNS(XULNS, 'image');
//        image.id = 'myportal-' + node.itemId;

        button.appendChild(image);
        return button;
}

BookmarkContainerRenderer.prototype.newEmptyFolderNote = function()
{
        var note = this.document.createElement('span');
        note.className = this.emptyFolderNoteClass;
        note.appendChild(this.document.createTextNode(stringBundle.GetStringFromName('emptyFolder')));
        return note;
}


//// Livemark header renderer

function LivemarkHeaderRenderer(document)
{
        this.document = document;
}

LivemarkHeaderRenderer.prototype.livemarkAttribute = 'livemark';
LivemarkHeaderRenderer.prototype.livemarkFolderHeadingClass = 'livemarkFolderHeading';
LivemarkHeaderRenderer.prototype.livemarkMarkAsReadButtonClass = 'livemarkMarkAsReadButton';
LivemarkHeaderRenderer.prototype.livemarkRefreshButtonClass = 'livemarkRefreshButton';

LivemarkHeaderRenderer.prototype.render = function(myportalNode,
                                                   parent)
{
        var node = myportalNode.node;

        // Mark link as livemark for popup handler
        parent.lastChild.setAttribute(this.livemarkAttribute, 'true');

        // Create buttons
        var markAsReadButton = this.document.createElement('button');
        markAsReadButton.className = this.livemarkMarkAsReadButtonClass;
        var refreshButton = this.document.createElement('button');
        refreshButton.className = this.livemarkRefreshButtonClass;

        // Set button tooltips
        markAsReadButton.title = stringBundle.GetStringFromName('livemark.markAsRead');
        refreshButton.title = stringBundle.GetStringFromName('livemark.refresh');

        // Set click handlers
        markAsReadButton.setAttribute('onclick', 'try {myportal.livemarkUpdater.markLivemarkAsRead(this);} catch (e) {}');
        refreshButton.setAttribute('onclick', 'try {myportal.livemarkUpdater.refreshLivemark(this);} catch (e) {}');

        // Add images to buttons
        var markAsReadImage = this.document.createElementNS(XULNS, 'image');
        var refreshImage = this.document.createElementNS(XULNS, 'image');
        markAsReadButton.appendChild(markAsReadImage);
        refreshButton.appendChild(refreshImage);

        // Add buttons
        parent.appendChild(markAsReadButton);
        parent.appendChild(refreshButton);

        parent.className += ' ' + this.livemarkFolderHeadingClass;
}


//// XPCOM Module
// Implements:
// nsIModule
var nsMyPortalRendererModule =
{
        firstTime: true,

        registerSelf: function(compMgr,
                               fileSpec,
                               location,
                               type)
        {
                if (this.firstTime) {
                        this.firstTime = false;
                        throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
                }
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.registerFactoryLocation(MYPORTALRENDERER_CID,
                                                MYPORTALRENDERER_NAME,
                                                MYPORTALRENDERER_CONTRACTID,
                                                fileSpec,
                                                location,
                                                type);
        },

        unregisterSelf: function(compMgr,
                                 location,
                                 type)
        {
                compMgr = compMgr.QueryInterface(nsIComponentRegistrar);
                compMgr.unregisterFactoryLocation(MYPORTALRENDERER_CID, location);
        },

        getClassObject: function(compMgr,
                                 cid,
                                 iid)
        {
                if (!cid.equals(MYPORTALRENDERER_CID)) {
                        throw Components.results.NS_ERROR_NO_INTERFACE;
                }
                if (!iid.equals(nsIFactory)) {
                        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
                }
                return this.myFactory;
        },

        myFactory:
        {
                createInstance: function(outer,
                                         iid)
                {
                        if (outer != null) {
                                throw Components.results.NS_ERROR_NO_AGGREGATION;
                        }
                        return (new nsMyPortalRenderer()).QueryInterface(iid);
                }
        },

        canUnload: function(compMgr)
        {
                return true;
        }
};

// XPCOM module entry point
function NSGetModule(compMgr,
                     fileSpec)
{
        return nsMyPortalRendererModule;
}
