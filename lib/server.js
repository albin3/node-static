'use strict';

var fs     = require('fs')
  , events = require('events')
  , buffer = require('buffer')
  , http   = require('http')
  , url    = require('url')
  , path   = require('path')
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
      fs.exists(realpath, function(exists) {
        if (!exists) {
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.write('This request URL ' + pathname + ' was not found on this server.'); res.end();
        } else {
          fs.readFile(realpath, 'binary', function(err, file) {
            if (err) {
              res.writeHead(500, {'Content-Type': 'text/plain'});
              res.end(err);
            } else {
              res.writeHead(200, {'Content-Type': 'text/plain'});
              res.write(file, 'binary');
              res.end();
            }
          });
        }
      });
    } else {
      var form = new formidable.IncomingForm();
      form.parse(req, function(err, fields, files) {
        console.log(fields);
        console.log(files);
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
