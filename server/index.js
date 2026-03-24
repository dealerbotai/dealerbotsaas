const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { Worker } = require('worker_threads');
const fs = require('fs');
const { execSync } = require('child_process');
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('✅ [SERVER] .env file loaded from:', envPath);
} else {
  console.warn('⚠️ [SERVER] .env file NOT FOUND at:', envPath);
  require('dotenv').config(); // Fallback to current dir
}

const { encrypt, decrypt } = require('./utils/crypto');

// Configuración de Pino Logger
const pino = require('pino');
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

// Función para loguear y opcionalmente enviar por socket
function sysLog(level, msg, data = {}) {
  logger[level](data, msg);
  // Emitir evento de sistema a la UI para observabilidad total
  if (io) {
    io.emit('system-log', {
      level,
      message: msg,
      timestamp: new Date().toISOString(),
      ...data
    });
  }
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// ... (supabase setup)

// Configuración de Supabase desde variables de entorno
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  sysLog('error', "[SYSTEM] ❌ Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no definidas.");
  process.exit(1);
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
    console.error(`[SYSTEM] ❌ Error creating workspace for ${email}:`, wsError);
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
    sysLog('error', '[AUTH] ❌ Error de autenticación HTTP:', { error: error.message });
    return res.status(401).json({ error: 'No autorizado: ' + error.message });
  }
}

app.post('/scrape', authenticate, async (req, res) => {
  const { url } = req.body;
  const workspaceId = req.workspaceId;
  sysLog('info', `[SCRAPER] 🌐 Solicitud para workspace: ${workspaceId} -> ${url}`);

  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Heurística avanzada para extraer "productos" del HTML
    const products = [];
    
    // 1. Intentar buscar JSON-LD de tipo Product (Más preciso)
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
      } catch (e) {}
    }

    // 2. Si no hay suficiente JSON-LD, buscar en Meta Tags (OpenGraph / Twitter)
    if (products.length < 3) {
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

    // 3. Buscar enlaces de productos para escaneo recursivo
    const productLinks = [];
    const linkRegex = /href="([^"]*\/products\/[^"]*)"/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null && productLinks.length < 5) {
      let fullLink = linkMatch[1];
      if (fullLink.startsWith('/')) {
        const urlObj = new URL(url);
        fullLink = `${urlObj.protocol}//${urlObj.host}${fullLink}`;
      }
      if (!productLinks.includes(fullLink)) {
        productLinks.push(fullLink);
      }
    }

    if (productLinks.length > 0) {
      sysLog('info', `[SCRAPER] 🔗 Encontrados ${productLinks.length} enlaces de productos. Iniciando escaneo profundo...`);
      for (const link of productLinks) {
        try {
          const pResp = await fetch(link);
          const pHtml = await pResp.text();
          
          // Extraer nombre (OG Title es muy confiable en páginas de producto)
          const name = pHtml.match(/<meta property="og:title" content="(.*?)"/)?.[1] || 
                       pHtml.match(/<title>(.*?)<\/title>/)?.[1];
          
          // Extraer precio
          const price = pHtml.match(/<meta property="product:price:amount" content="(.*?)"/)?.[1] ||
                        pHtml.match(/<meta property="og:price:amount" content="(.*?)"/)?.[1] ||
                        pHtml.match(/\$\s?(\d+([.,]\d{2})?)/)?.[0] || 'N/A';

          if (name && !products.find(p => p.name === name)) {
            products.push({
              name: name.split(/[|-]/)[0].trim(),
              price: price.includes('$') ? price : `$${price}`,
              description: pHtml.match(/<meta property="og:description" content="(.*?)"/)?.[1]?.substring(0, 150) || 'Producto de calidad.'
            });
          }
        } catch (e) {
          sysLog('error', `[SCRAPER] ❌ Error escaneando link: ${link}`, { error: e.message });
        }
      }
    }

    // 4. Búsqueda de patrones comunes en el body (Respaldo si no hubo links)
    if (products.length === 0) {
      // Intentar buscar elementos que parezcan precios ($ XX.XX)
      const priceRegex = /\$\s?(\d+([.,]\d{2})?)/g;
      const pricesFound = html.match(priceRegex);
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const siteName = titleMatch ? titleMatch[1].split(/[|-]/)[0].trim() : 'Tienda';

      if (pricesFound) {
        // Tomar los primeros 3 precios únicos como "ofertas destacadas"
        const uniquePrices = [...new Set(pricesFound)].slice(0, 3);
        uniquePrices.forEach((price, idx) => {
          products.push({
            name: `Oferta destacada ${idx + 1} en ${siteName}`,
            price: price,
            description: `Producto detectado automáticamente en la página principal de ${siteName}.`
          });
        });
      }
    }

    // 4. Fallback final si todo falla
    if (products.length === 0) {
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1] : 'Tienda Online';
      products.push({
        name: `Catálogo General - ${title}`,
        price: 'Consultar',
        description: 'Información general de la tienda. El bot responderá consultas generales sobre el catálogo disponible.'
      });
    }

    const scrapedData = {
      url,
      products: products.slice(0, 10), // Limitamos a 10
      lastScraped: new Date().toISOString(),
    };

    // Actualizar en Supabase filtrando por workspace_id
    await req.supabase.from('settings').update({ 
      ecommerce_url: url, 
      scraped_data: scrapedData 
    }).eq('workspace_id', workspaceId);

    res.json(scrapedData);
  } catch (error) {
    sysLog('error', `[SCRAPER] ❌ Error:`, { error: error.message });
    res.status(500).json({ error: 'Error al escanear la URL: ' + error.message });
  }
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
    res.json(data);
  } catch (error) {
    sysLog('error', `[SETTINGS] ❌ Error actualizando configuración:`, { error: error.message });
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

const PORT = process.env.PORT || 3001;
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
      sysLog('error', `[AI-DEBUG] ❌ Error buscando instancia ${instanceId}`, { error: instError?.message });
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
      sysLog('error', "[AI-DEBUG] ❌ Error: API Key de Groq no configurada para el usuario.");
      return null;
    }

    const groqKey = decrypt(settings.groq_api_key) || process.env.GROQ_API_KEY;

    const context = settings.scraped_data 
      ? JSON.stringify(settings.scraped_data.products) 
      : "No hay información de productos disponible.";

    // Prioridad: Instancia -> Global -> Default
    const systemPrompt = instance.personality || settings.personality || `Eres un asistente de ventas experto para una tienda de ecommerce. 
      Tu objetivo es ayudar a los clientes a comprar productos basándote en la siguiente información de la tienda:
      ${context}
      
      Reglas:
      1. Sé amable y profesional.
      2. Si no sabes algo sobre un producto, invita al cliente a esperar a un humano.
      3. Mantén las respuestas cortas y directas para WhatsApp.`;

    sysLog('info', `[AI-DEBUG] 🧠 Consultando a Groq (Contexto: ${settings.scraped_data ? 'OK' : 'VACÍO'})...`);
    
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
    sysLog('info', `[AI-DEBUG] ✅ Respuesta generada exitosamente en ${duration}ms.`, { duration });
    
    io.emit('system-event', { 
      type: 'ai-latency', 
      instanceId, 
      duration, 
      timestamp: new Date().toISOString() 
    });

    return data.choices[0].message.content;

  } catch (error) {
    sysLog('error', "[AI-DEBUG] ❌ Error en getAIResponse:", { error: error.message });
    return null;
  }
}

