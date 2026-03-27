import { parentPort, workerData } from 'worker_threads';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// --- ARQUITECTURA MODULAR (PRO+) ---
import WhatsAppClient from './services/whatsapp/client.js';
import { decrypt } from './utils/crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { id, name, supabaseUrl, supabaseKey } = workerData;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * WORKER DEALERBOT AI (BAILEYS ⚡)
 * Arquitectura modular | RAM < 150MB | Cloud-ready
 */
async function startWorker() {
    
    // 1. Inicializar cliente con persistencia en Supabase (whatsapp_sessions)
    const client = new WhatsAppClient(supabase, {
        instanceId: id,
        name: name,
        onEvent: async (type, data) => {
            // Re-emitir eventos al proceso principal (index.js)
            switch (type) {
                case 'qr':
                    parentPort.postMessage({ type: 'qr', qr: data.qr });
                    break;
                case 'ready':
                    parentPort.postMessage({ type: 'ready', phoneNumber: data.phoneNumber });
                    break;
                case 'expired':
                    parentPort.postMessage({ type: 'expired', message: data.message });
                    break;
            }
        }
    });

    // 2. Conectar al socket
    const sock = await client.connect();

    // 3. Manejar mensajes entrantes (Dealerbot AI Logic)
    sock.ev.on('messages.upsert', async (upsert) => {
        if (upsert.type !== 'notify') return;
        
        for (const msg of upsert.messages) {
            if (msg.key.fromMe) continue;
            const jid = msg.key.remoteJid;
            if (jid.endsWith('@g.us')) continue; // Ignorar grupos

            const body = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || 
                         msg.message?.imageMessage?.caption;

            if (!body) continue;

            const pushName = msg.pushName || jid.split('@')[0];

            try {
                // Persistencia de Chat
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
                        chat_id: chat.id,
                        sender_name: pushName,
                        content: body,
                        from_me: false,
                        type: 'text'
                    }]);

                    parentPort.postMessage({
                        type: 'message',
                        message: { from: jid, body, isMe: false, pushname: pushName, to: sock.user.id, chat_id: chat.id }
                    });

                    // Respuesta de Agente IA
                    const aiReply = await getAIResponse(body, id);
                    if (aiReply) {
                        await client.sendMessage(jid, aiReply, msg);
                        parentPort.postMessage({ type: 'bot-reply', reply: aiReply, to: jid });

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
                console.error('[WORKER] Error en Dealerbot AI:', e.message);
            }
        }
    });

    // Envío de mensajes manuales
    parentPort.on('message', async (cmd) => {
        if (cmd.type === 'send-message') {
            await client.sendMessage(cmd.to, cmd.text);
        }
    });
}

// --- FUNCIONES IA CORE ---

async function callAI(userPrompt, systemPrompt, instanceId) {
    try {
        const { data: inst } = await supabase.from('instances').select('*').eq('id', instanceId).single();
        if (!inst) return null;
        const { data: settings } = await supabase.from('settings').select('*').eq('workspace_id', inst.workspace_id).maybeSingle();
        if (!settings) return null;

        const groqKey = decrypt(settings.groq_api_key) || process.env.GROQ_API_KEY;
        const { data: products } = await supabase.from('products').select('name, price').eq('workspace_id', inst.workspace_id).eq('is_active', true).limit(20);
        const context = products?.length > 0 ? JSON.stringify(products) : "No hay productos.";

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: `${systemPrompt}\n\nPRODUCTOS:\n${context}` }, { role: "user", content: userPrompt }],
                temperature: 0.7, max_tokens: 300
            })
        });
        const d = await response.json();
        return d.choices?.[0]?.message?.content || null;
    } catch (e) { return null; }
}

async function getAIResponse(prompt, instanceId) {
    try {
        const { data: inst } = await supabase.from('instances').select('*, agent:agents(*)').eq('id', instanceId).single();
        if (!inst || !inst.bot_enabled || !inst.agent) return null;
        return await callAI(prompt, inst.agent.prompt_text || "Vendedor profesional", instanceId);
    } catch (e) { return null; }
}

startWorker().catch(e => {
    console.error('[FATAL] Fallo en Baileys Worker:', e.message);
    process.exit(1);
});
