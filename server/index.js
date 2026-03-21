const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const supabaseUrl = process.env.SUPABASE_URL || "https://mnlqbmpbyybsfxtjjalb.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubHFibXBieXlic2Z4dGpqYWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjI3NzIsImV4cCI6MjA4ODkzODc3Mn0.yq9_PFpCapgL0bFCsu5X8JEZMNdaImD7nCAl5OsYTL0";
const supabase = createClient(supabaseUrl, supabaseKey);

const PORT = process.env.PORT || 3001;
const clients = new Map();

async function getAIResponse(prompt, instanceId) {
  try {
    const { data: settings } = await supabase.from('settings').select('*').maybeSingle();
    if (!settings || !settings.groq_api_key) return null;

    const { data: instance } = await supabase.from('instances').select('bot_enabled').eq('id', instanceId).single();
    if (!instance || !instance.bot_enabled) return null;

    const context = settings.scraped_data ? JSON.stringify(settings.scraped_data.products) : "No hay información de productos.";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.groq_api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "system", content: `Asistente de ventas. Productos: ${context}. Responde breve.` },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`[server] Error IA:`, error.message);
    return null;
  }
}

io.on('connection', (socket) => {
  console.log('[server] UI conectada');

  socket.on('init-instance', async ({ name }) => {
    const tempId = uuidv4();
    console.log(`[server] Iniciando vinculación para: ${name} (ID temporal: ${tempId})`);

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: tempId }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    client.on('qr', (qr) => {
      socket.emit('qr', { tempId, qr });
    });

    client.on('ready', async () => {
      const phoneNumber = client.info.wid.user;
      console.log(`[server] WhatsApp vinculado: ${phoneNumber}`);

      // AHORA SÍ: Guardamos en Supabase
      const { data, error } = await supabase
        .from('instances')
        .insert([{
          id: tempId,
          name: name,
          phone_number: `+${phoneNumber}`,
          status: 'connected',
          bot_enabled: false,
          scope: 'all'
        }])
        .select()
        .single();

      if (error) {
        console.error("[server] Error al guardar instancia:", error);
        socket.emit('error', { message: "Error al guardar en DB" });
      } else {
        socket.emit('ready', { instance: data });
      }
    });

    client.on('message', async (msg) => {
      if (msg.fromMe) return;
      const aiReply = await getAIResponse(msg.body, tempId);
      if (aiReply) await msg.reply(aiReply);
    });

    client.initialize().catch(err => {
      socket.emit('error', { message: err.message });
    });

    clients.set(tempId, client);
  });
});

server.listen(PORT, () => console.log(`[server] Puerto ${PORT}`));