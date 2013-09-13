
var udata = udata || {}

udata.API = function() {
    "use strict";

    function join_paths(a, b) {
        return a.replace(/\/+$/, "") + "/" + b.replace(/^\/+/, "");
    }

    function escape_name(name) {
        return encodeURIComponent(name).replace(/\./g, "&dot;");
    }

    function _path_for_segments(base, segments) {
        var path = base;
        segments.forEach(function(segment) {
            if (segment) {
                path = join_paths(path, escape_name(segment));
            }
        })
        return path
    }

    var Connection = function Connection(url, namespace, apikey, request_handler) {
        this.url = url;
        this.namespace = namespace;
        this.apikey = apikey;
        this.request_handler = request_handler;
    }

    Connection.prototype.request = function connection_request(path, options, callback) {
        var options = options || {}
        options.url = join_paths(this.url, path);
        options.headers = {"X-udata-namespace": this.namespace};
        this.request_handler(options, callback)
    }

    Connection.prototype.map = function () {
        return new Map(this);
    }

    Connection.prototype.objects = function () {
        return new Objects(this);
    }

    Connection.prototype.database = function () {
        return new Database(this);
    }

    /*
     * Map
     */
    var Map = function Map(connection) {
        this.path = "/api/map"
        this.connection = connection
    }

    Map.prototype._path_for_key = function(key) {
        return _path_for_segments(this.path, [key])
    }

    Map.prototype.list = function map_list(callback) {
        var options = {
            type: "GET",
        }
        this.connection.request(this.path, options, callback);
    }

    Map.prototype.get = function map_get(key, callback) {
        var callback = callback || function(err, value) {}
        var options = {
            type: "GET",
        }
        this.connection.request(this._path_for_key(key), options, callback);
    }

    Map.prototype.set = function map_set(key, value, callback) {
        var callback = callback || function(err) {}
        var options = {
            type: "POST",
            data: {value: value},
        }
        this.connection.request(this._path_for_key(key), options, callback);
    }

    Map.prototype.delete = function map_delete(key) {
        var options = {
            type: "DELETE",
        }
        this.connection.request(this._path_for_key(key), options);
    }


    /*
     * Objects
     */
    var Objects = function Objects(connection) {
        this.path = "/api/object"
        this.connection = connection
    }

    Objects.prototype._path_for_object = function(container, object) {
        return _path_for_segments(this.path, [container, object])
    }

    Objects.prototype.list_containers = function objects_list_containers(callback) {
        var callback = callback || function(err, container_list) {}
        var options = {
            type: "GET",
        }
        this.connection.request(this.path, options, callback);
    }

    Objects.prototype.list_objects = function objects_list_containers(container, callback) {
        var callback = callback || function(err, object_list) {}
        var options = {
            type: "GET",
        }
        this.connection.request(this._path_for_object(container), options, callback);
    }

    Objects.prototype.download = function objects_download(container, objectname, callback) {
        var callback = callback || function(err, data) {}
        var options = {
            type: "GET",
        }
        this.connection.request(this._path_for_object(container, objectname), options, callback);
    }

    Objects.prototype.upload = function objects_upload(container, objectname, data, callback) {
        var callback = callback || function(err) {}
        var options = {
            type: "POST",
            contentType: false,
            processData: false,
            data: data,
        }
        this.connection.request(this._path_for_object(container, objectname), options, callback);
    }

    Objects.prototype.delete = function objects_delete(container, objectname) {
        var options = {
            type: "DELETE",
        }
        this.connection.request(this._path_for_object(container, objectname), options);
    }

    /*
     * Database
     */
    var Database = function Database(connection) {
        this.path = "/api/db"
        this.connection = connection
    }

    Database.prototype.query = function database_query(sql, params, callback) {
        var options = {
            type: "POST",
            data: {sql: sql,
                   params: params}
        }
        this.connection.request(this.path, options, callback);
    }

    Database.prototype.batch = function database_exec(sql, params, callback) {
        
        var options = {
            type: "PUT",
            data: {sql: sql,
                   params: params}
        }
        this.connection.request(this.path, options, callback);
    }

    Database.prototype.delete = function database_delete(callback) {
        var options = {
            type: "DELETE",
        }
        this.connection.request(this.path, options, callback);
    }

    Database.prototype.schema = function database_schema(callback) {
        var options = {
            type: "GET",
        }
        this.connection.request(join_paths(this.path, "/schema"), options, callback);
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

