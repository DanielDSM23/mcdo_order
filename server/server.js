const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
const io = socketIO(httpServer);

var isLineOpen = false;

app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Handle incoming HTTP POST requests
app.post('/send-message', (req, res) => {
  const message = req.body;
  if(isLineOpen){
    io.emit('message', message);
    res.status(200).send('Order sent successfully');
  }
  else{
    res.status(200).send('Order not sent, line is closed');
  }

});

app.get('/bump', (req, res) => {
    io.emit('bump', true);
    res.status(200).send('ok');
});

app.get('/onoff', (req, res) => {
  io.emit('onoff', isLineOpen);
  res.status(200).send('ok');
});

app.get('/next', (req, res) => {
  io.emit('next', true);
  res.status(200).send('ok');
});

app.get('/recall', (req, res) => {
  io.emit('recall', true);
  res.status(200).send('ok');
});

app.get('/is-line-open', (req, res) => {
  res.status(200).send(isLineOpen);
});



io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on("lineOpen", (arg) => {
    isLineOpen = arg;
    isLineOpen ? console.log("Line is now open") : console.log("Line is now closed");
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = 8080;

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
