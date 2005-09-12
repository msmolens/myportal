#!/usr/bin/env python

# Author: Max Smolens <smolens@gmail.com>

# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301
# USA

"""
Create an XPI file for Firefox extensions.

By default, assumes working directory has the following structure:

  chrome.manifest
  install.rdf

  content/
  locale/
  skin/

  defaults/
  components/

See createXPI() to customize which files and directories are packaged.

When packaging, the chrome.manifest file is modified to support JAR files.

"""

import sys
import os
import os.path
import re
import zipfile
import tempfile

def createXPI(extensionName = 'unnamed',
              rootFiles = [],
              rootDirs = ['components', 'defaults'],
              chromeDirs = ['content', 'locale', 'skin']):
    """
    Create XPI file.

    Arguments:
    extensionName -- name of extension
    rootFiles -- list of files in root directory to include
    rootDirs -- list of directories in root directory to include
    chromeDirs -- chrome directories

    """

    xpiFilename = __createXPIFilename(extensionName)
    jarFilename = __createJARFilename(extensionName)
    rootFiles.append('install.rdf')

    # Create JAR file
    jarFile = __createJAR(chromeDirs)

    # Update chrome.manifest
    chromeManifest = __updateChromeManifest(extensionName)

    # Create archive
    xpiFile = zipfile.ZipFile(xpiFilename, 'w', zipfile.ZIP_DEFLATED)

    # Add root files to archive
    for name in rootFiles:
        xpiFile.write(name)

    # Add chrome.manifest to archive
    xpiFile.writestr('chrome.manifest', ''.join(chromeManifest))

    # Add JAR file to archive
    os.chmod(jarFile.name, 0644)
    xpiFile.write(jarFile.name, os.path.join('chrome', jarFilename))

    # Add root directories to archive
    for name in rootDirs:
        for root, dirs, files in os.walk(name):
            if 'CVS' in dirs:
                dirs.remove('CVS')
            if 'Makefile' in files:
                files.remove('Makefile')
            for file in files:
                xpiFile.write(os.path.join(root, file))

    # Close XPI file
    xpiFile.close()

def __createXPIFilename(extensionName):
    """Create XPI filename from extension name."""
    ext = '.xpi'
    version = __getExtensionVersion()
    if version:
        return extensionName + '-' + version + ext
    else:
        return extensionName + ext

def __createJARFilename(extensionName):
    """Create JAR filename from extension name."""
    return extensionName + '.jar'

def __getExtensionVersion():
    """Returns extension version from install.rdf."""

    # Read install.rdf
    try:
        file = open('install.rdf', 'r')
        try:
            installRdf = file.readlines()
        finally:
            file.close()
    except IOError, (errno, strerror):
        sys.exit('Error reading install.rdf: %s' % strerror)

    # Parse version
    versionRE = re.compile(r'<.*version>(.*)<.*version>')
    for line in installRdf:
        match = versionRE.search(line)
        if match:
            return match.group(1)

def __createJAR(chromeDirs):
    """Create JAR file."""

    # Create list of files
    jarFiles = []
    for subdir in chromeDirs:
        for root, dirs, files in os.walk(subdir):
            if 'CVS' in dirs:
                dirs.remove('CVS')
            for name in files:
                jarFiles.append(os.path.join(root, name))

    # Create temporary file
    tempJarFile = tempfile.NamedTemporaryFile()

    # Add files to archive, uncompressed
    jarFile = zipfile.ZipFile(tempJarFile, 'w', zipfile.ZIP_STORED)
    for name in jarFiles:
        jarFile.write(name)
    jarFile.close()

    return tempJarFile

def __applyChromeManifestREs(str,
                             contentRE,
                             contentRESub,
                             skinLocaleRE,
                             skinLocaleRESub):
    """Apply regular expressions to string."""
    str = contentRE.sub(contentRESub, str)
    str = skinLocaleRE.sub(skinLocaleRESub, str)
    return str

def __readChromeManifest():
    """Read chrome.manifest."""
    try:
        file = open('chrome.manifest', 'r')
        try:
            manifest = file.readlines()
        finally:
            file.close()
    except IOError, (errno, strerror):
        sys.exit('Error reading chrome.manifest: %s' % strerror)
    return manifest

def __updateChromeManifest(extensionName):
    """Update chrome.manifest to support JARs."""

    # Read chrome.manifest
    manifest = __readChromeManifest()

    # Regular expressions from Nickolay Ponomarev's build script:
    # <http://kb.mozillazine.org/Bash_build_script>
    # (adds jar:chrome/xxx.jar!/ at appropriate positions)
    contentRE = re.compile(r'^(content\s+\S*\s+)(\S*\/)$')
    contentRESub = r'\1jar:chrome/' + extensionName + r'.jar!/\2'
    skinLocaleRE = re.compile(r'^(skin|locale)(\s+\S*\s+\S*\s+)(.*\/)$')
    skinLocaleRESub = r'\1\2jar:chrome/' + extensionName + r'.jar!/\3'
    return [__applyChromeManifestREs(line, contentRE, contentRESub, skinLocaleRE, skinLocaleRESub) for line in manifest]


if __name__ == "__main__":
    createXPI('myportal', ['COPYING', 'ChangeLog'])
