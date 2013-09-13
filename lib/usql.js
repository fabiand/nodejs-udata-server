
var fs = require("fs"),
    path = require("path"),
    sqlite3 = require('sqlite3').verbose();


function Database(path) {
  this.path = path
  this.filename = this.path + "/db.sqlite3"
  this.db = new sqlite3.Database(this.filename);
  this.namespaces = {}
}

Database.prototype.create = function create(path) {
  if (!fs.existsSync(path)) {
    console.log("Creating database in: " + path)
    fs.mkdirSync(path);
  }
    console.log("Using database in: " + path)
  return new Database(path);
};

Database.prototype.namespace = function namespace(ns) {
  if (!(ns in this.namespaces)) {
    var namespaced_path = path.join(this.path, ns)
    this.namespaces[ns] = this.create(namespaced_path)
  }
  return this.namespaces[ns]
}

Database.prototype.namespaces = function list_namespaces(callback) {
  for (var namespace in this.namespaces) {
    callback(namespace)
  }
}

Database.prototype.query = function query(sql, params, callback) {
  this.db.all(sql, params, callback)
}

Database.prototype.batch = function batch(sql, params, callback) {
  this.db.exec(sql, params, callback)
}

Database.prototype.delete = function db_delete(callback) {
  fs.unlinkSync(this.filename)
}

Database.prototype.schema = function schema(callback) {
  this.db.all("SELECT * FROM sqlite_master", function(err, rows) {
    var schema = []
    rows.forEach(function(row) {
      schema.push(row.sql)
    })
    callback(schema)
  })
}

Database.prototype.dump = function dump(callback) {
  // HACKISCH
  var spawn = require('child_process').spawn,
      sqliteproc = spawn('sqlite3', [this.filename, ".dump"]);
  var err = undefined;
  sqliteproc.stdout.on("data", function(data) {
    data.toString().split("\n").forEach(function(sql) {
      // WE DON'T ALLOW TRANSCTIONS
      if (!sql || /^(BEGIN|COMMIT)/.test(sql)) return;
      callback(err, sql)
    })
  })
}

Database.prototype.__iterator__ = Database.prototype.dump


var usql = exports;
usql.create = Database.prototype.create
