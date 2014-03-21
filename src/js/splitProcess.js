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