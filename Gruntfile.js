/*global module:false*/
module.exports = function(grunt) {

  grunt.registerTask('server', 'Start the server', function() {
    var app = require('./app');
    var debug = require('debug')('faceall-activex:server');
    var http = require('http');

    /**
     * Get port from environment and store in Express.
     */

    var port = normalizePort(process.env.PORT || '3000');
    app.set('port', port);

    /**
     * Create HTTP server.
     */

    var server = http.createServer(app);

    /**
     * Listen on provided port, on all network interfaces.
     */

    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);

    /**
     * Normalize a port into a number, string, or false.
     */

    function normalizePort(val) {
      var port = parseInt(val, 10);

      if (isNaN(port)) {
        // named pipe
        return val;
      }

      if (port >= 0) {
        // port number
        return port;
      }

      return false;
    }

    /**
     * Event listener for HTTP server "error" event.
     */

    function onError(error) {
      if (error.syscall !== 'listen') {
        throw error;
      }

      var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

      // handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(bind + ' requires elevated privileges');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(bind + ' is already in use');
          process.exit(1);
          break;
        default:
          throw error;
      }
    }

    /**
     * Event listener for HTTP server "listening" event.
     */

    function onListening() {
      var addr = server.address();
      var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
      debug('Listening on ' + bind);
    }
  });

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['lib/**.js'],
        dest: 'dist/<%= pkg.name %>.js'
      },
      vendor: {
        files: {
          'vendor/<%= pkg.name %>.js': [
              'vendor/javascripts/jquery.js',
              'vendor/javascripts/bootstrap.js',
              'vendor/javascripts/plugin.js',
              'vendor/javascripts/script.js'
          ],
          'vendor/<%= pkg.name %>.css': [
              'vendor/stylesheets/bootstrap.css',
              'vendor/stylesheets/style.css'
          ]
        }
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      },
      vendor: {
        files: {
          'vendor/<%= pkg.name %>.min.js': 'vendor/<%= pkg.name %>.js'
        }
      }
    },
    cssmin: {
      options: {
        banner: '<%= banner %>'
      },
      vendor: {
        files: {
          'vendor/<%= pkg.name %>.min.css': 'vendor/<%= pkg.name %>.css'
        }
      }
    },
    copy: {
      dev: {
        files: [
          {
            expand: true,
            cwd: 'vendor',
            src: '<%= pkg.name %>.js',
            dest: 'public/javascripts/'
          },
          {
            expand: true,
            cwd: 'vendor',
            src: '<%= pkg.name %>.css',
            dest: 'public/stylesheets/'
          }
        ]
      }
    },
    watch: {
      // concat_dist: {
      //   files: '<%= concat.dist.src %>',
      //   tasks: ['concat:dist']
      // },
      concat_vendor: {
        files: ['vendor/javascripts/*.js', 'vendor/stylesheets/*.css'],
        tasks: ['concat:vendor']
      },
      // uglify_dist: {
      //   files: '<%= uglify.dist.src %>',
      //   tasks: ['uglify:dist']
      // },
      uglify_vendor: {
        files: ['vendor/<%= pkg.name %>.js'],
        tasks: ['uglify:vendor']
      },
      cssmin_vendor: {
        files: ['vendor/<%= pkg.name %>.css'],
        tasks: ['cssmin:vendor']
      },
      copy_dev: {
        files: ['vendor/<%= pkg.name %>.js', 'vendor/<%= pkg.name %>.css'],
        tasks: ['copy:dev']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-css');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task.
  grunt.registerTask('default', ['concat:vendor', 'uglify:vendor', 'cssmin:vendor', 'copy:dev', 'server', 'watch']);
  grunt.registerTask('deploy', ['concat:vendor', 'uglify:vendor', 'cssmin:vendor', 'copy:dev']);

};
