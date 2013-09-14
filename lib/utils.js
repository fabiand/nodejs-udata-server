
var crypto = require("crypto")

var HMAC = function(sharedsecret, algorithm, encoding) {
    this.sharedsecret = new Buffer(sharedsecret, "utf8")
    this.algorithm = algorithm || "sha1"
    this.encoding = encoding || "hex"
}

HMAC.prototype.sign = function sign(data) {
console.log("using " + this.algorithm)
  var signer = crypto.createHmac(this.algorithm, this.sharedsecret);
  signer.write(new Buffer(data));
  return signer.digest(this.encoding);
}

var utils = exports
utils.HMAC = HMAC
