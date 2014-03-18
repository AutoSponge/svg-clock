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

                app.emit( "draw/" + segment, timeComponent[segment].toDegrees( split ) );

            }
        };

    }

    function makeRotationComponent( segment ) {

        app.on( "split/" + segment, makeRotationSegmentComponent( segment ) );

    }

    app.segments.forEach( makeRotationComponent );

};