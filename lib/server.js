'use strict';

var fs     = require('fs')
  , events = require('events')
  , buffer = require('buffer')
  , http   = require('http')
  , url    = require('url')
  , path   = require('path')
  , mime   = require('./mime').types
  , zlib   = require('zlib')
  , formidable = require('formidable');

exports.createServer = function(config) {
  return new StaticServer(config);
}

function StaticServer(config) {
  var that = this;
  that.upPath  = config.upload || 'pub';
  that.port    = config.port   || 3015;
  that.serdir = config.dirname || __dirname;
  that.server  = http.createServer(function(req, res) {
    var pathname = url.parse(req.url).pathname;
    var realpath = that.serdir + pathname;
    if (req.method.toLowerCase() == 'get'){
      fs.stat(realpath, function(err, stat) {
        if (err || stat.isDirectory()) {
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.write('This request URL ' + pathname + ' was not found on this server.'); res.end();
        } else {
          fs.readFile(realpath, 'binary', function(err, file) {
            if (err) {
              res.writeHead(500, {'Content-Type': 'text/plain'});
              res.end(err);
            } else {
              var ext = path.extname(realpath);
                  ext = ext ? ext.slice(1) : 'unknown';
              if (ext.match(config.expires.fileMatch)) {
                var expires = new Date();
                expires.setTime(expires.getTime() + config.expires.maxAge * 1000);
                res.setHeader("Expires", expires.toUTCString());
                res.setHeader("Cache-Control", "max-age=" + config.expires.maxAge);
              }
              var lastModified = stat.mtime.toUTCString();
              res.setHeader("Last-Modified", lastModified);
              if (req.headers["if-modified-since"] && lastModified == req.headers["if-modified-since"]) {
                res.writeHead(304, "Not Modified");
                return res.end();
              }
              var contentType = mime[ext] || 'text/plain';
              res.writeHead(200, {'Content-Type': contentType});
              res.write(file, 'binary');
              return res.end();
            }
          });
        }
      });
    } else {
      var form = new formidable.IncomingForm();
      form.parse(req, function(err, fields, files) {
        return res.end(JSON.stringify({ret: 3}));
      });
    }
  });
};

StaticServer.prototype.listen = function(port, cb) {
  this.server.listen(port, function(err) {
    cb(err);
  });
};