// Función para inicializar un cliente de WhatsApp mediante Worker Threads
async function initWhatsAppClient(id, name, socket = null) {
  // 1. Evitar duplicados: Si ya hay un worker para este ID, lo terminamos antes de iniciar uno nuevo
  if (workers.has(id)) {
    sysLog('warn', `[SYSTEM] 🔄 Reiniciando Worker ya existente para: "${name}" (ID: ${id})`);
    const oldWorker = workers.get(id);
    try {
      await oldWorker.terminate();
    } catch (e) {}
    workers.delete(id);
    // Esperar un poco a que el thread se detenga realmente
    await new Promise(r => setTimeout(r, 1000));
  }

  sysLog('info', `[SYSTEM] 🛠️  Iniciando Worker para: "${name}" (ID: ${id})`);
  
  // 2. Limpieza de procesos y archivos de bloqueo (LOCK) de Puppeteer
  const sessionPath = path.join(__dirname, '.wwebjs_auth', `session-${id}`);
  
  // Función para matar procesos Chrome de forma agresiva
  const killProcesses = () => {
    if (process.platform === 'win32') {
      try {
        // Opción 1: PowerShell (más preciso con CommandLine)
        // Buscamos procesos chrome.exe o chromium.exe que tengan el ID de sesión en su línea de comandos
        const psCmd = `powershell "Get-CimInstance Win32_Process -Filter \\" (Name = 'chrome.exe' OR Name = 'chromium.exe') AND CommandLine LIKE '%session-${id}%'\\" | Stop-Process -Force"`;
        execSync(psCmd, { stdio: 'ignore' });
        
        // Opción 2: Intentar liberar el archivo usando un comando de sistema si es posible (herramienta handle.exe no suele estar)
        // Como alternativa, usamos taskkill genérico si el proceso sigue vivo (pero con cuidado de no matar otros chrome)
        
        sysLog('debug', `[SYSTEM] 🔫 Intento de eliminación de procesos Chrome para sesión: ${id}`);
      } catch (e) {}
    }
  };

  killProcesses();

  const lockFiles = [
    path.join(sessionPath, 'Default', 'LOCK'),
    path.join(sessionPath, 'LOCK'),
    path.join(sessionPath, 'SingletonLock'),
    path.join(sessionPath, 'lockfile'),
    path.join(sessionPath, 'Default', 'SingletonLock'),
    path.join(sessionPath, 'Default', 'lockfile')
  ];

  // Reintento de eliminación de archivos de bloqueo
  for (let i = 0; i < 4; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    let allCleared = true;

    lockFiles.forEach(lockFile => {
      if (fs.existsSync(lockFile)) {
        try {
          fs.unlinkSync(lockFile);
          sysLog('debug', `[SYSTEM] 🧹 Archivo de bloqueo eliminado: ${lockFile}`);
        } catch (e) {
          allCleared = false;
          sysLog('warn', `[SYSTEM] ⚠️ Intento ${i+1}: No se pudo eliminar ${path.basename(lockFile)}: ${e.message}`);
          
          // Intentar renombrar como último recurso
          try {
            const backup = `${lockFile}.old_${Date.now()}`;
            fs.renameSync(lockFile, backup);
            sysLog('debug', `[SYSTEM] 🔄 Archivo de bloqueo renombrado: ${path.basename(backup)}`);
            allCleared = true; // Si renombramos con éxito, ya no bloquea
          } catch (e2) {}
        }
      }
    });

    if (allCleared) break;
    if (i < 3) killProcesses(); // Re-intentar matar procesos si no se borraron los archivos
  }

  // Un último respiro antes de arrancar el worker
  await new Promise(resolve => setTimeout(resolve, 1000));

  const worker = new Worker(path.join(__dirname, 'worker.js'), {
    workerData: {
      id,
      name,
      supabaseUrl,
      supabaseKey
    }
  });

  worker.on('message', async (msg) => {
    switch (msg.type) {
      case 'qr':
        sysLog('info', `[AUTH] 📱 QR Recibido para "${name}"`);
        // Actualizar estado en DB a qr_ready
        supabase.from('instances').update({ status: 'qr_ready' }).eq('id', id).then(() => {});
        if (socket) socket.emit('qr', { tempId: id, qr: msg.qr });
        break;
      case 'ready':
        sysLog('info', `[SYSTEM] 🚀 Ready: "${name}" (+${msg.phoneNumber})`);
        // Asegurar que el estado esté en 'connected'
        supabase.from('instances').update({ status: 'connected', phone_number: `+${msg.phoneNumber}` }).eq('id', id).then(() => {});
        if (socket) {
          const { data } = await supabase.from('instances').select('*').eq('id', id).single();
          socket.emit('ready', { instance: data });
        }
        break;
      case 'expired':
        sysLog('warn', `[AUTH] ⚠️ Sesión expirada para "${name}"`);
        if (socket) {
          socket.emit('session-expired', { instanceId: id, message: msg.message });
        }
        // Registrar evento para auditoría
        try {
          await supabase.from('chat_logs').insert([{
            instance_id: id,
            type: 'system',
            sender_name: 'System',
            text: `Sesión expirada: ${msg.message || 'Desconectado'}`,
            from_me: false,
            contact_id: 'system'
          }]);
        } catch (e) {}
        break;
      case 'message':
        const { message } = msg;
        if (message.isMe) {
          io.emit('message-update', { 
            instanceId: id, 
            message: { 
              type: 'bot', user: 'Tú', text: message.body, 
              time: 'Ahora', fromMe: true, to: message.to 
            } 
          });
          // Guardar log manual saliente
          try {
            await supabase.from('chat_logs').insert([{
              instance_id: id,
              type: 'bot',
              sender_name: 'Tú',
              text: message.body,
              from_me: true,
              contact_id: message.to
            }]);
          } catch (e) {}
        } else {
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
          } catch (e) {}
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
        } catch (e) {}
        break;
      case 'log':
        sysLog(msg.level, msg.msg, msg.data);
        break;
      case 'connectivity-result':
        sysLog(msg.success ? 'info' : 'error', `[DIAG] Resultado de conectividad para "${name}": ${msg.success ? 'EXITOSO' : 'FALLIDO'}`, msg);
        
        if (!msg.success) {
          // Si falla críticamente, marcar como expired para forzar re-vinculación
          supabase.from('instances').update({ status: 'expired' }).eq('id', id).then(() => {});
        }

        if (socket) {
          socket.emit('connectivity-test-result', { instanceId: id, ...msg });
        }
        // Registrar en logs de auditoría
        try {
          await supabase.from('chat_logs').insert([{
            instance_id: id,
            type: 'system',
            sender_name: 'System Diagnostic',
            text: `Prueba de conectividad: ${msg.success ? '✅ EXITOSA' : '❌ FALLIDA'} - ${msg.details || msg.error}`,
            from_me: false,
            contact_id: 'system'
          }]);
        } catch (e) {}
        break;
    }
  });

  worker.on('error', (err) => {
    sysLog('error', `[WORKER] ❌ Error en "${name}":`, { error: err.message });
    if (socket) socket.emit('error', { message: 'Error en instancia: ' + err.message });
    // Intentar marcar como desconectado en DB si falla críticamente
    supabase.from('instances').update({ status: 'disconnected' }).eq('id', id).then(() => {});
  });

  worker.on('exit', (code) => {
    if (code !== 0) sysLog('error', `[WORKER] ❌ Worker "${name}" (ID: ${id}) salió con código ${code}`);
    else sysLog('info', `[WORKER] ✅ Worker "${name}" (ID: ${id}) finalizado correctamente.`);
    
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
  sysLog('info', '[server] Cargando instancias existentes...');
  const { data, error } = await supabase
    .from('instances')
    .select('*')
    .eq('status', 'connected');

  if (error) {
    sysLog('error', '[server] Error al cargar instancias:', { error });
    return;
  }

  for (const inst of data) {
    try {
      await initWhatsAppClient(inst.id, inst.name);
    } catch (e) {
      sysLog('error', `[server] Falló al recargar instancia ${inst.name}:`, { error: e.message });
    }
  }
}

// loadExistingInstances(); // Desactivado previamente para multi-tenant, pero habilitado para persistencia
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
    sysLog('error', '[AUTH] ❌ Error de autenticación de Socket:', { error: error.message });
    return next(new Error('Authentication error: ' + error.message));
  }
});

