module.exports = function(grunt) {

  // Initializes the Grunt tasks with the following settings
  grunt.initConfig({

    // A list of files, which will be syntax-checked by JSHint
    jshint: {  },

    // Files to be concatenated … (source and destination files)
    concat: {
      options: {
        separator: ';',
        stripBanners: true
      },
      dist: {
        src: ['js/jquery-3.1.1.min.js',
              'js/less.js',
              'js/main.js'],
        dest: 'js/main.min.js'
      }
    },

    // … and minified (source and destination files)
    uglify: {
      my_target: {
        files: {
          'js/main.min.js': ['js/main.min.js']
        }
      }  
    },

    // Tasks being executed with 'grunt less'
    less: {
      production: {
        options: {
          paths: ['css'],
          yuicompress: true
        },
        files: {
          'css/main.min.css': 'css/main.less'
        }
      }
    },

  });

  // Load the plugins that provide the tasks we specified in package.json.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  


  // This is the default task being executed if Grunt
  // is called without any further parameter.
  grunt.registerTask('default', ['concat', 'uglify', 'less']);

};