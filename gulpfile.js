var gulp = require( 'gulp' ),
    jshint = require( 'gulp-jshint' ),
    docco = require( 'gulp-docco' ),
    complexity = require( 'gulp-complexity' ),
    browserify = require( 'gulp-browserify' );

gulp.task( 'scripts', function () {
    return gulp.src( 'src/js/app.js' )
        .pipe( browserify( {} ) )
        .pipe( gulp.dest( './build/js' ) )
} );

gulp.task( 'default', ['scripts'], function () {
    return gulp.src( './src/**/*.js' )
        .pipe( jshint() )
        .pipe( jshint.reporter( require( 'jshint-stylish' ) ) )
        .pipe( complexity( {
            breakOnErrors: true,
            errorsOnly: false,
            cyclomatic: 3,
            halstead: 10,
            maintainability: 120
        } ) )
        .pipe( docco() )
        .pipe( gulp.dest( './docs' ) );
} );