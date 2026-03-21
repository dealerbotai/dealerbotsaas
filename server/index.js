const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Mapa para gestionar múltiples instancias si fuera necesario
const clients = new Map();

io.on('connection', (socket) => {
  console.log('[server] Nuevo cliente conectado:', socket.id);

  socket.on('init-instance', (instanceId) => {
    console.log(`[server] Iniciando instancia: ${instanceId}`);
    
    if (clients.has(instanceId)) {
      const existingClient = clients.get(instanceId);
      if (existingClient.info) {
        socket.emit('ready', { instanceId, status: 'connected' });
        return;
      }
    }

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: instanceId }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    client.on('qr', (qr) => {
      console.log(`[server] QR generado para ${instanceId}`);
      socket.emit('qr', { instanceId, qr });
    });

    client.on('ready', () => {
      console.log(`[server] Cliente ${instanceId} listo`);
      socket.emit('ready', { instanceId, status: 'connected' });
    });

    client.on('authenticated', () => {
      console.log(`[server] ${instanceId} autenticado`);
    });

    client.on('message', async (msg) => {
      // Aquí iría la lógica de integración con Groq AI
      console.log(`[server] Mensaje recibido en ${instanceId}: ${msg.body}`);
    });

    client.initialize().catch(err => {
      console.error(`[server] Error inicializando ${instanceId}:`, err);
      socket.emit('error', { instanceId, message: err.message });
    });

    clients.set(instanceId, client);
  });

  socket.on('disconnect', () => {
    console.log('[server] Cliente desconectado');
  });
});

server.listen(PORT, () => {
  console.log(`[server] Backend de WhatsApp corriendo en http://localhost:${PORT}`);
});