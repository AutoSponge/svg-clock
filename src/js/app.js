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