/* myportalPreferences.js
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

//// My Portal Preferences
//
// Container for preference window functions.

var myportalPreferences =
{
        stringBundleURL: 'chrome://myportal/locale/myportal.properties',

        // Initializes services.
        init: function()
        {
                // Init prompt service
                const nsIPromptService = Components.interfaces.nsIPromptService;
                this.promptService = Components.classes['@mozilla.org/embedcomp/prompt-service;1'].getService(nsIPromptService);

                // Init stringbundle service
                const nsIStringBundleService = Components.interfaces.nsIStringBundleService;
                var stringBundleService = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(nsIStringBundleService);
                this.stringBundle = stringBundleService.createBundle(this.stringBundleURL);
        },


        //// Preference methods

        // Updates 'disabled' attribute for elements related to an element.
        //
        // preferenceId: id of element's preference
        // list: string of comma-separated ids of elements to update
        // invert: if true, disable related elements when element is selected
        updateDisabled: function(preferenceId,
                                 list,
                                 invert)
        {
                invert = invert || false;

                // Determine if related elements should be disabled
                var preference = document.getElementById(preferenceId);
                var disabled = invert ? preference.value : !preference.value;

                // Extract element ids from list
                var ids = list.split(',').map(function(s) {
                        return s.replace(/^\s*(.*)\s*$/, '$1');
                });

                // Set disabled property for elements
                ids.forEach(function(id) {
                        var element = document.getElementById(id);
                        element.disabled = disabled;
                });

                // Use default
                return undefined;
        },

        // Verifies that an element's value is within a certain range.
        //
        // id: element id
        // min: minimum value
        // max: maximum value
        verifyLimit: function(id,
                              min,
                              max)
        {
                min = min || 0;
                var element = document.getElementById(id);
                var value = parseInt(element.value);
                if (isNaN(value)) {
                        value = '';
                } else if (value < min) {
                        value = min;
                } else if (max && value > max) {
                        value = max;
                }
                element.value = value;
                return value;
        },

        // Loads default values for all preferences.
        loadDefaults: function()
        {
                var title = this.stringBundle.GetStringFromName('preferences.prompt.default.title');
                var message = this.stringBundle.GetStringFromName('preferences.prompt.default.message');
                var confirmed = this.promptService.confirm(window, title, message);
                if (confirmed) {
                        var preferences = document.getElementsByTagName('preference');
                        for (var i = 0; i < preferences.length; i++) {
                                this.loadDefault(preferences[i]);
                        }
                }
        },

        // Loads the default value for a preference.
        //
        // pref: preference
        loadDefault: function(pref)
        {
                if (pref.hasUserValue) {
                        pref.reset();
                }
        },


        //// File browser methods

        // Opens file picker for custom image.
        browseCustomImage: function(event)
        {
                const title = 'preferences.filepicker.image.title';
                const textboxId = 'imageFilenameTextbox';
                const nsIFilePicker = Components.interfaces.nsIFilePicker;
                var fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
                fp.init(window, this.stringBundle.GetStringFromName(title), nsIFilePicker.modeOpen);

                // Append filters separately to force image filter to be default
                fp.appendFilters(nsIFilePicker.filterImages);
                fp.appendFilters(nsIFilePicker.filterAll);
                this.showFilePicker(fp, textboxId);
        },

        // Opens file picker for custom style sheet.
        browseCustomStyleSheet: function(event)
        {
                const title = 'preferences.filepicker.stylesheet.title';
                const styleSheetsFileDescription = 'preferences.filepicker.stylesheet.description';
                const textboxId = 'customStyleSheetFilenameTextbox';
                const nsIFilePicker = Components.interfaces.nsIFilePicker;
                var fp = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
                fp.init(window, this.stringBundle.GetStringFromName(title), nsIFilePicker.modeOpen);
                fp.appendFilter(this.stringBundle.GetStringFromName(styleSheetsFileDescription), '*.css');
                fp.appendFilters(nsIFilePicker.filterAll);
                this.showFilePicker(fp, textboxId);
        },

        // Shows file picker and applies selection to textbox.
        //
        // fp: file picker
        // textboxId: id of textbox
        showFilePicker: function(fp,
                                 textboxId)
        {
                var result = fp.show();
                if (result == Components.interfaces.nsIFilePicker.returnOK) {
                        try {
                                var uri = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newFileURI(fp.file, null, null);
                                var element = document.getElementById(textboxId);
                                element.value = uri.spec;
                                element.doCommand();
                        } catch (e) {}
                }
        }
};
