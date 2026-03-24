const { parentPort, workerData } = require('worker_threads');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { decrypt } = require('./utils/crypto');

// --- Diagnóstico de Conectividad ---
let pendingTest = null;

async function runConnectivityTest(retryCount = 0) {
  const maxRetries = 3;
  const testId = `test_${Date.now()}`;
  sysLog('info', `[DIAG] 🔍 Iniciando prueba de conectividad (Intento ${retryCount + 1}/${maxRetries + 1}) - ${testId}`);
  
  try {
    if (!client.info || !client.info.wid) {
      throw new Error('Cliente no inicializado o sesión no lista');
    }

    const selfNumber = client.info.wid._serialized;
    const testMessage = `DIAGNOSTIC_TEST_${testId}`;
    
    // Configurar promesa para esperar la recepción
    const receivePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        client.removeListener('message_create', checkMsg);
        reject(new Error('Timeout: El mensaje fue enviado pero no se recibió confirmación de recepción local. Posible fallo en la red de WhatsApp o sesión "fantasma".'));
      }, 20000); // 20 segundos de timeout para ser robustos

      function checkMsg(msg) {
        if (msg.body === testMessage && msg.from === selfNumber) {
          clearTimeout(timeout);
          client.removeListener('message_create', checkMsg);
          resolve(msg);
        }
      }
      client.on('message_create', checkMsg);
    });

    // Enviar mensaje
    sysLog('info', `[DIAG] 📤 Enviando mensaje de auto-prueba a: ${selfNumber}`);
    await client.sendMessage(selfNumber, testMessage);
    
    // Esperar recepción
    await receivePromise;
    sysLog('info', `[DIAG] ✅ Prueba completada exitosamente en el intento ${retryCount + 1}`);
    
    parentPort.postMessage({ 
      type: 'connectivity-result', 
      success: true, 
      testId,
      details: `Diagnóstico exitoso. Envío y recepción confirmados en el intento ${retryCount + 1}.` 
    });

  } catch (error) {
    sysLog('warn', `[DIAG] ⚠️ Fallo en intento ${retryCount + 1}: ${error.message}`);
    
    if (retryCount < maxRetries) {
      const backoffDelay = Math.pow(2, retryCount) * 5000; // Backoff exponencial: 5s, 10s, 20s
      sysLog('info', `[DIAG] ⏳ Reintentando en ${backoffDelay / 1000}s...`);
      setTimeout(() => runConnectivityTest(retryCount + 1), backoffDelay);
    } else {
      sysLog('error', `[DIAG] ❌ Todos los intentos fallaron para ${testId}`);
      parentPort.postMessage({ 
        type: 'connectivity-result', 
        success: false, 
        testId,
        error: `Fallo crítico tras ${maxRetries + 1} intentos. Error final: ${error.message}. Se recomienda re-vincular la instancia.` 
      });
    }
  }
}
// ------------------------------------

const { id, name, supabaseUrl, supabaseKey } = workerData;
const supabase = createClient(supabaseUrl, supabaseKey);

const client = new Client({
  authStrategy: new LocalAuth({ 
    clientId: id,
    dataPath: path.join(__dirname, '.wwebjs_auth') 
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--no-zygote'
    ]
  }
});

function sysLog(level, msg, data = {}) {
  parentPort.postMessage({ type: 'log', level, msg, data });
}

async function executeFlow(prompt, instanceId, msg) {
  try {
    // Buscar la instancia para obtener el workspace_id
    const { data: instance } = await supabase.from('instances').select('workspace_id').eq('id', instanceId).single();
    if (!instance) return null;

    const { data: flows } = await supabase
      .from('flows')
      .select('*')
      .eq('workspace_id', instance.workspace_id)
      .eq('is_active', true);

    if (!flows || flows.length === 0) return null;

    for (const flow of flows) {
      const definition = flow.definition || { nodes: [], edges: [] };
      const nodes = definition.nodes || [];
      const edges = definition.edges || [];

      // 1. Encontrar el Trigger inicial
      const triggerNode = nodes.find(n => 
        n.type === 'trigger' && 
        prompt.toLowerCase().includes(n.data?.keyword?.toLowerCase())
      );
      
      if (!triggerNode) continue;

      sysLog('info', `[FLOW] ⚡ Flujo "${flow.name}" activado`);
      
      let currentNode = triggerNode;
      let lastResponse = null;

      for (let step = 0; step < 10; step++) {
        const outboundEdges = edges.filter(e => e.source === currentNode.id);
        if (outboundEdges.length === 0) break;

        if (currentNode.type === 'condition') {
          const condition = currentNode.data.condition?.toLowerCase();
          const metCondition = prompt.toLowerCase().includes(condition);
          
          // Buscar el edge que corresponde al handle (true/false)
          const targetEdge = outboundEdges.find(e => e.sourceHandle === (metCondition ? 'true' : 'false')) || outboundEdges[0];
          currentNode = nodes.find(n => n.id === targetEdge.target);
        } else {
          currentNode = nodes.find(n => n.id === outboundEdges[0].target);
        }

        if (!currentNode) break;

        if (currentNode.type === 'message') {
          lastResponse = currentNode.data.text;
          break; 
        } else if (currentNode.type === 'ai_action') {
          const aiPrompt = currentNode.data.prompt || "Responde al usuario.";
          lastResponse = await callAI(prompt, aiPrompt, instanceId);
          break;
        }
      }

      if (lastResponse) return lastResponse;
    }
    return null;
  } catch (e) {
    sysLog('error', 'Error ejecutando flujo', { error: e.message });
    return null;
  }
}

