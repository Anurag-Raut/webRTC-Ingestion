const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

io.on('connection', socket => {
    console.log('A user connected');

    socket.on('offer', offer => {
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', answer => {
        socket.broadcast.emit('answer', answer);
    });

    socket.on('ice-candidate', candidate => {
        socket.broadcast.emit('ice-candidate', candidate);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(3000, () => {
    console.log('Signaling server is running on port 8080');
});
