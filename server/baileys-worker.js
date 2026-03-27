import { parentPort, workerData } from 'worker_threads';
import makeWASocket, { 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    Browsers,
    jidNormalizedUser,
    proto
} from '@whiskeysockets/baileys';
import { createClient } from '@supabase/supabase-js';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// --- NUEVA ARQUITECTURA: SIN ARCHIVOS LOCALES ---
import { useSupabaseAuthStore } from './baileys-supabase-auth.js';
import { decrypt } from './utils/crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { id, name, supabaseUrl, supabaseKey } = workerData;
const supabase = createClient(supabaseUrl, supabaseKey);

// REQUERIMIENTO: Implementación robusta de Pino para Baileys
const logger = pino({ 
    level: 'debug', 
    transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss Z' }
    }
});

function sysLog(level, msg, data = {}) {
    parentPort.postMessage({ type: 'log', level, msg, data });
}

/**
 * REESCRITURA TOTAL: Dealerbot AI Engine (Baileys Cloud)
 * Headless | RAM < 150MB | Stateless
 */
async function startWorker() {
    sysLog('info', `🚀 Iniciando Dealerbot AI Engine para: ${name}`);

    // REQUERIMIENTO: Sin archivos. Todo vía whatsapp_sessions en Supabase.
    const { state, saveCreds } = await useSupabaseAuthStore(supabase, id);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true, // Requerimiento: QR en consola
        browser: Browsers.ubuntu('Chrome'),
        logger,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        defaultQueryTimeoutMs: 60000
    });

    // Guardado de estado atómico en cada actualización de llaves
    sock.ev.on('creds.update', saveCreds);

    // --- MANEJO DE EVENTOS DE CONEXIÓN ---
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            sysLog('info', `📱 [VINCULACIÓN] Nueva firma QR recibida. Escanea en terminal.`);
            parentPort.postMessage({ type: 'qr', qr });
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error instanceof Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            sysLog('warn', `⚠️ [SOCKET] Conexión cerrada (${statusCode}). Reconectando: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                setTimeout(() => startWorker(), 5000); 
            } else {
                sysLog('error', '❌ [SESSION] Sesión expirada o cerrada permanentemente.');
                await supabase.from('instances').update({ status: 'disconnected' }).eq('id', id);
                parentPort.postMessage({ type: 'expired', message: 'Logged Out' });
                // Limpiar auth en Supabase para permitir vinculación nueva limpia
                await supabase.from('whatsapp_sessions').delete().eq('id', id);
            }
        } else if (connection === 'open') {
            const phoneNumber = jidNormalizedUser(sock.user.id).split('@')[0];
            sysLog('success', `✅ [CONNECTED] WhatsApp Cloud Online para "${name}" (+${phoneNumber})`);
            
            // Notificar al hilo principal
            parentPort.postMessage({ type: 'ready', phoneNumber });
        }
    });

    // --- MANEJO DE MENSAJES (IA INTEGRATION: GROQ) ---
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;
            const jid = msg.key.remoteJid;
            if (jid.endsWith('@g.us')) continue; // Foco en ventas directas (no grupos)

            const body = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text ||
                         msg.message.imageMessage?.caption;

            if (!body) continue;

            const pushName = msg.pushName || jid.split('@')[0];
            sysLog('debug', `📩 Mensaje recibido de ${pushName}: "${body.substring(0, 40)}..."`);

            try {
                // 1. Persistencia de Mensaje y Chat en Supabase
                const { data: chat } = await supabase
                    .from('chats')
                    .upsert({
                        instance_id: id,
                        external_id: jid,
                        customer_name: pushName,
                        last_message_at: new Date().toISOString()
                    }, { onConflict: 'instance_id,external_id' })
                    .select('id').single();

                if (chat) {
                    await supabase.from('messages').insert([{
                        chat_id: chat.id, sender_name: pushName, content: body, from_me: false, type: 'text'
                    }]);

                    // Notificar a la UI (vía index.js)
                    parentPort.postMessage({
                        type: 'message',
                        message: { from: jid, body, isMe: false, pushname: pushName, to: sock.user.id, chat_id: chat.id }
                    });

                    // 2. Lógica de IA (Dealerbot AI + Groq)
                    const aiReply = await getAIResponse(body, id);
                    if (aiReply) {
                        await sock.sendMessage(jid, { text: aiReply }, { quoted: msg });
                        parentPort.postMessage({ type: 'bot-reply', reply: aiReply, to: jid });

                        // Guardar respuesta del bot
                        await supabase.from('messages').insert([{
                            chat_id: chat.id,
                            sender_name: 'SalesBot',
                            content: aiReply,
                            from_me: true,
                            type: 'bot'
                        }]);
                    }
                }
            } catch (e) {
                sysLog('error', `Error procesando IA para ${pushName}:`, { error: e.message });
            }
        }
    });

    // Handler para envío manual desde la UI
    parentPort.on('message', async (cmd) => {
        if (cmd.type === 'send-message' && cmd.to && cmd.text) {
            await sock.sendMessage(cmd.to, { text: cmd.text });
            sysLog('info', `📤 [UI] Respuesta manual enviada a ${cmd.to}`);
        }
    });
}

// --- DEALERBOT AI ENGINE (GROQ) ---

async function callAI(userPrompt, systemPrompt, instanceId) {
    try {
        const { data: inst } = await supabase.from('instances').select('*').eq('id', instanceId).single();
        if (!inst || !inst.bot_enabled) return null;

        const { data: settings } = await supabase.from('settings').select('*').eq('workspace_id', inst.workspace_id).maybeSingle();
        const groqKey = decrypt(settings?.groq_api_key) || process.env.GROQ_API_KEY;
        if (!groqKey) return null;

        // Contexto de productos desde DB para la IA
        const { data: products } = await supabase.from('products').select('name, price, description').eq('workspace_id', inst.workspace_id).eq('is_active', true).limit(20);
        const context = products?.length > 0 ? JSON.stringify(products) : "No hay productos actualmente.";

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: `${systemPrompt}\n\nCATÁLOGO ACTUAL:\n${context}` },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });

        const d = await response.json();
        return d.choices?.[0]?.message?.content || null;
    } catch (e) {
        return null;
    }
}

async function getAIResponse(prompt, instanceId) {
    try {
        const { data: inst } = await supabase.from('instances').select('*, agent:agents(*)').eq('id', instanceId).single();
        if (!inst || !inst.agent) return null;
        
        const personality = inst.agent.prompt_text || "Asistente de ventas cordial y efectivo.";
        return await callAI(prompt, personality, instanceId);
    } catch (e) {
        return null;
    }
}

// Inicialización del Engine
startWorker().catch(e => {
    logger.fatal(e, 'Fallo catastrófico en Dealerbot Engine');
    process.exit(1);
});
