/* myportalFadeTimer.js
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

//// My Portal Fade Timer
// Implements:
// nsITimerCallback
//
// Base class for fade types.

// Constructor.
//
// parent: parent object
// target: element to fade
// id: timer id
// notifyFunction: function to call when fade completes
// delay: timer delay (ms)
// step: opacity step
function MyPortalFadeTimer(parent,
                           target,
                           id,
                           notifyFunction,
                           delay,
                           step)
{
        if (parent && target && id && notifyFunction) {
                this.parent = parent;
                this.target = target;
                this.id = id;
                this.notifyFunction = notifyFunction;
                this.delay = delay || 25;
                this.step = step || 0.05;
        }
}

// Starts timer.
MyPortalFadeTimer.prototype.start = function()
{
        this.timer = Components.classes['@mozilla.org/timer;1'].createInstance(Components.interfaces.nsITimer);
        this.timer.initWithCallback(this, this.delay, Components.interfaces.nsITimer.TYPE_REPEATING_PRECISE);
};

// Cancels timer.
MyPortalFadeTimer.prototype.cancel = function()
{
        if (this.timer) {
                this.timer.cancel();
                this.timer = null;
        }
};


//// nsITimerCallback methods

MyPortalFadeTimer.prototype.notify = function()
{
        this.increment();
        if (this.complete()) {
                this.cancel();
                this.notifyFunction(this);
        }
};


//// Getter and setter methods

MyPortalFadeTimer.prototype.__defineGetter__('opacity', function()
{
        return this.target.style.opacity;
});

MyPortalFadeTimer.prototype.__defineSetter__('opacity', function(opacity)
{
        this.target.style.opacity = opacity;
});


//// My Portal Fade In Timer
//
// Fades in element.

// Constructor.
//
// parent: parent object
// target: element to fade
// id: timer id
// notifyFunction: function to call when fade completes
// delay: timer delay (ms)
// step: opacity step
function MyPortalFadeInTimer(parent,
                             target,
                             id,
                             notifyFunction,
                             delay,
                             step)
{
        this.constructor(parent, target, id, notifyFunction, delay, step);
        this.opacity = 0.0;
}

MyPortalFadeInTimer.prototype = new MyPortalFadeTimer;

// Increments opacity.
MyPortalFadeInTimer.prototype.increment = function()
{
        this.opacity = parseFloat(this.opacity) + this.step;
};

// Returns true if fade is complete.
MyPortalFadeInTimer.prototype.complete = function()
{
        return (this.opacity >= 1.0);
};


//// My Portal Fade Out Timer
//
// Fades out element.

// Constructor.
//
// parent: parent object
// target: element to fade
// id: timer id
// notifyFunction: function to call when fade completes
// delay: timer delay (ms)
// step: opacity step
function MyPortalFadeOutTimer(parent,
                              target,
                              id,
                              notifyFunction,
                              delay,
                              step)
{
        this.constructor(parent, target, id, notifyFunction, delay, step);
        this.opacity = 1.0;
}

MyPortalFadeOutTimer.prototype = new MyPortalFadeTimer;

// Increments opacity.
MyPortalFadeOutTimer.prototype.increment = function()
{
        this.opacity = parseFloat(this.opacity) - this.step;
};

// Returns true if fade is complete.
MyPortalFadeOutTimer.prototype.complete = function()
{
        return (this.opacity <= 0.0);
};
