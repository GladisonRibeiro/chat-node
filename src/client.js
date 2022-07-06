import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import net from 'node:net';
import process from 'node:process';

import consts from './utils/consts.js';
import log from './utils/log.js';

class Client {
  connection;
  net;
  io;
  process;
  exitCommands = [':q', '/quit'];

  constructor(net, io, process) {
    this.net = net;
    this.io = io;
    this.process = process;
  }

  connect(port) {
    this.connection = this.net.createConnection({ port }, async () => {
      const answer = await io.question('What is your nickname? ');
      this.connection.write(`@nickname ${answer}`);
      this.addEventListeners();
    });
  }

  addEventListeners() {
    this.io.on('line', (message) => {
      if (this.exitCommands.indexOf(message.toString()) > -1) {
        this.process.exit();
      }
      
      this.connection.write(message);
    });

    this.connection.on('data', function(messageBuffer) {
      console.log(messageBuffer.toString());
    });
    
    this.connection.on('end', function(_) {
      this.process.exit();
    });

    this.connection.on("error", async (err) => {
      await log(`${err.name}: ${err.message} - ${err.stack}`);
      this.process.exit();
    });

    this.process.on('beforeExit', (code) => {
      this.close();
    });
  }

  close() {
    this.io.close();
    this.connection.emit('end');
    this.connection.end();
  }
}

const io = readline.createInterface({ input, output });
const client = new Client(net, io, process);
client.connect(consts.SERVER_PORT);
