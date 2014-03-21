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