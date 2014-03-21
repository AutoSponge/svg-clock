// [SVG](./SVG.html)
var svg = require( './SVG' );

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

        var hand = svg[segment];

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

    app.on( 'create', svg );

};