async function callAI(userPrompt, systemPrompt, instanceId) {
  try {
    const { data: instance } = await supabase.from('instances').select('*').eq('id', instanceId).single();
    if (!instance) return null;

    const { data: settings } = await supabase.from('settings').select('*').eq('workspace_id', instance.workspace_id).maybeSingle();
    if (!settings) return null;

    const groqKey = decrypt(settings.groq_api_key) || process.env.GROQ_API_KEY;
    if (!groqKey) return null;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (e) {
    sysLog('error', 'Error en callAI', { error: e.message });
    return null;
  }
}

async function getAIResponse(prompt, instanceId, originalMsg = null) {
  try {
    // 1. Obtener la instancia y el agente asociado
    const { data: instance } = await supabase
      .from('instances')
      .select('*, agent:agents(*)')
      .eq('id', instanceId)
      .single();

    if (!instance || !instance.bot_enabled) return null;

    // 2. Si tiene un agente asignado, usar su configuración
    if (instance.agent) {
      const agent = instance.agent;
      sysLog('info', `[AGENT] 🤖 Usando agente: ${agent.name} (${agent.personality_mode})`);

      if (agent.personality_mode === 'flow' && agent.flow_id) {
        // Ejecutar un flujo específico asignado al agente
        const flowReply = await executeSpecificFlow(prompt, agent.flow_id, instanceId, originalMsg);
        if (flowReply) return flowReply;
      } else if (agent.personality_mode === 'qualities') {
        // Combinar cualidades en un prompt
        const qualitiesStr = agent.selected_qualities?.join(', ') || 'profesional';
        const systemPrompt = `Eres ${agent.name}, un asistente con las siguientes cualidades: ${qualitiesStr}. Responde de acuerdo a esta personalidad.`;
        return await callAI(prompt, systemPrompt, instanceId);
      } else if (agent.personality_mode === 'prompt') {
        // Usar prompt libre
        const systemPrompt = agent.prompt_text || "Eres un asistente de ventas.";
        return await callAI(prompt, systemPrompt, instanceId);
      }
    }

    // 3. Fallback a flujos globales o personalidad de instancia (legacy)
    const flowReply = await executeFlow(prompt, instanceId, originalMsg);
    if (flowReply) return flowReply;

    const { data: settings } = await supabase.from('settings').select('*').eq('workspace_id', instance.workspace_id).maybeSingle();
    const systemPrompt = instance.personality || (settings ? settings.global_personality : "Eres un asistente de ventas.");
    
    return await callAI(prompt, systemPrompt, instanceId);
  } catch (e) {
    sysLog('error', 'Error en getAIResponse', { error: e.message });
    return null;
  }
}

async function executeSpecificFlow(prompt, flowId, instanceId, msg) {
  try {
    const { data: flow } = await supabase
      .from('flows')
      .select('*')
      .eq('id', flowId)
      .single();

    if (!flow || !flow.is_active) return null;

    const definition = flow.definition || { nodes: [], edges: [] };
    const nodes = definition.nodes || [];
    const edges = definition.edges || [];

    // En el caso de flujo de agente, no necesariamente buscamos un trigger de palabra clave,
    // podríamos simplemente empezar desde el primer nodo que no sea trigger si es una respuesta directa,
    // o buscar un trigger que coincida.
    
    let currentNode = nodes.find(n => n.type === 'trigger' && prompt.toLowerCase().includes(n.data?.keyword?.toLowerCase()));
    
    // Si no hay trigger coincidente, pero es un flujo de agente, podríamos querer un "fallback" o "start"
    if (!currentNode) {
        currentNode = nodes.find(n => n.type === 'trigger' && (n.data?.keyword === '*' || !n.data?.keyword));
    }

    if (!currentNode) return null;

    sysLog('info', `[FLOW] ⚡ Ejecutando flujo de agente: "${flow.name}"`);
    
    let lastResponse = null;

    for (let step = 0; step < 10; step++) {
      const outboundEdges = edges.filter(e => e.source === currentNode.id);
      if (outboundEdges.length === 0) break;

      if (currentNode.type === 'condition') {
        const condition = currentNode.data.condition?.toLowerCase();
        const metCondition = prompt.toLowerCase().includes(condition);
        const targetEdge = outboundEdges.find(e => e.sourceHandle === (metCondition ? 'true' : 'false')) || outboundEdges[0];
        currentNode = nodes.find(n => n.id === targetEdge.target);
      } else {
        currentNode = nodes.find(n => n.id === outboundEdges[0].target);
      }

      if (!currentNode) break;

      if (currentNode.type === 'message') {
        lastResponse = currentNode.data.text;
        break; 
      } else if (currentNode.type === 'ai_action') {
        const aiPrompt = currentNode.data.prompt || "Responde al usuario.";
        lastResponse = await callAI(prompt, aiPrompt, instanceId);
        break;
      }
    }

    return lastResponse;
  } catch (e) {
    sysLog('error', 'Error en executeSpecificFlow', { error: e.message });
    return null;
  }
}

client.on('qr', (qr) => {
  parentPort.postMessage({ type: 'qr', qr });
});

client.on('auth_failure', async (msg) => {
  sysLog('error', `[AUTH] ❌ Fallo de autenticación en "${name}": ${msg}`);
  await supabase.from('instances').update({ status: 'expired' }).eq('id', id);
  parentPort.postMessage({ type: 'expired', message: msg });
});

client.on('disconnected', async (reason) => {
  sysLog('warn', `[AUTH] ⚠️ Instancia "${name}" desconectada: ${reason}`);
  await supabase.from('instances').update({ status: 'expired' }).eq('id', id);
  parentPort.postMessage({ type: 'expired', message: reason });
});

client.on('ready', async () => {
  const phoneNumber = client.info.wid.user;
  sysLog('info', `🚀 WhatsApp Conectado: ${name} (+${phoneNumber})`);
  
  await supabase.from('instances').update({ status: 'connected', phone_number: `+${phoneNumber}` }).eq('id', id);
  parentPort.postMessage({ type: 'ready', phoneNumber });
});

client.on('message_create', async (msg) => {
  const contact = await msg.getContact();
  const from = msg.from;
  const body = msg.body;
  const isMe = msg.fromMe;

  // 1. Asegurar que existe el Chat en la base de datos
  let chatId;
  try {
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .upsert({
        instance_id: id,
        external_id: from,
        customer_name: contact.pushname || from,
        last_message_at: new Date().toISOString()
      }, { onConflict: 'instance_id,external_id' })
      .select('id')
      .single();
    
    if (chatError) throw chatError;
    chatId = chat.id;
  } catch (e) {
    sysLog('error', "Error gestionando chat", { error: e.message });
    return;
  }

  // 2. Guardar el mensaje en la tabla normalizada
  try {
    await supabase.from('messages').insert([{
      chat_id: chatId,
      sender_name: isMe ? 'Tú' : (contact.pushname || from),
      content: body,
      from_me: isMe,
      type: 'text'
    }]);
  } catch (e) {
    sysLog('error', "Error guardando mensaje", { error: e.message });
  }

  parentPort.postMessage({ 
    type: 'message', 
    message: { 
      from, body, isMe, 
      pushname: contact.pushname,
      to: msg.to,
      chat_id: chatId
    } 
  });

  if (!isMe) {
    const aiReply = await getAIResponse(body, id, msg);
    if (aiReply) {
      await msg.reply(aiReply);
      parentPort.postMessage({ type: 'bot-reply', reply: aiReply, to: from });
      
      // Guardar log de respuesta del bot
      try {
        await supabase.from('messages').insert([{
          chat_id: chatId,
          sender_name: 'SalesBot',
          content: aiReply,
          from_me: true,
          type: 'bot'
        }]);
      } catch (e) {}
    }
  }
});

client.initialize().catch(err => {
  sysLog('error', `Error inicializando ${name}`, { error: err.message });
  process.exit(1);
});

parentPort.on('message', (msg) => {
  if (msg.type === 'send-message') {
    client.sendMessage(msg.to, msg.text);
  } else if (msg.type === 'run-connectivity-test') {
    runConnectivityTest();
  }
});
