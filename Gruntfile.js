module.exports = function (grunt) {

    var serverPort = 8888;
    var livereloadPort = 35729;

    grunt.initConfig({
        connect: {
            dev: {
                options: {
                    hostname: "192.168.0.17",
                    port: serverPort,
                    livereload: livereloadPort
                }
            }
        },
        watch: {
            options: {
                spawn: false,
                forever: false,
                livereload: livereloadPort
            },
            html: {
                files: "src/*.html"
            },
            css: {
                files: "src/css/**.css"
            },
            js: {
                files: "src/js/**.js"
            }
        }
    });


    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-connect");

    grunt.registerTask("default", [
        "connect",
        "watch"
    ]);

};