
/* vim: sw=2 : */

var url = require("url")

module.exports.publishWebAppManifest = function() {
  var webapp_suffix = /\.webapp$/
  return function (req, res, next) {
    var path = url.parse(req.url)
    if (webapp_suffix.test(path)) {
      res.writeHead(200, {'content-type':'application/x-web-app-manifest+json'});
    }
    next()
  }
}

module.exports.verifyHMACSignature = function (header_signature_name, header_signed_fields, query_name, algorithm, callback) {
  
}
