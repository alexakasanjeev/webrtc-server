const WebSocketServer = require('ws').Server;

const wss = new WebSocketServer({ port: 9090 });

const clients = [];

wss.on('listening', function () {
	console.log("Server started...");
});

wss.on('connection', function (connection) {
   console.log("User connected");
   // clients.push(connection);
 
  //message function
   connection.on('message', function (message) {	
     console.log("message from user");
  });
  
  //close the connection
  connection.on('close', function () {
    console.log("Disconnecting user");
  });
 
});