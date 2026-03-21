const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Configuración de Supabase (Asegúrate de configurar estas variables en un archivo .env)
const supabaseUrl = process.env.SUPABASE_URL || "https://mnlqbmpbyybsfxtjjalb.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubHFibXBieXlic2Z4dGpqYWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjI3NzIsImV4cCI6MjA4ODkzODc3Mn0.yq9_PFpCapgL0bFCsu5X8JEZMNdaImD7nCAl5OsYTL0";
const supabase = createClient(supabaseUrl, supabaseKey);

const PORT = process.env.PORT || 3001;
const clients = new Map();

// Función para generar respuesta con Groq
async function getAIResponse(prompt, instanceId) {
  try {
    // 1. Obtener configuración global (API Key y Productos)
    const { data: settings } = await supabase.from('settings').select('*').maybeSingle();
    if (!settings || !settings.groq_api_key) return null;

    // 2. Obtener estado de la instancia
    const { data: instance } = await supabase.from('instances').select('bot_enabled').eq('id', instanceId).single();
    if (!instance || !instance.bot_enabled) return null;

    const context = settings.scraped_data ? JSON.stringify(settings.scraped_data.products) : "No hay información de productos disponible.";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.groq_api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: `Eres un asistente de ventas experto. Usa esta información de productos: ${context}. 
            Responde de forma breve, amable y enfocada a cerrar la venta. Si no sabes algo, pide que esperen a un humano.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`[server] Error en IA para ${instanceId}:`, error.message);
    return null;
  }
}

io.on('connection', (socket) => {
  console.log('[server] Cliente UI conectado:', socket.id);

  socket.on('init-instance', async (instanceId) => {
    if (clients.has(instanceId)) {
      console.log(`[server] Reutilizando cliente existente para ${instanceId}`);
      socket.emit('ready', { instanceId, status: 'connected' });
      return;
    }

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: instanceId }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
      }
    });

    client.on('qr', (qr) => {
      socket.emit('qr', { instanceId, qr });
    });

    client.on('ready', async () => {
      console.log(`[server] WhatsApp ${instanceId} está listo`);
      await supabase.from('instances').update({ status: 'connected' }).eq('id', instanceId);
      socket.emit('ready', { instanceId, status: 'connected' });
    });

    client.on('message', async (msg) => {
      if (msg.fromMe) return;
      
      console.log(`[server] Mensaje de ${msg.from} en ${instanceId}: ${msg.body}`);
      
      const aiReply = await getAIResponse(msg.body, instanceId);
      if (aiReply) {
        await msg.reply(aiReply);
        console.log(`[server] Bot respondió: ${aiReply}`);
      }
    });

    client.initialize().catch(err => {
      console.error(`[server] Error en ${instanceId}:`, err);
      socket.emit('error', { instanceId, message: err.message });
    });

    clients.set(instanceId, client);
  });
});

server.listen(PORT, () => {
  console.log(`[server] Corriendo en http://localhost:${PORT}`);
});