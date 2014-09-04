'use strict';

var fs     = require('fs')
  , events = require('events')
  , buffer = require('buffer')
  , http   = require('http')
  , url    = require('url')
  , path   = require('path')
  , mime   = require('./mime').types
  , zlib   = require('zlib')
  , formidable = require('formidable')
  , node_hash  = require('node_hash');

exports.createServer = function(config) {
  return new StaticServer(config);
}

function StaticServer(config) {
  var that = this;
  that.upPath  = config.upload || 'pub';
  that.port    = config.port   || 3015;
  that.dirname = config.dirname || __dirname;
  that.server  = http.createServer(function(req, res) {
    var pathname = url.parse(req.url).pathname;
    var realpath = that.dirname + pathname;
    var ip = that.__getClientIp(req);

    /* ============打访问日志==================== */
    res.on('finish', function() {
      var IP         = that.__getClientIp(req);
      var realPath   = realpath;
      var statusCode = this.statusCode;
      console.log(IP+' '+realPath+' '+statusCode);
    });
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
      /** >>> 允许哪个域名上传,上传控制,目前允许所有网站、IP, TODO: 上线后限制如*.louding.com >>> **/
      res.setHeader('Access-Control-Allow-Origin', '*')
      // res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      var form = new formidable.IncomingForm();
      form.parse(req, function(err, fields, files) {
        console.log(fields);
        console.log(files);
        var myfile = files['myfile'] || {
            name : "tmp",
            path : "/tmp/a"
        };
        // TODO: 删除路径信息及拓展名
        var ext        = path.extname(myfile.name);
            ext        = ext ? ext.slice(1) : 'unknown';
        var store_name = fields.store || that.__getUniqueName()+'.'+ext;
        var store_path = that.dirname+'/pub/'+store_name;
        console.log(store_path);
        
        fs.rename(myfile.path, store_path, function(err) {
          console.log(err);
          if (err) {
            return res.end(JSON.stringify({ret: 3}));   // 上传文件失败
          } else {
            return res.end(JSON.stringify({ret: 1, path: '/pub/'+store_name}));
          }
        });
      });
    }
  });
};

StaticServer.prototype.listen = function(port, cb) {
  this.server.listen(port, function(err) {
    return cb(err);
  });
};

/********* 获取IP *********/
StaticServer.prototype.__getClientIp = function(req) {
  var ipAddress;
  var forwardedIpsStr = req.headers['x-forwarded-for']; 
  if (forwardedIpsStr) {
    var forwardedIps = forwardedIpsStr.split(',');
    ipAddress = forwardedIps[0];
  }
  if (!ipAddress) {
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
}

/********* 生成唯一ID *********/
StaticServer.prototype.__getUniqueName = function() {
  var salt = "longyu86";
  var seed = Math.floor(new Date().getTime()/1000%10000000000000);
  var rand = "" + Math.floor(Math.random()*10) + Math.floor(Math.random()*10/1);
  var hash = node_hash.md5(seed+rand, salt);
  return hash;
}
