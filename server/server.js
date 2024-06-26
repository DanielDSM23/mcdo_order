const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const cors = require('cors');

const createServer = (port, name) => {
  const app = express();
  const server = http.createServer(app);
  const io = socketIO(server);
  
  var numberOrderEsp = 0;
  var numberOrderCb = 0;
  var isLineOpen = false;
  var currentOrders = [];
  var createdAtOrders = [];
  
  app.use(cors());
  app.use(bodyParser.json());
  app.use(express.static(path.join(__dirname, '../public')));

  const setupRoutes = (appInstance, ioInstance) => {
    appInstance.post('/api/send-message', (req, res) => {
      const message = req.body;
      if(isLineOpen){
        ioInstance.emit('message', message);
        res.status(200).send('Order sent successfully');
        currentOrders.push(message);
        createdAtOrders.push(new Date());
      } else {
        res.status(200).send('Order not sent, line is closed');
      }
    });

    appInstance.get('/api/bump', (req, res) => {
      ioInstance.emit('bump', true);
      res.status(200).send('ok');
    });

    appInstance.post('/api/remove-command', (req, res) => {
      const removeCommandNbr = req.body;
      if(Boolean(Object.keys(removeCommandNbr).length)){
        currentOrders.splice(removeCommandNbr.number-1, 1);
        createdAtOrders.splice(removeCommandNbr.number-1, 1);
        res.status(200).send('ok');
      } else {
        res.status(200).send('error');
      }
    });

    appInstance.post('/api/modify-state', (req, res) => {
      const commandName = req.body.commandName;
      const newState = req.body.newState;
      if(Boolean(Object.keys(commandName).length) && Boolean(Object.keys(newState).length)){
        ioInstance.emit('modify-state', `${commandName},${newState}`);
        res.status(200).send('ok');
      } else {
        res.status(200).send('error');
      }
    });

    appInstance.post('/api/cancel-command', (req, res) => {
      const commandName = req.body.commandName;
      if(Boolean(Object.keys(commandName).length)){
        ioInstance.emit('cancel-state', commandName);
        res.status(200).send('ok');
      } else {
        res.status(200).send('error');
      }
    });

    appInstance.post('/api/add-article', (req, res) => {
      const commandName = req.body.commandName;
      const article = req.body.article;
      const quantity = req.body.quantity;
      const category = req.body.category;
      if(Boolean(Object.keys(commandName).length)){
        ioInstance.emit('add-product', `${commandName},${article},${quantity},${category}`);
        res.status(200).send('ok');
        //find order number
        console.log(commandName);
        let elementIndexCommand = null;
        for(let i=0; i<currentOrders.length; i++){
          if(currentOrders[i]['order']['order_number'] == commandName){
            elementIndexCommand = i;
            console.log(i);
            break;
          }
        }
        let elementProduct = null;
        for(let i=0; i<currentOrders[elementIndexCommand]['order']['items'].length; i++){
          if (currentOrders[elementIndexCommand]['order']['items'][i]["item_name"] == article){
            elementProduct = i;
          } 
        }
        console.log(elementProduct);
        if(elementProduct == null){ //not same product
          if(elementIndexCommand != null){
            let newItem={
              item_name: article,
              quantity: quantity,
              addons: [],
              remove: [],
              category: category
            };
            currentOrders[elementIndexCommand].order.items.push(newItem);
            console.log("added");
          }
        }
        else{ //same product
          actualQuantity = currentOrders[elementIndexCommand]['order']['items'][elementProduct]["quantity"];
          newQuantity = actualQuantity + quantity;
          currentOrders[elementIndexCommand]['order']['items'][elementProduct]["quantity"] = newQuantity;
        }
      } else {
        res.status(200).send('error');
      }
    });

    appInstance.post('/api/remove-article', (req, res) => {
      const commandName = req.body.commandName;
      const article = req.body.article;
      const quantity = req.body.quantity;
      const category = req.body.category;
    
      if (Boolean(Object.keys(commandName).length)) {
        ioInstance.emit('remove-product', `${commandName},${article},${quantity},${category}`);
        const order = currentOrders.find(order => order.order.order_number === commandName);
        if (order) {
          const itemIndex = order.order.items.findIndex(item => item.item_name === article && item.category === category);
    
          if (itemIndex > -1) {
            const item = order.order.items[itemIndex];
            if (item.quantity > quantity) {
              item.quantity -= quantity;
            } else {
              order.order.items.splice(itemIndex, 1);
            }
            res.status(200).send('ok');
          } else {
            res.status(200).send('error');
          }
        } else {
          res.status(200).send('error');
        }
      } else {
        res.status(200).send('error');
      }
    });
    
    appInstance.get('/api/get-command', (req, res) => {
      res.status(200).send(currentOrders);
    });

    appInstance.get('/api/get-command-time', (req, res) => {
      res.status(200).send(createdAtOrders);
    });

    appInstance.get('/api/onoff', (req, res) => {
      ioInstance.emit('onoff', isLineOpen);
      res.status(200).send('ok');
    });

    appInstance.get('/api/next', (req, res) => {
      ioInstance.emit('next', true);
      res.status(200).send('ok');
    });

    appInstance.get('/api/recall', (req, res) => {
      ioInstance.emit('recall', true);
      res.status(200).send('ok');
    });

    appInstance.get('/api/is-line-open', (req, res) => {
      res.status(200).send(isLineOpen);
    });

    appInstance.get('/api/reload', (req, res) => {
      ioInstance.emit('reload', true);
      res.status(200).send("ok");
    });

    appInstance.get('/api/get-command-number-esp', (req, res) => {
      const timestamp = Date.now();
      numberOrderEsp++;
      if(numberOrderEsp > 99){
        numberOrderEsp=1;
      }
      res.status(200).send(`${numberOrderEsp.toString().padStart(2, '0')}|${timestamp}`);
    });

    appInstance.get('/api/get-command-number-cb', (req, res) => {
      const timestamp = Date.now();
      numberOrderCb++;
      if(numberOrderCb > 99){
        numberOrderCb=1;
      }
      res.status(200).send(`${numberOrderCb.toString().padStart(2, '0')}|${timestamp}`);
    });

    appInstance.post('/api/add-article', (req, res) => {
      const commandName = req.body.commandName;
      const article = req.body.article;
      let quantity = req.body.quantity;
      !Boolean(Object.keys(commandName).length)  && (quantity = 1);
      if(Boolean(Object.keys(commandName).length) && Boolean(Object.keys(article).length) ){
        ioInstance.emit('add-article', commandName + '!' + article);
        res.status(200).send('ok');
      } else {
        res.status(200).send('error');
      }
    });
  };

  setupRoutes(app, io);
  
  io.on('connection', (socket) => {
    console.log(`A user connected to ${name}`);

    socket.on("lineOpen", (arg) => {
      isLineOpen = arg;
      isLineOpen ? console.log(`Line is now open on ${name}`) : console.log(`Line is now closed on ${name}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected from ${name}`);
    });

    socket.on('remove-command', (arg) => {
      currentOrders.splice(arg-1, 1);
      createdAtOrders.splice(arg-1, 1);
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`${name} server listening on http://127.0.0.1:${port}`);
  });
};

// Creating and starting servers here
createServer(8080, 'Kitchen');
createServer(8081, 'Beverage');
createServer(8082, 'OAT');
createServer(8083, 'Verification');
