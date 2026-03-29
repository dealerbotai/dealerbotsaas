import { parentPort, workerData } from 'worker_threads';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

import WhatsAppClient from './services/whatsapp/client.js';
import { decrypt } from './utils/crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = fs.existsSync(path.join(__dirname, '.env')) 
  ? path.join(__dirname, '.env') 
  : path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

const { id, name, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = workerData;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const chatCache = new Map();
const CACHE_TTL = 30000;

async function startWorker() {
    
    const client = new WhatsAppClient(supabase, {
        instanceId: id,
        name: name,
        onEvent: async (type, data) => {
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

    const sock = await client.connect();

    sock.ev.on('messages.upsert', async (upsert) => {
        if (upsert.type !== 'notify') return;
        
        for (const msg of upsert.messages) {
            if (msg.key.fromMe) continue;
            
            try {
                const jid = msg.key.remoteJid;
                if (jid.endsWith('@g.us')) continue;

                const body = msg.message?.conversation || 
                             msg.message?.extendedTextMessage?.text || 
                             msg.message?.imageMessage?.caption;

                if (!body) continue;
                const pushName = msg.pushName || jid.split('@')[0];

                let chatId = null;
                const cacheKey = `${id}:${jid}`;
                const cached = chatCache.get(cacheKey);

                if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
                    chatId = cached.id;
                } else {
                    const { data: chat, error } = await supabase
                        .from('chats')
                        .upsert({
                            instance_id: id,
                            external_id: jid,
                            customer_name: pushName,
                            last_message_at: new Date().toISOString()
                        }, { onConflict: 'instance_id,external_id' })
                        .select('id')
                        .single();
                    
                    if (error) throw new Error(`Upsert error: ${error.message}`);
                    chatId = chat.id;
                    chatCache.set(cacheKey, { id: chatId, timestamp: Date.now() });
                }

                if (!chatId) continue;

                const aiReply = await getAIResponse(body, id, jid, chatId);
                
                const messagesToInsert = [
                    { chat_id: chatId, sender_name: pushName, content: body, from_me: false, type: 'text' }
                ];

                if (aiReply) {
                    messagesToInsert.push({
                        chat_id: chatId, sender_name: 'SalesBot', content: aiReply, from_me: true, type: 'bot'
                    });
                }

                await supabase.from('messages').insert(messagesToInsert);

                parentPort.postMessage({
                    type: 'message',
                    message: { 
                        from: jid, 
                        body, 
                        pushname: pushName, 
                        to: sock.user.id, 
                        chat_id: chatId,
                        reply: aiReply || null
                    }
                });

                if (aiReply) {
                    await client.sendMessage(jid, aiReply, msg);
                    parentPort.postMessage({ type: 'bot-reply', reply: aiReply, to: jid });
                }

            } catch (e) {
                console.error(`⚠️ [WORKER] Error con ${msg.key.remoteJid}:`, e.message);
            }
        }
    });

    parentPort.on('message', async (cmd) => {
        try {
            if (cmd.type === 'send-message' && cmd.to && cmd.text) {
                await client.sendMessage(cmd.to, cmd.text);
            }
        } catch (e) {
            console.error('[WORKER] Error manual:', e.message);
        }
    });
}

async function callAI(userPrompt, systemPrompt, instanceId, chatHistory = "") {
    try {
        const { data: inst } = await supabase.from('instances').select('*').eq('id', instanceId).single();
        if (!inst || inst.status !== 'connected') return null;

        const { data: settings } = await supabase.from('settings').select('*').eq('workspace_id', inst.workspace_id).maybeSingle();
        if (!settings) return null;

        const groqKey = decrypt(settings.groq_api_key_encrypted) || process.env.GROQ_API_KEY;
        if (!groqKey) return null;

        // Lógica de filtrado por tienda
        let query = supabase.from('products')
            .select('name, price')
            .eq('workspace_id', inst.workspace_id)
            .eq('is_active', true);
        
        if (inst.store_id) {
            query = query.eq('store_id', inst.store_id);
        }

        const { data: products } = await query.limit(30);

        const catalog = products?.length > 0 ? products.map(p => `- ${p.name}: $${p.price}`).join('\n') : "Sin catálogo disponible.";
        const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
        
        const finalSystemPrompt = `${systemPrompt}\n\nCATÁLOGO DE PRODUCTOS:\n${catalog}\n\n` +
            `HISTORIAL DE CONVERSACIÓN:\n${chatHistory || "No hay mensajes previos."}\n\n` +
            `INSTRUCCIÓN: Usa el historial para dar seguimiento. Solo ofrece productos del catálogo listado arriba.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: groqModel,
                messages: [
                    { role: "system", content: finalSystemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7, max_tokens: 400
            })
        });

        if (!response.ok) return null;

        const d = await response.json();
        return d.choices?.[0]?.message?.content || null;

    } catch (e) { 
        console.error('❌ [IA] Error crítico:', e.message);
        return null; 
    }
}

async function getAIResponse(prompt, instanceId, remoteJid, chatId) {
    let chatContext = "";
    
    try {
        const { data: history } = await supabase
            .from('messages')
            .select('sender_name, content, from_me')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: false })
            .limit(6);

        if (history && history.length > 0) {
            chatContext = history.reverse().map(m => 
                `${m.from_me ? 'Asistente' : 'Cliente'}: ${m.content}`
            ).join('\n');
        }
    } catch (e) {}

    try {
        const { data: inst } = await supabase.from('instances')
            .select('*, agent:agents(*)')
            .eq('id', instanceId)
            .single();
        
        if (!inst || !inst.bot_enabled || !inst.agent) return null;
        
        return await callAI(prompt, inst.agent.prompt_text || "Asistente atento.", instanceId, chatContext);
    } catch (e) { 
        return null; 
    }
}

startWorker().catch(e => {
    process.exit(1);
});