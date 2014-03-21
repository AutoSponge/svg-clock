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