io.on('connection', (socket) => {
  sysLog('info', `[server] ✅ UI conectada para el usuario: ${socket.user.email} (Workspace: ${socket.workspaceId})`);

  socket.on('init-instance', async ({ name }) => {
    const { data: existing } = await supabase
      .from('instances')
      .select('id')
      .eq('workspace_id', socket.workspaceId)
      .eq('name', name)
      .maybeSingle();

    if (existing) {
      sysLog('info', `[server] Re-inicializando instancia existente: ${name}`);
      await initWhatsAppClient(existing.id, name, socket);
      return;
    }

    const tempId = uuidv4();
    sysLog('info', `[server] Nueva instancia para workspace ${socket.workspaceId}: ${name} (ID: ${tempId})`);

    const { error } = await supabase
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
      sysLog('error', "[server] Error al crear registro:", { error });
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
    const { error } = await supabase
      .from('instances')
      .update({ scope })
      .eq('id', instanceId);

    if (error) {
      sysLog('error', `[socket] Error al cambiar scope:`, { error: error.message });
      socket.emit('error', { message: 'Error al cambiar alcance: ' + error.message });
    } else {
      socket.emit('scope-changed', { instanceId, scope });
    }
  });

  socket.on('restart-instance', async ({ instanceId }) => {
    sysLog('info', `[server] Solicitud de reinicio para instancia: ${instanceId}`);
    
    // Obtenemos los datos de la instancia para el nombre
    const { data: inst } = await supabase.from('instances').select('*').eq('id', instanceId).single();
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
      socket.emit('error', { message: 'Instancia no activa para diagnóstico' });
    }
  });

  socket.on('disconnect', () => {
    sysLog('info', '[server] UI desconectada');
    // No destruimos los clientes al desconectar el socket porque el bot debe seguir corriendo
    // Pero el socket.currentClient ya no existirá
  });
});

server.listen(PORT, () => sysLog('info', `[server] Puerto ${PORT}`));