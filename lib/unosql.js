
var fs = require("fs"),
  path = require("path");

function Store(path) {
  this.path = path
}

Store.prototype.create = function create(path) {
  if (!fs.existsSync(path)) {
    console.log("Creating store in: " + path)
    fs.mkdirSync(path);
  }
    console.log("Using store in: " + path)
  return new Store(path);
};

Store.prototype._fullpath = function fullpath(key) {
  var _key = encodeURIComponent(key);
  return path.join(this.path, _key);
}

Store.prototype.namespace = function namespace(ns) {
  var namespaced_path = path.join(this.path, ns)
  return this.create(namespaced_path);
}

Store.prototype.list = function list(callback) {
  return fs.readdir(this.path, callback)
}

Store.prototype.exists = function exists(key, callback) {
  return key && fs.existsSync(this._fullpath(key))
}

Store.prototype.get = function get(key, callback) {
  if (this.exists(key)) {
    fs.readFile(this._fullpath(key), callback)
  } else throw new Error("Key does not exist: " + key);
}

Store.prototype.set = function set(key, data) {
  fs.writeFile(this._fullpath(key), data, function(err) {
    if (err) throw err;
  })
}

Store.prototype.delete = function get(key, callback) {
  if (this.exists(key)) {
    fs.unlink(this._fullpath(key), callback)
  } else throw new Error("Key does not exist: " + key);
}


var unosql = exports;
unosql.create = Store.prototype.create


