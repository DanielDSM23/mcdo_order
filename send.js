const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8081 });

server.on('connection', (socket) => {
  console.log('Client connected');

  // Simulate sending a message to the client after a delay
  setTimeout(() => {
    socket.send('Hello from the server!');
  }, 2000);
});