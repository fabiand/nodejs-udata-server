
var events = require('events');

function PubSub() {
  this.eventemitter = new events.EventEmitter()
  this.namespaces = {}
}

PubSub.prototype.create = function create(ns) {
  console.log("Using pubsub " + ns)
  return new PubSub();
};

PubSub.prototype.namespace = function namespace(ns) {
  if (!(ns in this.namespaces)) {
    console.log("Creating new pubsub in " + ns);
    this.namespaces[ns] = this.create(ns)
  }
  return this.namespaces[ns]
}

PubSub.prototype.publish = function pubsub_publish(channel, event, data) {
  var obj = {event: event, data: data}
  this.eventemitter.emit(channel, obj);
}

PubSub.prototype.subscribe = function pubsub_subscribe(channel, callback) {
  this.eventemitter.on(channel, function (obj) {
    callback(obj.event, obj.data)
  });
}

var pubsub = exports;
pubsub.create = PubSub.prototype.create
