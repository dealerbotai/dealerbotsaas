const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*" }
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ['--no-sandbox'] }
});

client.on('qr', (qr) => {
  console.log('QR RECEIVED', qr);
  io.emit('qr', qr); // Enviamos el QR al frontend
});

client.on('ready', () => {
  console.log('Client is ready!');
  io.emit('ready', { status: 'connected' });
});

client.on('message', async msg => {
  if (msg.body === '!ping') {
    msg.reply('pong');
  }
});

client.initialize();

server.listen(3000, () => {
  console.log('Server running on port 3000');
});