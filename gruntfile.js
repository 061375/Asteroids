module.exports = function(grunt) {
    // Load the required npm tasks
    grunt.loadNpmTasks('grunt-contrib-uglify-es');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-sass');

    // Project configuration.
    grunt.initConfig({
        // Task to run TypeScript compiler in watch mode
        shell: {
            tsc: {
                command: 'tsc --watch'
            }
        },
        concurrent: {
            options: {
                logConcurrentOutput: true
            },
            tasks: ['watch', 'shell:tsc']
        },
        uglify: {
            my_target: {
                files: {
                    'js/script.js': ['_/js/**/*.js'] 
                }
            }
        },
        sass: {
            dist: {
                options: {
                    implementation: require('node-sass'),  // Use 'sass' if you installed Dart Sass
                    style: 'compressed'
                },
                files: {
                    'css/style.css': '_/scss/z_style.scss'
                }
            }
        },
        watch: {
            options: { livereload: true },
            scripts: {
                files: ['_/js/**/*.js'],
                tasks: ['uglify']
            },
            sass: {
                files: ['_/scss/**/*.scss'],
                tasks: ['sass']
            }
        }
    }); // end of initConfig

    // Register the default tasks
    grunt.registerTask('default', ['concurrent','watch']);
}; // end of module.exports
