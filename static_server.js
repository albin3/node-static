var server = require('./lib/server')
  , config = require('./config');
    config.dirname = __dirname+'/files';

console.log(config);
var static_server = server.createServer(config);
static_server.listen(config.port, function(err) {
  if (!err) {
    return console.log('Static server started at port ' + config.port);
  }
  return console.log('Static server started with an err: ' + err);
});
