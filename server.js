const express = require('express');
const app = express();
const server = app.listen(3000);
const io = require('socket.io')(server);
const expsession = require('express-session');
const path = require('path');

// install session middleware
const sessionMiddleware = expsession({
  secret: 'random secret',
  saveUninitialized: true,
  resave: true
});

// run session middleware for regular http connections
app.use(sessionMiddleware);

// run session middleware for socket.io connections
io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

// when a socket.io connection connects, put the socket.id into the session
// so it can be accessed from other http requests from that client    
io.on('connection', function(socket) {
    // socket.handshake.headers
    console.log(`socket.io connected: ${socket.id}`);

    // save socket.io socket in the session
    socket.request.session.socketio = socket.id;
    socket.request.session.save();

    console.log("session at socket.io connection:\n", socket.request.session);
});

// any arbitrary express route definition
// Note: you can't send socket.io data in a request that loads an HTML page
//       because that client hasn't yet established the socket.io connection
//       for that page.  The socket.io connections will be created after
//       the browser loads this page.
app.get("/", function(req, res) {
    const session = req.session;
    console.log("\n\npage load\n---------------------------\n");
    console.log("session:\n", session);
    res.sendFile(path.join(__dirname, "index.html"));
});

// Upon an API call from a page that already has a socket.io connection,
// respond to the API call and send something to that page's socket.io socket
app.get("/api/test", function(req, res) {
    const session = req.session;
    // io.sockets.connected[session.socketio].emit('show', "sending some data");
    console.log("session:\n", session);
    console.log("session.socketio:\n", session.socketio);
    res.json({greeting: "hello"});
});