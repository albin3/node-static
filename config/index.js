
module.exports = {
  "upload": "pub"
 ,"port": 3015
 ,"expires": {
      "fileMatch": /^(gif|png|jpg|jpeg|js|css)$/ig,
      "maxAge": 60 * 60 *24 * 365
  }
 ,"compress": {
      "match": /css|js|html/ig
 }
};
