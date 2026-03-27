import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { Worker } from 'worker_threads';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { encrypt, decrypt } from './utils/crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ [SERVER] .env file loaded from:', envPath);
} else {
  console.warn('⚠️ [SERVER] .env file NOT FOUND at:', envPath);
  dotenv.config();
}


// Configuración de Pino Logger
import pino from 'pino';
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
});


const LOG_ICONS = {
  info: 'ℹ️ ',
  warn: '⚠️ ',
  error: '❌ ',
  debug: '🔍 ',
  success: '✅ ',
  system: '⚙️ ',
  auth: '🔐 ',
  scraper: '🌐 ',
  ai: '🧠 ',
  whatsapp: '📱 ',
  database: '🗄️ ',
  start: '🚀 '
};

// Función para loguear y opcionalmente enviar por socket
function sysLog(level, msg, data = {}) {
  // Determine standard pino level safely
  const safePinoLevels = ['info', 'warn', 'error', 'debug', 'trace', 'fatal'];
  const pinoLevel = safePinoLevels.includes(level) ? level : 'info';

  // Determine primary icon based on level or prefix in msg
  let icon = LOG_ICONS[level] || '📝 ';
  const upperMsg = msg.toUpperCase();

  if (upperMsg.includes('[SYSTEM]')) icon = LOG_ICONS.system;
  else if (upperMsg.includes('[AUTH]')) icon = LOG_ICONS.auth;
  else if (upperMsg.includes('[SCRAPER]')) icon = LOG_ICONS.scraper;
  else if (upperMsg.includes('[AI')) icon = LOG_ICONS.ai;
  else if (upperMsg.includes('[WHATSAPP]')) icon = LOG_ICONS.whatsapp;
  else if (upperMsg.includes('[DB]') || upperMsg.includes('[DATABASE]') || upperMsg.includes('[SETTINGS]')) icon = LOG_ICONS.database;

  // Clean message if it already has an emoji at the start to avoid duplicates
  const cleanedMsg = msg.replace(/^[\u0020-\u007F]/, '').trim();
  const finalMsg = `${icon} ${msg}`; // Prefixed with icon

  logger[pinoLevel](data, finalMsg);

  // Emitir evento de sistema a la UI para observabilidad total
  if (io && io.emit) {
    io.emit('system-log', {
      level,
      message: finalMsg,
      timestamp: new Date().toISOString(),
      ...data
    });
  }
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIO(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});


// Configuración de Supabase desde variables de entorno
// PRIORIDAD: SUPABASE_SERVICE_ROLE_KEY es crítica para el backend (Bypass RLS)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const PORT = process.env.PORT || 3001;

if (!supabaseUrl || !supabaseKey) {
  sysLog('error', "[SYSTEM] ❌ Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no definidas.");
  process.exit(1);
}

// Log diagnóstico de configuración (sin mostrar la llave completa por seguridad)
const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'unknown';
const isServiceRole = supabaseKey.length > 200 && (JSON.parse(Buffer.from(supabaseKey.split('.')[1], 'base64').toString()).role === 'service_role');

if (isServiceRole) {
  sysLog('success', `[SYSTEM] 🔐 Cloud: Supabase [${projectRef}] - Llave SERVICE_ROLE detectada.`);
} else {
  sysLog('warn', `[SYSTEM] ⚠️ Cloud: Supabase [${projectRef}] - Llave ANON detectada. Se requerirán políticas RLS permisivas.`);
}


const supabase = createClient(supabaseUrl, supabaseKey);

// Helper para obtener o crear el workspace del usuario con un cliente específico (para respetar RLS)
async function getOrCreateWorkspace(client, userId, email) {
  const { data: member } = await client
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (member) return member.workspace_id;

  const { data: workspace, error: wsError } = await client
    .from('workspaces')
    .insert([{ name: `${email}'s Workspace`, owner_id: userId }])
    .select('id')
    .single();

  if (wsError) {
    sysLog('error', `[DATABASE] Error al crear workspace para ${email}:`, wsError);
    throw wsError;
  }

  await client.from('workspace_members').insert([{
    workspace_id: workspace.id,
    user_id: userId,
    role: 'owner'
  }]);

  // Asegurar que existan settings para el workspace
  await client.from('settings').upsert([{ workspace_id: workspace.id }], { onConflict: 'workspace_id' });

  return workspace.id;
}

