const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const path = require('path');
const socketIO = require('socket.io');
const { create } = require('domain');

const app = express();
const httpServer = http.createServer(app);
const io = socketIO(httpServer);


var numberOrder = 0;
var isLineOpen = false;
var currentOrders = [];
var createdAtOrders = [];
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Handle incoming HTTP POST & GET requests
app.post('/api/send-message', (req, res) => {
  const message = req.body;
  if(isLineOpen){
    io.emit('message', message);
    res.status(200).send('Order sent successfully');
    currentOrders.push(message);
    createdAtOrders.push(new Date());
  }
  else{
    res.status(200).send('Order not sent, line is closed');
  }

});

app.get('/api/bump', (req, res) => {
    io.emit('bump', true);
    res.status(200).send('ok');
});

app.post('/api/remove-command', (req, res) => {
  const removeCommandNbr = req.body;
  console.log(removeCommandNbr);
  if(Boolean(Object.keys(removeCommandNbr).length)){
    currentOrders.splice(removeCommandNbr.number-1, 1);
    res.status(200).send('ok');
    console.log(currentOrders);
  }
  else{
    res.status(200).send('error');
  }
});


app.post('/api/modify-state', (req, res) => { //TODO CLIENT_SIDE
  const commandName = req.body.commandName;
  const newState = req.body.newState;
  if(Boolean(Object.keys(commandName).length) && Boolean(Object.keys(newState).length)){
    io.emit('modify-state', `${commandName},${newState}`);
    res.status(200).send('ok');
  }
  else{
    res.status(200).send('error');
  }
});

app.post('/api/cancel-command', (req, res) => {
  const commandName = req.body.commandName;
  if(Boolean(Object.keys(commandName).length)){
    io.emit('cancel-state', commandName);
    res.status(200).send('ok');
  }
  else{
    res.status(200).send('error');
  }
});

app.post('/api/add-article', (req, res) => {
  const commandName = req.body.commandName;
  const article = req.body.article;
  const quantity = req.body.quantity
  if(Boolean(Object.keys(commandName).length)){
    io.emit('add-product', `${commandName},${article},${quantity}`);
    res.status(200).send('ok');
  }
  else{
    res.status(200).send('error');
  }
});

app.post('/api/remove-article', (req, res) => {
  const commandName = req.body.commandName;
  const article = req.body.article;
  const quantity = req.body.quantity
  if(Boolean(Object.keys(commandName).length)){
    io.emit('remove-product', `${commandName},${article},${quantity}`);
    res.status(200).send('ok');
  }
  else{
    res.status(200).send('error');
  }
});


app.get('/api/get-command', (req, res) => {
  res.status(200).send(currentOrders);
});

app.get('/api/get-command-time', (req, res) => {
  res.status(200).send(createdAtOrders);
});

app.get('/api/onoff', (req, res) => {
  io.emit('onoff', isLineOpen);
  res.status(200).send('ok');
});

app.get('/api/next', (req, res) => {
  io.emit('next', true);
  res.status(200).send('ok');
});

app.get('/api/recall', (req, res) => {
  io.emit('recall', true);
  res.status(200).send('ok');
});

app.get('/api/is-line-open', (req, res) => {
  res.status(200).send(isLineOpen);
});

app.get('/api/reload', (req, res) => {
  io.emit('reload', true);
  res.status(200).send("ok");
});

app.get('/api/get-command-number', (req, res) => {
  const timestamp = Date.now();
  numberOrder++;
  if(numberOrder > 99){
    numberOrder=1
  }
  res.status(200).send(`${numberOrder.toString()},${timestamp}`);
});

app.post('/api/add-article', (req, res) => { //TODO
  const commandName = req.body.commandName;
  const article = req.body.article;
  let quantity = req.body.quantity;
  !Boolean(Object.keys(commandName).length)  && (quantity = 1);
  if(Boolean(Object.keys(commandName).length) && Boolean(Object.keys(article).length) ){
    io.emit('add-article', commandName + '!' + article);
    res.status(200).send('ok');
  }
  else{
    res.status(200).send('error');
  }
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

  socket.on('remove-command', (arg) => {
    currentOrders.splice(arg-1, 1);
    createdAtOrders.splice(arg-1, 1);
  });
  
});

const PORT = 8080;

httpServer.listen(PORT,  '0.0.0.0', () => {
  console.log(`Server listening on port http://127.0.0.1:${PORT}`);
});

