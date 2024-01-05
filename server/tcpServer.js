const net = require('net');
const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8081 }); // WebSocket server

server.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('message', (jsonText) => {
    // Handle the received JSON data here or forward it to other clients
    console.log('Received:', jsonText.toString('utf-8'));
  });

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});

// Create a simple HTTP server to serve the client-side files
const http = require('http');
const fs = require('fs');
const path = require('path');

const httpServer = http.createServer((req, res) => {
  const filePath = path.join(__dirname, '../public', req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        let contentType;
        if (filePath.endsWith('.html')) {
          contentType = 'text/html';
        } else if (filePath.endsWith('.css')) {
          contentType = 'text/css';
        } else if (filePath.endsWith('.js')) {
          contentType = 'application/javascript';
        }
        else if (filePath.endsWith('.png')) {
        contentType = 'image/png';
        }
  
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
  });
});

httpServer.listen(8080, () => {
  console.log('HTTP server listening on port 8080');
});
