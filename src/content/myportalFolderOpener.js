/* myportalFolderOpener.js
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

//// My Portal Folder Opener
//
// Opens folder contents.

// Constructor.
//
// promptTitleKey: localization key for confirmation dialog title
// promptMessageKey: localization key for confirmation dialog message
// linkExtractor: object used to extract links from folder contents
// linkOpener: object used to open links
function MyPortalFolderOpener(promptTitleKey,
                              promptMessageKey,
                              linkExtractor,
                              linkOpener)
{
        this.promptTitleKey = promptTitleKey;
        this.promptMessageKey = promptMessageKey;
        this.linkExtractor = linkExtractor;
        this.linkOpener = linkOpener;

        this.prefs = this.preferencesService.getBranch('myportal.');
        this.stringBundle = this.stringBundleService.createBundle('chrome://myportal/locale/myportal.properties');
}

MyPortalFolderOpener.prototype =
{
        //// Services

        myportalService: Components.classes['@unroutable.org/myportal-service;1'].getService(Components.interfaces.nsIMyPortalService),
        preferencesService: Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService),
        stringBundleService: Components.classes['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService),
        promptService: Components.classes['@mozilla.org/embedcomp/prompt-service;1'].getService(Components.interfaces.nsIPromptService),


        //// Methods

        // Opens folder contents.
        //
        // node: clicked DOM node
        open: function(node) {

                // Extract URLs of bookmarks in folder
                var urls = this.linkExtractor.extract(node.id);

                // Confirm if number of URLs is greater than limit
                var buttonPressed = 0;
                var openFolderLimit = this.openFolderLimit;
                if (this.openFolderConfirm && (urls.length > openFolderLimit)) {
                        buttonPressed = this.confirmOpen(urls.length, openFolderLimit);
                }

                // Proceed if confirmed
                if (buttonPressed == 0) {
                        var url = null;
                        var isLivemark = this.isLivemark(node);
                        for (var i = 0; i < urls.length; i++) {
                                url = urls[i];

                                // Open link
                                this.linkOpener.open(url);

                                // For livemarks, add URL to history so that link appears visited even if it redirects (e.g. BBC feed links)
                                if (isLivemark) {
                                        this.myportalService.addURL(url);
                                }
                        }
                }
        },

        // Displays open folder in windows or tabs confirmation dialog.
        //
        // numURLs: number of URLs
        // openFolderLimit: maximum number of folders to open without confirmation
        confirmOpen: function(numURLs,
                              openFolderLimit)
        {
                // TODO investigate similar PlacesUIUtils function
        
                const promptAlwaysPrompt = 'open.confirm';
                var promptTitle = this.stringBundle.formatStringFromName(this.promptTitleKey, [numURLs], 1);
                var promptMessage = this.stringBundle.formatStringFromName(this.promptMessageKey, [numURLs], 1);
                var checkboxLabel = this.stringBundle.formatStringFromName(promptAlwaysPrompt, [openFolderLimit], 1);
                var check = {value: true};
                var flags = this.promptService.STD_OK_CANCEL_BUTTONS;
                var buttonPressed = this.promptService.confirmEx(window, promptTitle, promptMessage, flags, null, null, null, checkboxLabel, check);
                if (!check.value) {
                        this.openFolderConfirm = false;
                }
                return buttonPressed;
        },

        // Returns true if node is livemark's title link or icon.
        isLivemark: function(node)
        {
                const livemarkAttribute = 'livemark';
                return ((node.hasAttribute(livemarkAttribute)) &&
                        (node.getAttribute(livemarkAttribute) == 'true'));
        },


        //// Preference getter and setter methods

        get openFolderConfirm()
        {
                return this.prefs.getBoolPref('openFolderConfirm');
        },

        get openFolderLimit()
        {
                return this.prefs.getIntPref('openFolderLimit');
        },

        set openFolderConfirm(value)
        {
                this.prefs.setBoolPref('openFolderConfirm', value);
        }
};
