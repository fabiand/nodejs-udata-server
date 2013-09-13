
var udata = udata || {}

udata.API = function() {
    "use strict";

    function join_paths(a, b) {
        return a.replace(/\/+$/, "") + "/" + b.replace(/^\/+/, "");
    }

    function escape_name(name) {
        return encodeURIComponent(key).replace(/\./g, "&dot;");
    }

    var Connection = function Connection(url, namespace, apikey, request_handler) {
        this.url = url;
        this.namespace = namespace;
        this.apikey = apikey;
        this.request_handler = request_handler;
    }

    Connection.prototype.request = function connection_request(context, options) {
        options.url = join_paths(this.url, options.path);
        options.headers = {"X-udata-namespace": namespace};
        this.request_handler(context, options)
    }

    Connection.prototype.map = function () {
        return new Map(this);
    }

    /*
     * Map
     */
    var Map = function Map(connection) {
        this.path = "/api/map"
        this.connection = connection
    }

    Map.prototype._path_for_key = function(key) {
        return this.path + "/" + escape_name(key);
    }

    Map.prototype.get = function map_get(key) {
        var options = {
            path: this._path_for_key(key),
            type: "GET",
        }
        this.connection.request(this, options);
    }

    Map.prototype.set = function map_set(key, value) {
        var options = {
            path: this._path_for_key(key),
            type: "POST",
            data: value,
        }
        this.connection.request(this, options);
    }

    Map.prototype.delete = function map_delete(key) {
        var options = {
            path: this._path_for_key(key),
            type: "DELETE",
        }
        this.connection.request(this, options);
    }

    /*
     * Objects
     */
    var Objects = function Objects() {
        this.path = "/api/object"
    }

    Objects.prototype.download = function objects_download(container, objectname) {

    }

    Objects.prototype.upload = function objects_upload(container, objectname, data, metadata) {

    }

    Objects.prototype.delete = function objects_delete(key) {

    }

    /*
     * Database
     */
    var Database = function Database() {
        this.path = "/api/db"
    }

    Database.prototype.query = function database_query(sql) {

    }

    Database.prototype.exec = function database_exec(sql) {

    }

    Database.prototype.schema = function database_schema() {

    }

    /*
     * Events
     */
    var Events = function Events() {
        this.path = "/api/events"
    }

    Events.prototype.subscribe = function events_subscribe(eventname) {

    }

    Events.prototype.emit = function events_emit(eventname, data) {

    }

    var exports = {}
    exports.create_connection = function create_connection(url, namespace, apikey, request_handler) {
        return new Connection(url, namespace, apikey, request_handler)
    }
    return exports
}

