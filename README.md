# OrderL1 System

OrderL1 is a server-client system built with Node.js and Socket.IO to manage and display orders in a restaurant or similar setting. The system allows for real-time communication between the server and clients, updating orders, and managing the state of the service line.

## Features

- **Real-time Communication**: Utilizes Socket.IO for real-time bidirectional event-based communication between the server and clients.
- **Order Management**: Clients can send orders to the server, and the server broadcasts them to all connected clients.
- **Line Status**: Clients can check and toggle the status of the service line (open or closed).
- **Order Bumping**: Clients can bump an order, moving it to a recalled state for easy tracking.

## Screenshots

  
  ![Front](screenshots/1.png)

  
  ![Front when order is sent](screenshots/2.png)

  
  ![Front when server is off](screenshots/3.png)


## Usage

1. Install Node.js and npm.
2. Clone the repository.
3. Install dependencies with `npm install`.
4. Run the server with `npm start` or `node server.js`.
5. Access the client interface via a web browser.

## Server-Side Dependencies

- Express
- Body-parser
- http
- fs
- path
- socket.io

## Client-Side Dependencies

- jQuery
- Socket.IO client library

## Server API Endpoints

- `/send-message`: Accepts POST requests to send orders to the server.
- `/bump`: Accepts GET requests to bump an order.
- `/remove-command`: Accepts POST requests to remove a specific order.
- `/get-command`: Accepts GET requests to retrieve the list of current orders.
- `/onoff`: Accepts GET requests to toggle the status of the service line.
- `/next`: Accepts GET requests to move to the next order.
- `/recall`: Accepts GET requests to recall a bumped order.
- `/is-line-open`: Accepts GET requests to check if the service line is open.

## Client Side Script

The client-side script is written in JavaScript and uses jQuery for DOM manipulation and Socket.IO for real-time communication with the server.

## Keyboard Shortcuts

- **Enter Key (Return)**: Remove the selected order and bump it.
- **'n' Key**: Move to the next order.
- **'o' Key**: Toggle the status of the service line (open or closed).
- **'r' Key**: Recall a bumped order.

## Additional Notes

- The system provides a visual representation of the service line's status, current orders, and recalled orders.
- The server logs events such as user connections, disconnections, and changes in the service line status.

Feel free to use and modify the system based on your specific requirements. For any issues or improvements, please create an issue or pull request.

**Enjoy efficient order management with OrderL1!**
