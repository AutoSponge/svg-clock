module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js'],
            options: {
                globals: {
                    document: true
                }
            }
        },
        complexity: {
            generic: {
                src: ['src/**/*.js'],
                options: {
                    errorsOnly: false,
                    cyclomatic: 3,
                    halstead: 10,
                    maintainability: 130
                }
            }
        },
        docco: {
            debug: {
                src: ['src/**/*.js'],
                options: {
                    output: 'docs/'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-complexity');
    grunt.loadNpmTasks('grunt-docco');

    grunt.registerTask('default', ['jshint', 'complexity', 'docco']);

};