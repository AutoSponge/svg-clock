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