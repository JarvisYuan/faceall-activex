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
        src: ['vendor/javascripts/*.js'],
        dest: 'vendor/<%= pkg.name %>.js'
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
        src: '<%= concat.vendor.dest %>',
        dest: 'vendor/<%= pkg.name %>.min.js'
      }
    },
    copy: {
      js: {
        expand: true,
        cwd: 'vendor',
        src: '<%= pkg.name %>.min.js',
        dest: 'public/javascripts/'
      },
      css: {
        expand: true,
        cwd: 'vendor',
        src: 'stylesheets/**.css',
        dest: 'public/'
      }
    },
    watch: {
      // concat_dist: {
      //   files: '<%= concat.dist.src %>',
      //   tasks: ['concat:dist']
      // },
      concat_vendor: {
        files: '<%= concat.vendor.src %>',
        tasks: ['concat:vendor']
      },
      // uglify_dist: {
      //   files: '<%= uglify.dist.src %>',
      //   tasks: ['uglify:dist']
      // },
      uglify_vendor: {
        files: '<%= uglify.vendor.src %>',
        tasks: ['uglify:vendor']
      },
      copy_js: {
        files: '<%= copy.js.cwd %>/<%= copy.js.src %>',
        tasks: ['copy:js']
      },
      copy_css: {
        files: '<%= copy.css.cwd %>/<%= copy.css.src %>',
        tasks: ['copy:css']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task.
  grunt.registerTask('default', ['concat:vendor', 'uglify:vendor', 'copy', 'server', 'watch']);
  grunt.registerTask('deploy', ['concat:vendor', 'uglify:vendor', 'copy']);

};