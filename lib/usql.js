
var sqlite3 = require('sqlite3').verbose();


function Database(path) {
  this.path = path
  this.db = new sqlite3.Database(':memory:');
  this.namespaces = {}
}

Database.prototype.create = function create(path) {
  return new Database(path);
};

Database.prototype.namespace = function namespace(ns) {
  if (!(ns in this.namespaces)) {
    this.namespaces[ns] = new Database()
  }
  return this.namespaces[ns]
}

Database.prototype.query = function query(sql, params, callback) {
  this.db.all(sql, params, callback)
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

var usql = exports;
usql.create = Database.prototype.create
