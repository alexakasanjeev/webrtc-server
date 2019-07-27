const WebSocketServer = require('ws').Server;
const {
  LOGIN_ACTION,
  NEW_USER_ACTION,
  ALL_USER_ACTION,
  OFFER_ACTION,
  ANSWER_ACTION,
  CANDIDATE_ACTION,
} = require('./actions');
const log = require('./log');

const wss = new WebSocketServer({ port: 9090 });

const clients = {};

// Send to single connection
function sendTo(connection, message) {
  connection.send(JSON.stringify(message));
}

// Send to multiple connection
function broadcast(connections, message, skipConnectionName) {
  Object.keys(connections).forEach(function (key) {
    if (key !== skipConnectionName)
      sendTo(connections[key], message);
  });
}

wss.on('listening', function () {
  log("Server started...");
});

wss.on('connection', function (connection) {
  // New connection has been extablished
  log("New User connected");

  // message function
  connection.on('message', function (message) {
    log("message from user", message);

    let data;

    try {
      data = JSON.parse(message);
    } catch (e) {
      log('Invalid JSON!');
      data = {};
    }

    switch (data.type) {
      case LOGIN_ACTION:
        log('User logged:', data.name);
        if (clients[data.name]) {
          sendTo(connection, {
            type: LOGIN_ACTION,
            success: false
          });
        } else {
          //save user connection on the server 
          clients[data.name] = connection;
          connection.name = data.name;

          // Inform connection about login status
          sendTo(connection, {
            type: LOGIN_ACTION,
            success: true
          });

          // Broadcast to other users that new user has entered 
          broadcast(clients, {
            type: NEW_USER_ACTION,
            name: data.name
          }, data.name);

          // Inform this user about all the existing loggedIn users
          sendTo(connection, {
            type: ALL_USER_ACTION,
            names: Object.keys(clients).filter(key => key !== data.name),
          });
        }
        break;
      case OFFER_ACTION:
        const userToWhomOfferShouldBeMade = data.to;
        const _connection = clients[userToWhomOfferShouldBeMade];
        log('==================');
        log(userToWhomOfferShouldBeMade);
        sendTo(_connection, {
          type: OFFER_ACTION,
          to: data.to,
          from: data.from,
          offer: data.offer,
        });
        break;
      case ANSWER_ACTION: {
        const userToWhomAnswerShouldBeMade = data.to;
        const _connection = clients[userToWhomAnswerShouldBeMade];
        log('==================');
        log(userToWhomAnswerShouldBeMade);
        sendTo(_connection, {
          type: ANSWER_ACTION,
          to: data.to,
          from: data.from,
          answer: data.answer,
        });
        break;
      }
      case CANDIDATE_ACTION: {
        const userToWhomCandidateShouldBeMade = data.to;
        const _connection = clients[userToWhomCandidateShouldBeMade];
        log('==================');
        log(userToWhomCandidateShouldBeMade);
        sendTo(_connection, {
          type: CANDIDATE_ACTION,
          to: data.to,
          from: data.from,
          candidate: data.candidate,
        });
        break;
      }
      default:
        sendTo(connection, {
          type: 'error',
          message: 'Command not found ' + data.type
        });
    }
  });

  //close the connection
  connection.on("close", function () {
    if (connection.name) {
      delete clients[connection.name];
    }
  });

});