// Middleware para verificar autenticación en rutas HTTP
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado: Token faltante' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Crear un cliente específico para esta petición que incluya el token del usuario
    // Esto asegura que las políticas de RLS funcionen correctamente con auth.uid()
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) throw new Error(error?.message || 'Token inválido');

    req.user = user;
    req.supabase = userClient; // Guardamos el cliente para usarlo en la ruta

    // Obtener el workspace_id asociado al usuario usando su cliente
    req.workspaceId = await getOrCreateWorkspace(userClient, user.id, user.email);
    next();
  } catch (error) {
    sysLog('error', '[AUTH] Error de autenticación HTTP:', { error: error.message });
    return res.status(401).json({ error: 'No autorizado: ' + error.message });
  }
}

// Helper para extraer productos de un HTML
function scrapeProducts(html, url) {
  const products = [];

  // 1. Intentar buscar JSON-LD de tipo Product
  const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (item['@type'] === 'Product' || (item['@context']?.includes('schema.org') && item['name'])) {
          products.push({
            name: item.name,
            price: item.offers?.price || item.offers?.[0]?.price || item.offers?.priceSpecification?.price || 'N/A',
            description: item.description?.substring(0, 150) || 'Sin descripción'
          });
        }
      }
    } catch (e) { }
  }

  // 2. Meta Tags (OpenGraph)
  if (products.length < 5) {
    const ogTitle = html.match(/<meta property="og:title" content="(.*?)"/)?.[1];
    const ogPrice = html.match(/<meta property="product:price:amount" content="(.*?)"/)?.[1] ||
      html.match(/<meta property="og:price:amount" content="(.*?)"/)?.[1];
    const ogDesc = html.match(/<meta property="og:description" content="(.*?)"/)?.[1];

    if (ogTitle && !products.find(p => p.name === ogTitle)) {
      products.push({
        name: ogTitle,
        price: ogPrice || 'Ver en tienda',
        description: ogDesc?.substring(0, 150) || 'Sin descripción'
      });
    }
  }

  // 3. Heurística de precios si todo lo anterior es insuficiente
  if (products.length === 0) {
    const priceRegex = /\$\s?(\d+([.,]\d{2})?)/g;
    const pricesFound = html.match(priceRegex);
    if (pricesFound) {
      const uniquePrices = [...new Set(pricesFound)].slice(0, 3);
      uniquePrices.forEach((price, idx) => {
        products.push({
          name: `Producto detectado #${idx + 1}`,
          price: price,
          description: `Detectado automáticamente por patrón de precio.`
        });
      });
    }
  }

  return products;
}

