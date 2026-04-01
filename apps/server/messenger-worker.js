import { parentPort, workerData } from 'worker_threads';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import axios from 'axios';

import { getAIResponse as getAIResponseFromRouter } from './services/ai/ai-router.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = fs.existsSync(path.join(__dirname, '.env')) 
  ? path.join(__dirname, '.env') 
  : path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

const { id, name, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, external_id, access_token } = workerData;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function startWorker() {
    logger.worker(id, `Iniciando motor Messenger para ${name}...`);
    
    // Notificamos que está listo (en Messenger no hay QR ni conexión socket persistente desde nuestra perspectiva)
    parentPort.postMessage({ type: 'ready', phoneNumber: `Page: ${name}` });

    parentPort.on('message', async (msg) => {
        try {
            if (msg.type === 'messenger-event') {
                const { senderId, messageText, timestamp } = msg.payload;

                logger.bot(name, 'in', `${senderId}: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`);

                // 1. REGISTRAR MENSAJE (Siempre)
                // Buscar o crear chat
                const { data: chat } = await supabase
                    .from('chats')
                    .upsert({
                        instance_id: id,
                        external_id: senderId,
                        customer_name: 'Usuario FB ' + senderId, // Lo ideal sería obtener el nombre de la Graph API
                        last_message_at: new Date(timestamp || Date.now()).toISOString()
                    }, { onConflict: 'instance_id,external_id' })
                    .select()
                    .single();

                if (chat) {
                    await supabase.from('messages').insert({
                        chat_id: chat.id,
                        sender_name: 'Usuario FB',
                        content: messageText,
                        from_me: false,
                        type: 'text'
                    });

                    // Notificar a la UI
                    parentPort.postMessage({
                        type: 'message',
                        message: { from: senderId, body: messageText, pushname: 'Usuario FB', chat_id: chat.id, to: id }
                    });
                }

                // 2. Lógica para respuesta de la IA (Solo si el bot está activo)
                const { data: instStatus } = await supabase.from('instances').select('bot_enabled, bot_mode').eq('id', id).single();
                
                if (!instStatus?.bot_enabled || instStatus?.bot_mode !== 'BOT_ACTIVE') {
                    return;
                }

                logger.worker(id, `Solicitando respuesta IA para: ${senderId}`);
                const aiReply = await getAIResponse(messageText, id, senderId);
                
                if (aiReply) {
                    await sendMessengerMessage(senderId, aiReply);
                    logger.bot(name, 'out', `Respuesta IA a ${senderId}`);
                    
                    if (chat) {
                        await supabase.from('messages').insert({
                            chat_id: chat.id,
                            sender_name: 'AI Assistant',
                            content: aiReply,
                            from_me: true,
                            type: 'bot'
                        });
                    }

                    parentPort.postMessage({
                        type: 'bot-reply',
                        reply: aiReply,
                        chat_id: chat?.id,
                        to: senderId
                    });
                }
            } else if (cmd.type === 'send-message' && cmd.to && cmd.text) {
                await sendMessengerMessage(cmd.to, cmd.text);
                logger.bot(name, 'out', `Mensaje manual enviado a ${cmd.to}`);
            }
        } catch (e) {
            logger.worker(id, `Error procesando mensaje: ${e.message}`, 'error');
        }
    });
}

/**
 * Función para enviar mensaje mediante Graph API
 */
async function sendMessengerMessage(recipientId, text) {
    if (!access_token) {
        throw new Error('No hay access_token configurado para esta instancia de Messenger');
    }
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${access_token}`;
    const payload = {
        recipient: { id: recipientId },
        message: { text: text }
    };
    await axios.post(url, payload);
}

/**
 * Función auxiliar para obtener respuesta de la IA
 */
async function getAIResponse(prompt, instanceId, remoteJid) {
    const systemPrompt = "Eres un asistente de ventas atento para Facebook Messenger."; 
    return await getAIResponseFromRouter(supabase, instanceId, prompt, systemPrompt);
}

startWorker().catch(e => {
    logger.error('WORKER_FATAL', `Fallo crítico en hilo principal: ${e.message}`, e);
    process.exit(1);
});
