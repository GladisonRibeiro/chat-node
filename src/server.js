import net from 'node:net';
import process from 'node:process';

import consts from './utils/consts.js';
import log from './utils/log.js';

class Server {
  connections = [];
  server;

  constructor(net, process) {
    this.net = net;
    this.process = process;
  }


  create(port, helloMessage) {
    this.server = net.createServer((connection) => {
      this.connections.push(connection);
      connection.write(helloMessage);
      this.addEventListeners(connection);
    }).on('error', (err) => {
      log(`${err.name}: ${err.message} - ${err.stack}`);
    });
    
    this.server.listen(port, () => {
      console.log('Opened server on ', this.server.address());
    });
  }


  addEventListeners(connection) {
    connection.on('data', this.handleClientMessage(connection));
    connection.on('end', this.handleClientDisconnection(connection));
    connection.on("error", (err) => {
      log(`${err.name}: ${err.message} - ${err.stack}`);
    });
    this.process.on('beforeExit', (code) => {
      this.server.emit('end');
    });
  }

  handleClientDisconnection(connection) {
    return () => {
      this.broadcast(`${connection.nickname} left the chat`);
      this.connections.splice(this.connections.indexOf(connection), 1);
    };
  }

  handleClientMessage(connection) {
    return (message) => {
      var command = message.toString();
      if (command.indexOf('@nickname') === 0) {
        const nickname = this.extractNickname(command);
        const nicknameMessage = connection.nickname ?
          `${connection.nickname} is now ${nickname}` :
          `${nickname} is connected`;
        connection.nickname = nickname;
        this.broadcast(nicknameMessage, null);
        return;
      }
      this.broadcast(`@${connection.nickname} => ${message}`, connection);
    };
  }

  broadcast(message, origin) {
    this.connections.forEach((connection) => {
      if (connection !== origin) {
        connection.write(message);
      }
    });
  }

  extractNickname(command) {
    return command.replace('@nickname ', '');
  }
}

const server = new Server(net, process);
server.create(consts.SERVER_PORT, consts.SERVER_HELLO_MESSAGE);