app.post('/scrape', authenticate, async (req, res) => {
  const { url } = req.body;
  const workspaceId = req.workspaceId;
  sysLog('info', `[SCRAPER] Solicitud iniciada para: ${url}`, { workspaceId });

  try {
    let currentUrl = url;
    let allProducts = [];
    const visitedUrls = new Set();
    let pagesProcessed = 0;
    const MAX_PAGES = 3;

    while (currentUrl && pagesProcessed < MAX_PAGES && !visitedUrls.has(currentUrl)) {
      sysLog('info', `[SCRAPER] Procesando página ${pagesProcessed + 1}: ${currentUrl}`);
      visitedUrls.add(currentUrl);

      const response = await fetch(currentUrl);
      const html = await response.text();

      // Extraer productos de esta página
      const pageProducts = scrapeProducts(html, currentUrl);
      allProducts = [...allProducts, ...pageProducts];

      // Buscar siguiente página (Heurística)
      let nextUrl = null;
      const nextMatch = html.match(/href="([^"]*(?:next|siguiente|page=\d+)[^"]*)"/i);
      if (nextMatch) {
        nextUrl = nextMatch[1];
        if (nextUrl.startsWith('/')) {
          const urlObj = new URL(url);
          nextUrl = `${urlObj.protocol}//${urlObj.host}${nextUrl}`;
        }
      }

      currentUrl = nextUrl;
      pagesProcessed++;

      // Si ya tenemos suficientes productos, paramos
      if (allProducts.length >= 20) break;
    }

    // 2. Escaneo profundo de links directos (si no hay suficientes productos)
    if (allProducts.length < 5) {
      const response = await fetch(url);
      const html = await response.text();
      const productLinks = [];
      const linkRegex = /href="([^"]*\/products?\/[^"]*)"/g;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(html)) !== null && productLinks.length < 5) {
        let fullLink = linkMatch[1];
        if (fullLink.startsWith('/')) {
          const urlObj = new URL(url);
          fullLink = `${urlObj.protocol}//${urlObj.host}${fullLink}`;
        }
        if (!productLinks.includes(fullLink)) productLinks.push(fullLink);
      }

      for (const link of productLinks) {
        try {
          const pResp = await fetch(link);
          const pHtml = await pResp.text();
          const pData = scrapeProducts(pHtml, link);
          allProducts = [...allProducts, ...pData];
        } catch (e) { }
      }
    }

    // 3. Deduplicación por nombre
    const uniqueProducts = [];
    const names = new Set();
    for (const p of allProducts) {
      const cleanName = p.name.trim().toLowerCase();
      if (!names.has(cleanName)) {
        names.add(cleanName);
        uniqueProducts.push(p);
      }
    }

    const scrapedData = {
      url,
      products: uniqueProducts.slice(0, 30), // Aumentamos límite a 30
      lastScraped: new Date().toISOString(),
      pagesProcessed
    };

    sysLog('success', `[SCRAPER] Escaneo finalizado. ${uniqueProducts.length} productos encontrados en ${pagesProcessed} páginas.`);

    // Importar productos a la tabla local
    const productsToImport = uniqueProducts.map(p => ({
      workspace_id: workspaceId,
      name: p.name,
      price: parseFloat(p.price.toString().replace(/[^0-9.]/g, '')) || 0,
      description: p.description,
      is_active: true
    }));

    if (productsToImport.length > 0) {
      const { error: importError } = await req.supabase
        .from('products')
        .upsert(productsToImport, { onConflict: 'workspace_id,name' });

      if (importError) {
        sysLog('error', `[SCRAPER] Error al importar productos: ${importError.message}`);
      } else {
        sysLog('success', `[SCRAPER] ${productsToImport.length} productos importados a la base local.`);
      }
    }

    await req.supabase.from('settings').update({
      ecommerce_url: url,
      scraped_data: scrapedData
    }).eq('workspace_id', workspaceId);

    res.json(scrapedData);
  } catch (error) {
    sysLog('error', `[SCRAPER] Error crítico:`, { error: error.message });
    res.status(500).json({ error: 'Error al escanear la URL: ' + error.message });
  }
});

