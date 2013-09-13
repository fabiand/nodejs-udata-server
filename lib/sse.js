
/*
 * https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events
 */

function SSE() {
    return this
}

SSE.prototype.start = function start(req, res) {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    });
    res.write("retry: 10000\n");
}

SSE.prototype.send = function (req, res, event, data, next) {
/*    var id = (new Date()).toLocaleTimeString();
    res.write("id: " + id + '\n');*/
    if (event) res.write("event: " + event + "\n");
    res.write("data: " + JSON.stringify(data) + "\n\n");
    if (next) {
        return next();
    }
}


var sse = exports;
sse.create = function create() {
    return new SSE();
}
