
// http://blog.mixu.net/2011/02/02/essential-node-js-patterns-and-snippets/
var events = require('events');
var express = require('express');

var database = require('./database');
var map = require('./map');
var upubsub = require('./pubsub');

var sse = require('./sse');
var utils = require('./utils');
var middleware = require('./middleware');

/*
 * Basic application
 */
var app = express();

/*
 * Middleware
 */
app.use(express.logger());

app.use(express.compress());
app.use(express.bodyParser());

app.use(express.static(__dirname + "/../public"));


var eventemitter = new events.EventEmitter()

/*
 * Routes
 */
var apikeys = map.create("/tmp/apikeys")
var store = map.create("/tmp/maps")
var object = map.create("/tmp/objects")
var db = database.create("/tmp/dbs")
var pubsub = upubsub.create()

/*
 * Add an example key
 */
apikeys.set("com.example.todo", "I'm lame if I use this key in production")


app.use(middleware.publishWebAppManifest())

app.all("/api/:method/:namespace", function(req, res, next) {
  var ns_exists = apikeys.exists(req.param.namespace)
console.log(req.params)
  console.log("NS " + req.params.namespace + " exists: " + ns_exists)
  if (ns_exists) {
    res.writeHead(401, {})
    return
  }
  next();
})

app.all("/api/:method/:namespace", function(req, res, next) {
  var reqobj = {url: req.url, method: req.method, namespace: req.params.namespace}
  eventemitter.emit("request", reqobj)
  next();
})

app.all("/api/:method/:namespace", function (req, res, next) {
  console.log("Verifying request " + req.url)
  var signed_headers = req.get("x-udata-signed-headers"),
      signature = req.get("x-udata-signature") || req.query.signature,
      timestamp = req.get("x-udata-timestamp") || req.query.timestamp;

  if (!signature || !signed_headers) {
    console.log("  Request is NOT signed")
    next()
    return
  }

  var txt = ""
  if (signed_headers) {
    console.log("  Verifying headers " + signed_headers + " => " + signature)
    signed_headers.split(",").forEach(function(fieldname) {
        txt += fieldname + ":" + req.get(fieldname) + "\n";
    })
  } else {
    console.log("  Verifying URL " + req.url + " => " + signature)
    txt = req.url.replace(new RegExp("[?&]signature=" + signature, "g"), "");
    }

  apikeys.get(req.params.namespace, function(err, namespace_apikey) {
    if (!namespace_apikey) throw new Error("Missing apikey for '" + req.params.namespace + "'");

    var our_signature = (new utils.HMAC(namespace_apikey, "sha1")).sign(txt);
    console.log("   Local HMAC " + our_signature)
    console.log("  Remote HMAC " + signature)

    var our_timestamp = utils.timestamp(),
        timestamp_delta = Math.abs(Number(timestamp) - our_timestamp);
    console.log("   Local time " + our_timestamp)
    console.log("  Remote time " + timestamp)
    console.log("   delta time " + timestamp_delta)

    var signature_matches = our_signature == signature,
        timestamp_is_correct = timestamp && timestamp_delta < 3000;

    if (signature_matches) {
      console.log("  Request signature is valid")
      if (timestamp_is_correct) {
        console.log("  Timestamp is valid")
      } else {
        console.log("  Timestamp is INVALID")
      }
    } else {
      console.log("  Request signature is INVALID")
    }
    next()
  })
})


app.post('/push', function(req, res){
  console.log("Dst: " + req.udata.push_url)
});

app.get('/api/map/:namespace', function(req, res) {
  store.namespace(req.params.namespace)
       .keys(function(err, fns) {
           res.json(fns)
    });
});

app.get('/api/map/:namespace/:key?', function(req, res) {
  store.namespace(req.params.namespace)
               .get(req.params.key, function(err, data) {
    res.send(200, data.toString());
  });
});

app.post('/api/map/:namespace/:key?', function(req, res) {
  res.send(200, store.namespace(req.params.namespace)
                     .set(req.params.key, req.body.value));
});

app.delete('/api/map/:namespace/:key?', function(req, res) {
  res.send(200, store.namespace(req.params.namespace)
                     .delete(req.params.key));
});

app.post('/api/db/:namespace', function(req, res) {
  db.namespace(req.params.namespace)
    .query(req.body.sql, req.body.params, function (err, rows) {
      if (err) throw err
      console.log("Rows: " + rows)
      res.json(200, rows)
  })
});

app.put('/api/db/:namespace', function(req, res) {
  db.namespace(req.params.namespace)
    .batch(req.body.sql, req.body.params, function (err) {
      if (err) throw err
      res.json(200, {})
  })
});

app.delete('/api/db/:namespace', function(req, res) {
  db.namespace(req.params.namespace)
    .delete()
});

app.get('/api/db/:namespace/schema', function(req, res) {
  var schema = db.namespace(req.params.namespace)
                 .schema(function(schema) {
    res.json(200, schema)
  })
});

app.get('/api/object/:namespace', function(req, res) {
  object.namespace(req.params.namespace)
       .keys(function(err, fns) {
           res.json(fns)
    });
});

app.get('/api/object/:namespace/:container', function(req, res) {
  object.namespace(req.params.namespace).namespace(req.params.container)
       .keys(function(err, fns) {
           res.json(fns)
    });
});

app.get('/api/object/:namespace/:container/:object', function(req, res) {
  object.namespace(req.params.namespace).namespace(req.params.container)
        .get(req.params.object, function(err, data) {
    res.send(200, data.toString());
  });
});

app.post('/api/object/:namespace/:container/:object', function(req, res) {
  var data = ""
  req.on("data", function(chunk) {
    data += chunk;
  })
  req.on("end", function() {
    res.send(200, object.namespace(req.params.namespace).namespace(req.params.container)
                        .set(req.params.object, data));
  })
});

app.delete('/api/object/:namespace/:container/:object', function(req, res) {
  res.send(200, object.namespace(req.params.namespace).namespace(req.params.container)
                      .delete(req.params.object));
});

app.post('/api/pubsub/:namespace/:channel/:event?', function(req, res) {
  var channel = req.params.channel,
      event = req.params.event,
      data = req.body;
  var pubsubchannel = pubsub.namespace(req.params.namespace);
  pubsubchannel.publish(channel, event, data)
});

app.get('/api/pubsub/:namespace/:channel', function(req, res) {
  var channel = req.params.channel;
  var eventstream = sse.create()
  var pubsubchannel = pubsub.namespace(req.params.namespace);

  var send_sse = function(event, data) {
    console.log("Pushing to " + channel + "/" + event + ": " + JSON.stringify(data))
    eventstream.send(req, res, event, data);
  }
  eventstream.start(req, res)
  pubsubchannel.subscribe(channel, send_sse)
  req.connection.addListener("close", function() {
    console.log("Detaching push-listener")
    eventemitter.removeListener(channel, send_sse)
    pubsub.delete(req.params.namespace);
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

