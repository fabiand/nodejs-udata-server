
// http://blog.mixu.net/2011/02/02/essential-node-js-patterns-and-snippets/
var events = require('events');

var express = require('express');

var usql = require('./database');
var unosql = require('./map');
var upubsub = require('./pubsub');
var sse = require('./sse');

var app = express();

/*
 * Middleware
 */
app.use(express.logger());

//app.use(express.compress());
app.use(express.bodyParser());

app.use(express.static(__dirname + "/../public"));


var eventemitter = new events.EventEmitter()

/*
 * Routes
 */
app.get('/', function(req, res){
  res.send('hello world');
});

var store = unosql.create("/tmp/store")
var object = unosql.create("/tmp/object")
var db = usql.create("/tmp/db")
var pubsub = upubsub.create()

app.all("*", function(req, res, next) {
  console.log("REQUEST " + req.url)
  var udata = {}
  req.udata = udata
  udata.push_url = req.get("x-udata-push-url")
  udata.namespace = req.get("x-udata-namespace") || req.query.namespace
  console.log("Namespace: " + udata.namespace)
  eventemitter.emit("request", {url: req.url, method: req.method, namespace: udata.namespace})
//  if (!udata.namespace) {
//    res.send(501, "Unknown namespace: " + udata.namespace)
//  } else 
  next();
})

app.post('/push', function(req, res){
  console.log("Dst: " + req.udata.push_url)
});

app.get('/api/map', function(req, res) {
  store.namespace(req.udata.namespace)
       .keys(function(err, fns) {
           res.json(fns)
    });
});

app.get('/api/map/:key?', function(req, res) {
  store.namespace(req.udata.namespace)
               .get(req.params.key, function(err, data) {
    res.send(200, data.toString());
  });
});

app.post('/api/map/:key?', function(req, res) {
  res.send(200, store.namespace(req.udata.namespace)
                     .set(req.params.key, req.body.value));
});

app.delete('/api/map/:key?', function(req, res) {
  res.send(200, store.namespace(req.udata.namespace)
                     .delete(req.params.key));
});

app.post('/api/db', function(req, res) {
  db.namespace(req.udata.namespace)
    .query(req.body.sql, req.body.params, function (err, rows) {
      if (err) throw err
      console.log("Rows: " + rows)
      res.json(200, rows)
  })
});

app.put('/api/db', function(req, res) {
  db.namespace(req.udata.namespace)
    .batch(req.body.sql, req.body.params, function (err) {
      if (err) throw err
      res.json(200, {})
  })
});

app.delete('/api/db', function(req, res) {
  db.namespace(req.udata.namespace)
    .delete()
});

app.get('/api/db/schema', function(req, res) {
  var schema = db.namespace(req.udata.namespace)
                 .schema(function(schema) {
    res.json(200, schema)
  })
});

app.get('/api/object', function(req, res) {
  object.namespace(req.udata.namespace)
       .keys(function(err, fns) {
           res.json(fns)
    });
});

app.get('/api/object/:container', function(req, res) {
  object.namespace(req.udata.namespace).namespace(req.params.container)
       .keys(function(err, fns) {
           res.json(fns)
    });
});

app.get('/api/object/:container/:object', function(req, res) {
  object.namespace(req.udata.namespace).namespace(req.params.container)
        .get(req.params.object, function(err, data) {
    res.send(200, data.toString());
  });
});

app.post('/api/object/:container/:object', function(req, res) {
  var data = ""
  req.on("data", function(chunk) {
    data += chunk;
  })
  req.on("end", function() {
    res.send(200, object.namespace(req.udata.namespace).namespace(req.params.container)
                        .set(req.params.object, data));
  })
});

app.delete('/api/object/:container/:object', function(req, res) {
  res.send(200, object.namespace(req.udata.namespace).namespace(req.params.container)
                      .delete(req.params.object));
});

app.post('/api/pubsub/:channel/:event?', function(req, res) {
  var channel = req.params.channel,
      event = req.params.event,
      data = req.body;
  var pubsubchannel = pubsub.namespace(req.udata.namespace);
  pubsubchannel.publish(channel, event, data)
});

app.get('/api/pubsub/:channel', function(req, res) {
  var channel = req.params.channel;
  var eventstream = sse.create()
  var pubsubchannel = pubsub.namespace(req.udata.namespace);

  var send_sse = function(event, data) {
    eventstream.send(req, res, event, data);
  }
  eventstream.start(req, res)
  pubsubchannel.subscribe(channel, send_sse)
  req.connection.addListener("close", function() {
    eventemitter.removeListener(channel, send_sse)
  })
});

/*
 * Internal / deprecated event API
 */
app.get('/api/event/:event', function(req, res) {
  var eventid = req.params.event
  var eventstream = sse.create()

  var send_sse = function(data) {
    eventstream.send(req, res, eventid, data);
  }

  eventstream.start(req, res)
  eventemitter.on(eventid, send_sse);
  req.connection.addListener("close", function() {
    eventemitter.removeListener(eventid, send_sse)
  })
});


console.log("Ready to go...")
app.listen(3000);

