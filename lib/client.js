
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

    var Signer = function(apikey) {
        this.apikey = apikey;
    }

    Signer.prototype.sign = function(data) {
        console.log("Signing: " + data)
        return undefined;
    }

    var Connection = function Connection(url, namespace, request_handler, signer) {
        this.url = url;
        this.namespace = namespace;
        this.request_handler = request_handler;
        this.signer = signer || new Signer()
    }

    Connection.prototype.sign_request = function connection_signer(options, headers_to_sign) {
        var headers = options.headers
        var timestamp = Date().toString();

        headers["x-udata-timestamp"] = timestamp;
        headers_to_sign.push("x-udata-timestamp")

        var txt = ""
        headers_to_sign.forEach(function(fieldname) {
            txt += fieldname + ":" + headers[fieldname] + "\n";
        })

        var signature = this.signer.sign(txt);

        if (signature) {
            headers["x-udata-signed-headers"] = headers_to_sign.toString();
            headers["x-udata-signature"] = signature;
        }
    }

    Connection.prototype.request = function connection_request(path, options, callback) {
        var options = options || {}
        options.headers = options.headers || {}
        options.url = join_paths(this.url, path);
        options.headers["x-udata-method"] = options.type
        options.headers["x-udata-url"] = options.url
        this.sign_request(options, ["x-udata-method", "x-udata-url"])
console.log(options.toString())
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

    Connection.prototype.pubsub = function () {
        return new PubSub(this);
    }

    /*
     * Map
     */
    var Map = function Map(connection) {
        this.path = join_paths("/api/map/", connection.namespace)
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

    Map.prototype.delete = function map_delete(key, callback) {
        var options = {
            type: "DELETE",
        }
        this.connection.request(this._path_for_key(key), options, callback);
    }


    /*
     * Objects
     */
    var Objects = function Objects(connection) {
        this.path = join_paths("/api/object/", connection.namespace)
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
        this.path = join_paths("/api/db/", connection.namespace)
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
        this.connection.request(join_paths(this.path, "schema"), options, callback);
    }

    /*
     * PubSub
     */
    var PubSub = function PubSub(connection) {
        this.path = join_paths("/api/pubsub/", connection.namespace)
        this.connection = connection
    }

    PubSub.prototype._channel_url = function(channel, event) {
        /*
         * We need to pass the namespace via a query param, becausecustom headers
         * can not be specififed in SSE
         */
        var path = join_paths(this.path, channel)
        if (event) path = join_paths(path, event)
        return path
    }

    PubSub.prototype.subscribe = function pubsub_subscribe(channel, callback) {
        // https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events
        var eventsrc = new EventSource(this._channel_url(channel));

        // Add convenience functions
        var ps_instance = this;
        eventsrc.publish = function channel_publish(event, data, callback) {
            ps_instance.publish(channel, event, data, callback);
        }
        eventsrc.on = function(eventname, callback) {
            eventsrc.addEventListener(eventname, function(event) {
                callback(event);
            })
        }
        return eventsrc
    }

    PubSub.prototype.publish = function pubsub_publish(channel, event, data, callback) {
        var options = {
            type: "POST",
            data: {data: data},
        }
        this.connection.request(this._channel_url(channel, event), options, callback);
    }

    var exports = {}
    exports.create_connection = function create_connection(url, namespace, request_handler, signer) {
        return new Connection(url, namespace, request_handler, signer)
    }
    return exports
}

