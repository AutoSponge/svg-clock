// SVG Clock
// ---------
//
// This SVG clock demo was build to highlight the following;
//
// - Modern web techniques (HTML5)
// - Flow-based Programming (FBP) (as a design pattern)
// - Separation of concerns (SoC)
// - Design impacts on complexity and maintainability
//
// HTML5
// -----
// This demo uses no external libraries and highlights the
// benefits of drawing/animating SVG graphics with css and JavaScript.
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
// reusable, and testable.  Further steps can be taken to separate the
// modules into discrete files but I left everything in tact in this
// demo for simplicity and clarity.
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


// We only have one global, `app`.
// `app` holds `segments` data, which several processes need.
var app = {
    segments: [
        "seconds",
        "minutes",
        "hours"
    ]
};

// The mediatorProcess installs topicsComponent methods
// to app on instantiation.
//
// __mediatorProcess__
//
// _depends on `topicsComponent`_
//
(function mediatorProcess( topicsComponent ) {

    // We export the `on` and `emit` capabilities.
    // Both are technically __IN__ ports and provide the
    // communication channels used to create __IN__/__OUT__ ports
    // for other processes.
    app.on = topicsComponent.on;

    app.emit = topicsComponent.emit;

}(function () {

    var cache = {};

    function getTopic( topic ) {

        var list = cache[topic] = cache[topic] || [];

        return list;

    }

    // we want to return data so reduce keeps applying it
    function emitData( data, callback ) {

        callback.call( null, data );

        return data;

    }

    return {

        on: function ( topic, callback ){

            getTopic( topic).push( callback );

        },
        emit: function ( topic, data ) {

            getTopic( topic ).reduce( emitData, data );

        }

    };
}()));

// The splitProcess transforms dates
// for calculating rotation.
//
// __splitProcess__
//
// - date "createDate" -> __IN__
// - __OUT__ -> integer "split/&lt;segment&gt;"
//
(function splitProcess() {

    function splitDateComponent( date ) {

        return function getTimeUnitsComponent( segment ) {

            var method = "get" + segment.charAt( 0 ).toUpperCase() + segment.substring( 1 );

            app.emit( "split/" + segment, date[method]() );

        };

    }

    function splitComponent(date) {

        app.segments.forEach(splitDateComponent( date ));

    }

    app.on( "createDate", splitComponent );
}());

// The rotationProcess converts seconds,
// minutes, and hours into degrees for drawing.
//
//
// __rotationProcess__
//
// _depends on `timeComponent`_
//
// - integer "split&lt;segment&gt;" -> __IN__
// - [____OUT____ -> degrees "draw/&lt;segment&gt;"]
//
(function rotationProcess( timeComponent ) {

    var split = {};

    function makeRotationSegmentComponent( segment ) {

        return function convertToDegreesComponent( number ) {

            if ( split[segment] !== number ) {

                split[segment] = number;

                app.emit( "draw/" + segment, timeComponent[segment].toDegrees( split ) );

            }
        };

    }

    function makeRotationComponent( segment ) {

        app.on( "split/" + segment, makeRotationSegmentComponent( segment ) );

    }

    app.segments.forEach( makeRotationComponent );

}({
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
    hours: {

        toDegrees: function ( split ) {

            return ( split.hours % 12 * 30 ) + split.minutes / 2;

        }
    }
}));

// The drawProcess draws objects on the DOM
// on create, drawProcess passes element to SVG and caches the SVG element
// on draw the element is pulled from the cache and rotated.
//
// __drawProcess__
//
// _depends on `SVG`_
//
// - element "create" -> __IN__
// - degrees "draw/&lt;segment&gt;" -> __IN__
//
(function drawProcess( SVG ) {

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

    function drawComponent( segment ) {

        app.on( "draw/" + segment, drawSegmentComponent( segment ) );
    }

    app.segments.forEach( drawComponent );

    app.on( "create", SVG );

}(function () {

    // keep the interface fluent
    function SVG( config ) {

        if ( !( this instanceof SVG ) ) {

            return new SVG( config );

        }

        this.config = config;

        this.create()
            .set( "class", this.config.class )
            .setText()
            .setData()
            .register()
            .appendTo( this.config.layer );
    }

    // store layers as a class property
    SVG.layers = [document.getElementsByTagName( "body" )[0]];

    SVG.prototype = {

        create: function () {

            this.elm = document.createElementNS( "http://www.w3.org/2000/svg", this.config.type );

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

            var origin = "transform-origin: 100 100;",

                transform = "transform:rotate(" + degrees + "deg);",

                style = origin  + transform +
                    "-ms-"      + origin    +
                    "-ms-"      + transform +
                    "-webkit-"  + origin    +
                    "-webkit-"  + transform;

            if ( transition === false ) {

                style += "transition: none;";

            }

            return this.set( "style", style );

        }
    };

    return SVG;

}()));

// The initProcess sends elements to be created.
//
// __initProcess__
//
// _depends on `elementsComponent`_
//
// - null "init" -> __IN__
// - __OUT__ -> element "create"
//
(function initProcess( elementsComponent ) {

    function createElmComponent( element ) {

        app.emit( "create", element );
    }

    function initComponent() {

        elementsComponent.forEach( createElmComponent );

    }

    app.on( "init", initComponent );

}([
    {type: "svg",       layer: 1,   class: "container", data: {
        version: "1.2", baseProfile: "tiny", viewBox: "0 0 200 200", "enable-background": "0 0 200 200"}},
    {type: "circle",    layer: 2,   class: "clock",     data: {
        cx: 100, cy: 100, r: 90}},
    {type: "text",      layer: 1,   class: "text",      textContent: "12",  data: {
        x: 92, y: 30}},
    {type: "text",      layer: 1,   class: "text",      textContent: "3",   data: {
        x: 175, y: 106}},
    {type: "text",      layer: 1,   class: "text",      textContent: "6",   data: {
        x: 96, y: 180}},
    {type: "text",      layer: 1,   class: "text",      textContent: "9",   data: {
        x: 18, y: 106}},
    {type: "line",      layer: 1,   class: "hours",     data: {
        x1: 100, y1: 45, x2: 100, y2: 100}},
    {type: "line",      layer: 1,   class: "minutes",   data: {
        x1: 100, y1: 25, x2: 100, y2: 100}},
    {type: "line",      layer: 1,   class: "seconds",   data: {
        x1: 100, y1: 15, x2: 100, y2: 100}},
    {type: "circle",    layer: 1,   class: "pin",     data: {
        cx: 100, cy: 100, r: 2}}
]));

// The animationFrameProcess controls how often
// we animate the clock.
//
// __animationFrameProcess__
//
// - boolean "animate" -> __IN__
// - __OUT__ -> date "createDate"
//
(function animationFrameProcess() {

    var intervalData;

    function createDateComponent() {

        app.emit( "createDate", new Date() );
    }

    function animationFrameComponent(bool) {

        intervalData = bool ? setInterval( createDateComponent, 1000 ) : clearInterval( intervalData );

    }

    app.on( "animate", animationFrameComponent );

}());

// The startProcess sends elements to be created then beings
// the animationFrameProcess
//
// __startProcess__
//
// - null "start" -> __IN__
// - __OUT__ -> null "init"
// - __OUT__ -> bool "animate"
//
(function startProcess() {

    function startComponent() {

        app.emit( "init" );

        app.emit( "animate", true );

    }

    app.on( "start", startComponent );

}());

app.emit( "start" );

// the obviously orthogonal "stopProcess" is omitted as an exercise for the reader