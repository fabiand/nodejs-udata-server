
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
  _key = _key.replace(/\./g, "\\.")
  return path.join(this.path, _key);
}

Store.prototype.namespace = function namespace(ns) {
console.log("namespaced", this.path, ns)
  var namespaced_path = path.join(this.path, ns)
  return this.create(namespaced_path);
}

Store.prototype.namespaces = function list_namespaces(callback) {
  fs.readdir(this.path, function(err, files) {
    files.forEach(function(file) {
      var stats = fs.statSync(file)
      if (stats.isDirectory()) {
        callback(file)
      }
    })
  })
}

Store.prototype.keys = function keys(callback) {
  console.log("Listing contents of: " + this.path)
  return fs.readdir(this.path, callback)
}

Store.prototype.exists = function exists(key, callback) {
  return key != undefined && fs.existsSync(this._fullpath(key))
}

Store.prototype.get = function get(key, callback) {
  if (this.exists(key)) {
    console.log("Getting: " + this._fullpath(key))
    fs.readFile(this._fullpath(key), callback)
  } else throw new Error("Key does not exist: " + key);
}

Store.prototype.set = function set(key, data) {
  console.log("Setting: " + this._fullpath(key))
  fs.writeFile(this._fullpath(key), data, function(err) {
    if (err) throw err;
  })
}

Store.prototype.delete = function del(key, callback) {
  if (this.exists(key)) {
    fs.unlink(this._fullpath(key), callback)
  } else throw new Error("Key does not exist: " + key);
}

Store.prototype.dump = function dump(callback) {
  for (var key in store.list()) {
    callback(key, store.get(key))
  }
}

Store.prototype.__iterator__ = Store.prototype.dump

var unosql = exports;
unosql.create = Store.prototype.create