// --- CRUD PRODUCTOS ---
app.get('/products', authenticate, async (req, res) => {
  const { data, error } = await req.supabase
    .from('products')
    .select('*')
    .eq('workspace_id', req.workspaceId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/products', authenticate, async (req, res) => {
  const { data, error } = await req.supabase
    .from('products')
    .insert([{ ...req.body, workspace_id: req.workspaceId }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/products/:id', authenticate, async (req, res) => {
  const { data, error } = await req.supabase
    .from('products')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('workspace_id', req.workspaceId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/products/:id', authenticate, async (req, res) => {
  const { error } = await req.supabase
    .from('products')
    .delete()
    .eq('id', req.params.id)
    .eq('workspace_id', req.workspaceId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- CRUD REPARTIDORES ---
app.get('/delivery', authenticate, async (req, res) => {
  const { data, error } = await req.supabase
    .from('delivery_personnel')
    .select('*')
    .eq('workspace_id', req.workspaceId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/delivery', authenticate, async (req, res) => {
  const { data, error } = await req.supabase
    .from('delivery_personnel')
    .insert([{ ...req.body, workspace_id: req.workspaceId }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/delivery/:id', authenticate, async (req, res) => {
  const { data, error } = await req.supabase
    .from('delivery_personnel')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('workspace_id', req.workspaceId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/delivery/:id', authenticate, async (req, res) => {
  const { error } = await req.supabase
    .from('delivery_personnel')
    .delete()
    .eq('id', req.params.id)
    .eq('workspace_id', req.workspaceId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- CIERRES DE VENTAS ---
app.get('/sales', authenticate, async (req, res) => {
  const { data, error } = await req.supabase
    .from('sales')
    .select('*, instances(name)')
    .eq('workspace_id', req.workspaceId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/settings', authenticate, async (req, res) => {
  const newSettings = req.body;
  const workspaceId = req.workspaceId;

  try {
    // Encriptar la API Key si está presente
    if (newSettings.groq_api_key) {
      newSettings.groq_api_key_encrypted = encrypt(newSettings.groq_api_key);
      delete newSettings.groq_api_key;
    }

    const { data, error } = await req.supabase
      .from('settings')
      .update(newSettings)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) throw error;
    sysLog('success', `[SETTINGS] Configuración actualizada para workspace: ${workspaceId}`);
    res.json(data);
  } catch (error) {
    sysLog('error', `[SETTINGS] Error actualizando configuración:`, { error: error.message });
    res.status(500).json({ error: 'Error al actualizar la configuración' });
  }
});

app.get('/settings', authenticate, async (req, res) => {
  const workspaceId = req.workspaceId;
  try {
    console.log(`[SETTINGS] Fetching for workspace: ${workspaceId}`);
    const { data: settings, error } = await req.supabase
      .from('settings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (error) {
      console.error(`[SETTINGS] ❌ DB Error:`, error);
      return res.status(500).json({ error: 'Error de base de datos: ' + error.message });
    }

    if (settings && settings.groq_api_key) {
      try {
        settings.groq_api_key = decrypt(settings.groq_api_key);
      } catch (e) {
        console.error(`[SETTINGS] ❌ Decryption error:`, e);
      }
    }
    res.json(settings || { groq_api_key: '', ecommerce_url: '' });
  } catch (error) {
    console.error(`[SETTINGS] ❌ 500 Error:`, error);
    res.status(500).json({ error: 'Error interno: ' + error.message });
  }
});


const clients = new Map();
const workers = new Map();
const startTime = Date.now();

// Función para obtener métricas del sistema
function getSystemMetrics() {
  const mem = process.memoryUsage();
  return {
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    },
    uptime: Math.round((Date.now() - startTime) / 1000),
    activeClients: clients.size,
    nodeVersion: process.version,
  };
}

// Emitir telemetría cada 10 segundos
setInterval(() => {
  io.emit('system-telemetry', getSystemMetrics());
}, 10000);

async function getAIResponse(prompt, instanceId, originalMsg = null) {
  const aiStart = Date.now();
  try {
    // 1. Verificar configuración de la instancia
    const { data: instance, error: instError } = await supabase
      .from('instances')
      .select('bot_enabled, name, scope, user_id, personality')
      .eq('id', instanceId)
      .single();

    if (instError || !instance) {
      sysLog('error', `[AI] Error buscando instancia ${instanceId}`, { error: instError?.message });
      return null;
    }

    // --- FILTROS DE ACTIVACIÓN ---

    // Filtro 1: Bot apagado globalmente para esta instancia
    if (!instance.bot_enabled) {
      sysLog('info', `[AI-SKIP] Bot desactivado para "${instance.name}". Ignorando respuesta.`);
      return null;
    }

    // Filtro 2: Alcance (Scope)
    if (originalMsg) {
      const isGroup = originalMsg.from.endsWith('@g.us');

      if (instance.scope === 'groups' && !isGroup) {
        sysLog('info', `[AI-SKIP] Alcance configurado solo para GRUPOS. Ignorando chat individual.`);
        return null;
      }

      if (instance.scope === 'specific' && isGroup) {
        sysLog('info', `[AI-SKIP] Alcance configurado solo para CHATS INDIVIDUALES. Ignorando grupo.`);
        return null;
      }
    }

    // 2. Obtener configuración de IA del USUARIO
    const { data: settings, error: settError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', instance.user_id)
      .maybeSingle();

    if (settError || !settings || (!settings.groq_api_key && !process.env.GROQ_API_KEY)) {
      sysLog('error', "[AI] Error: API Key de Groq no configurada para el usuario.");
      return null;
    }

    const groqKey = decrypt(settings.groq_api_key) || process.env.GROQ_API_KEY;

    // Obtener productos desde la tabla local
    const { data: products } = await supabase
      .from('products')
      .select('name, price, description')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .limit(30);

    const context = products && products.length > 0
      ? JSON.stringify(products)
      : "No hay información de productos disponible en este momento.";

    // Prioridad: Instancia -> Global -> Default
    const systemPrompt = instance.personality || settings.personality || `Eres un asistente de ventas experto para una tienda de ecommerce. 
      Tu objetivo es ayudar a los clientes a comprar productos basándote en la siguiente información de la tienda:
      ${context}
      
      Reglas:
      1. Sé amable y profesional.
      2. Si no sabes algo sobre un producto, invita al cliente a esperar a un humano.
      3. Mantén las respuestas cortas y directas para WhatsApp.`;

    sysLog('info', `[AI] Consultando a Groq (Contexto: ${products?.length || 0} productos)...`);

    // 3. Llamar a la API de Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Error en Groq");
    }

    const data = await response.json();
    const duration = Date.now() - aiStart;
    sysLog('success', `[AI] Respuesta generada exitosamente en ${duration}ms.`, { duration });

    io.emit('system-event', {
      type: 'ai-latency',
      instanceId,
      duration,
      timestamp: new Date().toISOString()
    });

    return data.choices[0].message.content;

  } catch (error) {
    sysLog('error', "[AI] Error en getAIResponse:", { error: error.message });
    return null;
  }
}

// Función para inicializar un cliente de WhatsApp mediante Worker Threads
async function initWhatsAppClient(id, name, socket = null) {
  // 1. Evitar duplicados: Si ya hay un worker para este ID, NO lo reiniciamos
  if (workers.has(id)) {
    sysLog('info', `[SYSTEM] Re-usando worker activo para: "${name}" (ID: ${id})`);
    if (socket) socket.join(id);
    return;
  }

  sysLog('info', `[SYSTEM] Preparando entorno para: "${name}" (ID: ${id})`);

  // Dealerbot AI (Baileys) - No requiere limpieza de procesos Chrome ni LOCK files
  await supabase.from('instances').update({ status: 'initializing' }).eq('id', id);
  if (io) io.to(id).emit('instance-status-update', { instanceId: id, status: 'initializing' });

  // Un mínimo respiro para asegurar el desbloqueo del I/O (100ms)
  await new Promise(resolve => setTimeout(resolve, 100));

  // Dealerbot AI (Baileys) - Worker iniciado
  const worker = new Worker(path.join(__dirname, 'baileys-worker.js'), {
    workerData: { id, name, supabaseUrl, supabaseKey }
  });


  worker.on('message', async (msg) => {
    switch (msg.type) {
      case 'qr':

        sysLog('info', `[WHATSAPP] 📱 QR Recibido para "${name}"`);
        // Actualizar estado en DB a qr_ready
        supabase.from('instances').update({ status: 'qr_ready' }).eq('id', id).then(() => { });
        io.to(id).emit('instance-status-update', { instanceId: id, status: 'qr_ready' });
        io.to(id).emit('qr', { tempId: id, qr: msg.qr });
        break;
      case 'loading_screen':
        io.to(id).emit('instance-status-update', { instanceId: id, status: 'loading', progress: msg.percent });
        break;
      case 'ready':

        sysLog('success', `[SYSTEM] WhatsApp conectado para "${name}" (+${msg.phoneNumber})`);
        // Actualizar estado en DB con logging de error
        const { error: readyError } = await supabase
          .from('instances')
          .update({ status: 'connected', phone_number: `+${msg.phoneNumber}` })
          .eq('id', id);

        if (readyError) {
          sysLog('error', `[DATABASE] Error configurando estado "connected" en index.js:`, { error: readyError.message, code: readyError.code });
        } else {
          sysLog('success', `[DATABASE] Instancia "${name}" marcada como conecta en DB.`);
          io.to(id).emit('instance-status-update', { instanceId: id, status: 'connected' });
          const { data } = await supabase.from('instances').select('*').eq('id', id).single();
          io.to(id).emit('ready', { instance: data });
        }
        break;
      case 'expired':

        sysLog('warn', `[WHATSAPP] ⚠️ Sesión expirada o cerrada para "${name}"`);
        io.to(id).emit('session-expired', { instanceId: id, message: msg.message });
        // Registrar evento para auditoría en la tabla messages (vía chat de sistema si es necesario)
        try {
          // Buscamos o creamos un chat de sistema para esta instancia
          const { data: systemChat } = await supabase
            .from('chats')
            .upsert({
              instance_id: id,
              external_id: 'system',
              customer_name: 'System',
              status: 'closed'
            }, { onConflict: 'instance_id,external_id' })
            .select('id')
            .single();

          if (systemChat) {
            await supabase.from('messages').insert([{
              chat_id: systemChat.id,
              sender_name: 'System',
              content: `Sesión expirada: ${msg.message || 'Desconectado'}`,
              from_me: false,
              type: 'text'
            }]);
          }
        } catch (e) {
          sysLog('error', '[DATABASE] Error guardando log de expiración:', { error: e.message });
        }
        break;
      case 'status-update':
        io.to(id).emit('instance-status-update', { instanceId: id, status: msg.status });
        break;
      case 'message':
        {
          const { message } = msg;
          // El worker ya guarda el mensaje en la base de datos (ver worker.js:425)
          // Aquí solo emitimos a la UI para feedback inmediato
          io.emit('message-update', {
            instanceId: id,
            message: {
              type: 'bot', user: 'Tú', text: message.body,
              time: 'Ahora', fromMe: true, to: message.to
            }
          });
          io.emit('message-update', {
            instanceId: id,
            message: {
              type: 'msg', user: message.pushname || message.from,
              text: message.body, time: 'Ahora', fromMe: false, from: message.from
            }
          });
          // Actualizar contador global
          try {
            const { data: curr } = await supabase.from('settings').select('id, total_messages').limit(1).maybeSingle();
            if (curr) await supabase.from('settings').update({ total_messages: (curr.total_messages || 0) + 1 }).eq('id', curr.id);
          } catch (e) { }
        }
        break;
      case 'bot-reply':

        io.emit('message-update', {
          instanceId: id,
          message: {
            type: 'bot', user: 'SalesBot', text: msg.reply,
            time: 'Ahora', fromMe: true, to: msg.to
          }
        });
        // Actualizar contador global
        try {
          const { data: curr } = await supabase.from('settings').select('id, total_messages').limit(1).maybeSingle();
          if (curr) await supabase.from('settings').update({ total_messages: (curr.total_messages || 0) + 1 }).eq('id', curr.id);
        } catch (e) { }
        break;
      case 'log':
        sysLog(msg.level, msg.msg, msg.data);
        break;
      case 'connectivity-result':
        sysLog(msg.success ? 'success' : 'error', `[WHATSAPP] Resultado de conectividad para "${name}": ${msg.success ? 'EXITOSO' : 'FALLIDO'}`, msg);

        if (!msg.success) {
          supabase.from('instances').update({ status: 'expired' }).eq('id', id).then(() => { });
        }

        io.to(id).emit('connectivity-test-result', { instanceId: id, ...msg });
        break;
    }
  });

  worker.on('error', (err) => {
    clearTimeout(initializationTimeout);
    sysLog('error', `[WHATSAPP] Error en worker de "${name}":`, { error: err.message });
    if (socket) socket.emit('error', { message: 'Error en instancia: ' + err.message });
    supabase.from('instances').update({ status: 'disconnected' }).eq('id', id).then(() => { });
  });

  worker.on('exit', (code) => {
    if (code !== 0) sysLog('error', `[WHATSAPP] Worker "${name}" (ID: ${id}) salió con código ${code}`);
    else sysLog('info', `[WHATSAPP] Worker "${name}" (ID: ${id}) finalizado correctamente.`);

    // Asegurar que se elimine del Map al salir
    if (workers.get(id) === worker) {
      workers.delete(id);
    }
  });

  workers.set(id, worker);
  return worker;
}

// Inicializar instancias existentes al arrancar
async function loadExistingInstances() {
  sysLog('info', '[SYSTEM] Cargando instancias persistentes...');
  const { data, error } = await supabase
    .from('instances')
    .select('*')
    .eq('status', 'connected');

  if (error) {
    sysLog('error', '[SYSTEM] Error al recargar flota de instancias:', { error });
    return;
  }

  for (const inst of data) {
    try {
      await initWhatsAppClient(inst.id, inst.name);
    } catch (e) {
      sysLog('error', `[SYSTEM] Falló al recargar instancia "${inst.name}":`, { error: e.message });
    }
  }
}

// Banner de Inicio
console.log("\n" + "=".repeat(50));
sysLog('start', 'DEALERBOT AI - SISTEMA INICIALIZADO');
sysLog('info', `📡 Módulo: Backend Server (v1.0.0)`);
sysLog('info', `🔌 Puerto: ${PORT}`);
if (supabaseUrl) sysLog('info', `☁️  Cloud: Supabase connected to ${supabaseUrl.substring(0, 30)}...`);
console.log("=".repeat(50) + "\n");

loadExistingInstances();

// Middleware de autenticación para Socket.IO
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided.'));
  }

  try {
    // Crear un cliente específico para esta conexión de socket para respetar RLS
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error } = await userClient.auth.getUser();

    if (error || !user) {
      throw new Error(error?.message || 'Invalid token.');
    }

    socket.user = user;
    socket.supabase = userClient; // Guardamos el cliente en el socket
    socket.workspaceId = await getOrCreateWorkspace(userClient, user.id, user.email);
    next();
  } catch (error) {
    sysLog('error', '[AUTH] Error de negociación Socket.IO:', { error: error.message });
    return next(new Error('Authentication error: ' + error.message));
  }
});

io.on('connection', (socket) => {
  sysLog('success', `[SYSTEM] Conexión UI establecida: ${socket.user.email}`, { workspaceId: socket.workspaceId });

  socket.on('join-instance', ({ instanceId }) => {
    socket.join(instanceId);
    sysLog('debug', `[SYSTEM] El usuario ${socket.user.email} se ha unido al canal: ${instanceId}`);
  });

  socket.on('init-instance', async ({ name }) => {
    const { data: existing } = await socket.supabase
      .from('instances')
      .select('id')
      .eq('workspace_id', socket.workspaceId)
      .eq('name', name)
      .maybeSingle();

    if (existing) {
      sysLog('info', `[SYSTEM] Re-activando instancia detectada: ${name}`);
      socket.join(existing.id); // JOIN ROOM
      await initWhatsAppClient(existing.id, name, socket);
      return;
    }

    const tempId = uuidv4();
    socket.join(tempId); // JOIN ROOM
    sysLog('info', `[server] Nueva instancia para workspace ${socket.workspaceId}: ${name} (ID: ${tempId})`);

    const { error } = await socket.supabase
      .from('instances')
      .insert([{
        id: tempId,
        workspace_id: socket.workspaceId,
        name: name,
        status: 'connecting',
        bot_enabled: false,
        scope: 'all'
      }]);

    if (error) {
      sysLog('error', "[DATABASE] Error al registrar nueva instancia:", { error });
      socket.emit('error', { message: "Error DB: " + error.message });
      return;
    }

    const client = await initWhatsAppClient(tempId, name, socket);
    socket.currentClient = client;
  });

  socket.on('send-message', async ({ instanceId, to, message }) => {
    sysLog('info', `[socket] Intentando enviar mensaje desde ${instanceId} a ${to}`);
    const worker = workers.get(instanceId);

    if (worker) {
      worker.postMessage({ type: 'send-message', to, text: message });
      sysLog('info', `[socket] Comando de envío enviado al worker`);
    } else {
      sysLog('error', `[socket] Worker no encontrado para ID: ${instanceId}`);
      socket.emit('error', { message: 'La instancia no está activa' });
    }
  });

  socket.on('change-scope', async ({ instanceId, scope }) => {
    sysLog('info', `[socket] Cambiando scope de ${instanceId} a ${scope}`);
    const { error } = await socket.supabase
      .from('instances')
      .update({ scope })
      .eq('id', instanceId);

    if (error) {
      sysLog('error', `[DATABASE] Error al actualizar alcance de ${instanceId}:`, { error: error.message });
      socket.emit('error', { message: 'Error al cambiar alcance: ' + error.message });
    } else {
      socket.emit('scope-changed', { instanceId, scope });
    }
  });

  socket.on('restart-instance', async ({ instanceId }) => {
    sysLog('info', `[SYSTEM] Procesando solicitud de reinicio para: ${instanceId}`);

    // Obtenemos los datos de la instancia para el nombre
    const { data: inst } = await socket.supabase.from('instances').select('*').eq('id', instanceId).single();
    if (inst) {
      // initWhatsAppClient ya maneja la terminación del worker previo si existe
      await initWhatsAppClient(inst.id, inst.name, socket);
    } else {
      socket.emit('error', { message: 'Instancia no encontrada para reiniciar' });
    }
  });

  socket.on('run-connectivity-test', async ({ instanceId }) => {
    sysLog('info', `[socket] Solicitada prueba de conectividad para: ${instanceId}`);
    const worker = workers.get(instanceId);
    if (worker) {
      worker.postMessage({ type: 'run-connectivity-test' });
    } else {
      socket.emit('connectivity-test-result', { instanceId, success: false, error: 'Instancia no activa para diagnóstico' });
    }
  });

  socket.on('disconnect', () => {
    sysLog('info', '[SYSTEM] UI desconectada');
    // No destruimos los clientes al desconectar el socket porque el bot debe seguir corriendo
    // Pero el socket.currentClient ya no existirá
  });
});

server.listen(PORT, () => sysLog('info', `[server] Puerto ${PORT}`));