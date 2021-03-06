(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require("/Users/paulgrenier/GitHub/svg-clock/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":4,"/Users/paulgrenier/GitHub/svg-clock/node_modules/gulp-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":3,"inherits":2}],6:[function(require,module,exports){
// keep the interface fluent
function SVG( config ) {

    if ( !(this instanceof SVG) ) {

        return new SVG( config );

    }

    this.config = config;

    this.create()
        .set( 'class', this.config.class )
        .setText()
        .setData()
        .register()
        .appendTo( this.config.layer );
}

// store layers as a class property
SVG.layers = [document.getElementsByTagName( 'body' )[0]];

SVG.prototype = {

    create: function () {

        this.elm = document.createElementNS( 'http://www.w3.org/2000/svg', this.config.type );

        return this;

    },
    set: function ( prop, val ) {

        this.elm.setAttribute( prop, val );

        return this;

    },
    getLayer: function ( layerId ) {

        this.layer = SVG.layers[layerId];

        if ( !this.layer ) {

            SVG.layers[layerId] = this.elm;

            this.layer = SVG.layers[layerId - 1];

        }

        return this;

    },
    appendTo: function ( layerId ) {

        this.getLayer( layerId );

        this.layer.appendChild( this.elm );

        return this;

    },
    setText: function () {

        if ( this.config.textContent ) {

            this.elm.appendChild( document.createTextNode( this.config.textContent ) );

        }

        return this;

    },
    getConfigData: function () {

        return this.config.data || {};

    },
    setData: function () {

        var prop;

        for ( prop in  this.getConfigData() ) {

            if ( this.config.data.hasOwnProperty( prop ) ) {

                this.set( prop, this.config.data[prop] );

            }
        }

        return this;

    },
    register: function () {

        SVG[this.config.class] = this;

        return this;

    },
    rotate: function ( degrees, transition ) {

        var origin = 'transform-origin: 100 100;',

            transform = 'transform:rotate(' + degrees + 'deg);',

            style = origin + transform +
                '-ms-' + origin +
                '-ms-' + transform +
                '-webkit-' + origin +
                '-webkit-' + transform;

        if ( transition === false ) {

            style += 'transition: none;';

        }

        return this.set( 'style', style );

    }
};

module.exports = SVG;
},{}],7:[function(require,module,exports){
// The animationFrameProcess controls how often
// we animate the clock.
//
// __animationFrameProcess__
//
// - boolean 'animate' -> __IN__
// - __OUT__ -> date 'createDate'
//
module.exports = function animationFrameProcess( app ) {

    var intervalData;

    function createDateComponent() {

        app.emit( 'createDate', new Date() );
    }

    function animationFrameComponent( bool ) {

        intervalData = bool ? setInterval( createDateComponent, 1000 ) : clearInterval( intervalData );

    }

    app.on( 'animate', animationFrameComponent );

};
},{}],8:[function(require,module,exports){
var EventEmitter = require( 'events' ).EventEmitter;

var inherits = require( 'util' ).inherits;

// The `Clock` constructor instantiates objects capable of managing events.
// See [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter)
// `Clock` holds `segments` data, which several processes need.
//
// __Clock__
//
// _depends on `EventEmitter` and `util.inherits`_
//
// - instantiation -> __IN__
//

function Clock() {

    this.segments = [
        'seconds',
        'minutes',
        'hours'
    ];

}

inherits( Clock, EventEmitter );

module.exports = Clock;
},{"events":1,"util":5}],9:[function(require,module,exports){
// [SVG](./SVG.html)
var SVG = require( './SVG' );

// The drawProcess draws objects on the DOM
// on create, drawProcess passes element to SVG and caches the SVG element
// on draw the element is pulled from the cache and rotated.
//
// __drawProcess__
//
// _depends on `SVG`_
//
// - element 'create' -> __IN__
// - degrees 'draw/&lt;segment&gt;' -> __IN__
//
function resetComponent( hand ) {

    hand.rotate( 359.9 );

    return setTimeout( function () {

        hand.rotate( 0, false );

    }, 816 );

}

function drawSegmentComponent( segment ) {

    return function drawSegmentDegreesComponent( degrees ) {

        var hand = SVG[segment];

        if ( degrees === 0 && hand.rotated ) {

            return resetComponent( hand );

        }
        if ( !hand.rotated ) {

            hand.rotated = true;

            return hand.rotate( degrees, false );

        }

        return hand.rotate( degrees );

    };
}

module.exports = function drawProcess( app ) {

    function drawComponent( segment ) {

        app.on( 'draw/' + segment, drawSegmentComponent( segment ) );
    }

    app.segments.forEach( drawComponent );

    app.on( 'create', SVG );

};
},{"./SVG":6}],10:[function(require,module,exports){
// SVG Clock
// ---------
//
// This SVG clock demo was build to highlight the following;
//
// - Modern web techniques (HTML5)
// - Modern build processes (Gulp, Browserify)
// - Flow-based Programming (FBP) (as a design pattern)
// - Separation of concerns (SoC)
// - Design impacts on complexity and maintainability
//
// HTML5
// -----
// This demo highlights the benefits of drawing/animating SVG graphics with css and JavaScript.
//
// Build
// -----
// Gulp provides a fast and simple interface to build the project.
// Browserify allows use of modules from NodeJS and injects dependencies.
//
// Flow-based Programming (FBP)
// ----------------------------
//
// This project was inspired by the
// [clock app](http://noflojs.org/noflo-ui/#example/6699161)
// design from [NoFlo](http://noflojs.org/). This is not an attempt at
// building an FBP engine, merely an exercise at following the design
// principles used in FBP.
//
// The major principles used here include:
//
// - Information Packets (IPs) - this is the data parameter passed to `app.emit`
// - Processes - discrete functions encapsulating component(s),
// their __DATA__, and __IN__/__OUT__ port(s)
// - Components - functions used within a process
// - Data - variables shared by components
// - __IN__ port - a channel used to send IP to a process
// - __OUT__ port - a channel used to send IP from a process
//
// I use this notation to denote ports:
//
// - __IN__ port: &lt;IP type&gt; &lt;channel&gt; -> __IN__
// - __OUT__ port: __OUT__ -> &lt;IP type> &lt;channel&gt;
// - Conditional port: [&lt;port&gt;]
//
// Separation of Concerns (SOC)
// ----------------------------
//
// Whenever possible, this demo strives to isolate data and logic to the
// components and processes using them.  This helps make code modular,
// reusable, and testable.
//
// Complexity and Maintainability
// ------------------------------
//
// Each module should be as complex as it needs to be, and no more.
// Please compare this project to others using a tool like
// [JSComplexity](http://jscomplexity.org/) or
// [Plato](https://github.com/jsoverson/plato).
// I hope to demonstrate that the techniques above lend to a
// more maintainable code base.

// [Clock](./clock.html)
var Clock = require( './clock' );

[
// [splitProcess](./splitProcess.html)
    require( './splitProcess' ),
// [rotationProcess](./rotationProcess.html)
    require( './rotationProcess' ),
// [animationFrameProcess](./animationFrameProcess.html)
    require( './animationFrameProcess' ),
// [drawProcess](./drawProcess.html)
    require( './drawProcess' ),
// [initProcess](./initProcess.html)
    require( './initProcess' ),
// [startProcess](./startProcess.html)
    require( './startProcess' )
].reduce(function ( app, process ) {

        process( app );

        return app;

    }, new Clock() ).emit( 'start' );
},{"./animationFrameProcess":7,"./clock":8,"./drawProcess":9,"./initProcess":11,"./rotationProcess":12,"./splitProcess":13,"./startProcess":14}],11:[function(require,module,exports){
// The initProcess sends elements to be created.
//
// __initProcess__
//
// _depends on `elementsComponent`_
//
// - null 'init' -> __IN__
// - __OUT__ -> element 'create'
//
var elementsComponent = [
    //jshint ignore:start
    {type: 'svg', layer: 1, class: 'container', data: {
        version: '1.2', baseProfile: 'tiny', viewBox: '0 0 200 200', 'enable-background': '0 0 200 200'}},
    {type: 'circle', layer: 2, class: 'clock', data: {
        cx: 100, cy: 100, r: 90}},
    {type: 'text', layer: 1, class: 'text', textContent: '12', data: {
        x: 92, y: 30}},
    {type: 'text', layer: 1, class: 'text', textContent: '3', data: {
        x: 175, y: 106}},
    {type: 'text', layer: 1, class: 'text', textContent: '6', data: {
        x: 96, y: 180}},
    {type: 'text', layer: 1, class: 'text', textContent: '9', data: {
        x: 18, y: 106}},
    {type: 'line', layer: 1, class: 'hours', data: {
        x1: 100, y1: 45, x2: 100, y2: 100}},
    {type: 'line', layer: 1, class: 'minutes', data: {
        x1: 100, y1: 25, x2: 100, y2: 100}},
    {type: 'line', layer: 1, class: 'seconds', data: {
        x1: 100, y1: 15, x2: 100, y2: 100}},
    {type: 'circle', layer: 1, class: 'pin', data: {
        cx: 100, cy: 100, r: 2}}
    //jshint ignore:end
];

module.exports = function initProcess( app ) {

    function createElmComponent( element ) {

        app.emit( 'create', element );
    }

    function initComponent() {

        elementsComponent.forEach( createElmComponent );

    }

    app.on( 'init', initComponent );

};
},{}],12:[function(require,module,exports){
// The rotationProcess converts seconds,
// minutes, and hours into degrees for drawing.
//
//
// __rotationProcess__
//
// _depends on `timeComponent`_
//
// - integer 'split&lt;segment&gt;' -> __IN__
// - [____OUT____ -> degrees 'draw/&lt;segment&gt;']
//
var timeComponent = {
    seconds: {

        toDegrees: function ( split ) {

            return split.seconds * 6;

        }
    },
    minutes: {

        toDegrees: function ( split ) {

            return ( split.minutes + ( split.seconds / 60 ) ) * 6;

        }
    },
    hours:   {

        toDegrees: function ( split ) {

            return ( split.hours % 12 * 30 ) + split.minutes / 2;

        }
    }
};

module.exports = function rotationProcess( app ) {

    var split = {};

    function makeRotationSegmentComponent( segment ) {

        return function convertToDegreesComponent( number ) {

            if ( split[segment] !== number ) {

                split[segment] = number;

                app.emit( 'draw/' + segment, timeComponent[segment].toDegrees( split ) );

            }
        };

    }

    function makeRotationComponent( segment ) {

        app.on( 'split/' + segment, makeRotationSegmentComponent( segment ) );

    }

    app.segments.forEach( makeRotationComponent );

};
},{}],13:[function(require,module,exports){
// The splitProcess transforms dates
// for calculating rotation.
//
// __splitProcess__
//
// - date 'createDate' -> __IN__
// - __OUT__ -> integer 'split/&lt;segment&gt;'
//
module.exports = function ( app ) {

    function splitDateComponent( date ) {

        return function getTimeUnitsComponent( segment ) {

            var method = 'get' + segment.charAt( 0 ).toUpperCase() + segment.substring( 1 );

            app.emit( 'split/' + segment, date[method]() );

        };

    }

    function splitComponent( date ) {

        app.segments.forEach( splitDateComponent( date ) );

    }

    app.on( 'createDate', splitComponent );

};
},{}],14:[function(require,module,exports){
// The startProcess sends elements to be created then beings
// the animationFrameProcess
//
// __startProcess__
//
// - null 'start' -> __IN__
// - __OUT__ -> null 'init'
// - __OUT__ -> bool 'animate'
//
module.exports = function startProcess( app ) {

    function startComponent() {

        app.emit( 'init' );

        app.emit( 'animate', true );

    }

    app.on( 'start', startComponent );

};
},{}]},{},[10])