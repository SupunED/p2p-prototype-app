// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', socket => {
  socket.on('signal', data => {
    socket.broadcast.emit('signal', data); // Broadcast signal to other peers
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
