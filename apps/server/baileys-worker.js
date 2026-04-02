import { parentPort, workerData } from 'worker_threads';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

import WhatsAppClient from './services/whatsapp/client.js';
import { getMessageContext } from './middleware/context-router.js';
import { groqChat } from './services/ai/groq-client.js';
import { logger } from './utils/logger.js';

// Comandos
import { handleInicio } from './commands/inicio.js';
import { handleCierre } from './commands/cierre.js';
import { handleCancelar } from './commands/cancelar.js';
import { handleVenta } from './commands/venta.js';
import { handleVincular } from './commands/vincular.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = fs.existsSync(path.join(__dirname, '.env')) 
  ? path.join(__dirname, '.env') 
  : path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

const { id, name, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = workerData;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let client = null;

async function startWorker() {
    logger.worker(id, `Iniciando motor para ${name}...`);
    
    client = new WhatsAppClient(supabase, {
        instanceId: id,
        name: name,
        onEvent: async (type, data) => {
            switch (type) {
                case 'qr':
                    logger.worker(id, `QR generado, enviando al servidor principal...`);
                    parentPort.postMessage({ type: 'qr', qr: data.qr });
                    break;
                case 'ready':
                    logger.worker(id, `Motor listo para operar (${data.phoneNumber})`, 'success');
                    parentPort.postMessage({ type: 'ready', phoneNumber: data.phoneNumber });
                    break;
                case 'expired':
                    logger.worker(id, `Sesión de WhatsApp expirada`, 'error');
                    parentPort.postMessage({ type: 'expired', message: data.message });
                    break;
            }
        }
    });

    try {
        await client.connect();
    } catch (err) {
        logger.worker(id, `Error conectando motor: ${err.message}`, 'error');
        throw err;
    }

    client.sock.ev.on('messages.upsert', async (upsert) => {
        if (upsert.type !== 'notify') return;
        
        for (const msg of upsert.messages) {
            if (msg.key.fromMe) continue;
            
            try {
                const jid = msg.key.remoteJid;
                const body = msg.message?.conversation || 
                             msg.message?.extendedTextMessage?.text || 
                             msg.message?.imageMessage?.caption;

                if (!body) continue;

                logger.bot(name, 'in', `${msg.pushName || jid}: ${body.substring(0, 50)}${body.length > 50 ? '...' : ''}`);

                // 1. Identificar Contexto e Identificar si el Canal está Autorizado
                const context = await getMessageContext(supabase, id, jid);
                if (!context) continue;

                // 2. Procesar Comandos Administrativos (Incluso en canales no vinculados aún)
                if (body.startsWith('.vincular_canal')) {
                    logger.worker(id, `Ejecutando comando administrativo: .vincular_canal`);
                    const args = body.slice(16).trim().split(/ +/);
                    const response = await handleVincular(supabase, id, jid, args);
                    await client.sendMessage(jid, response, msg);
                    continue;
                }

                // 3. Lógica para Canales de Control (Comandos .)
                if (context.type === 'CONTROL_CHANNEL') {
                    if (!context.isAuthorized) continue; 

                    if (body.startsWith('.')) {
                        const args = body.slice(1).trim().split(/ +/);
                        const command = args.shift().toLowerCase();
                        let response = "";

                        logger.worker(id, `Comando de control detectado: .${command}`);
                        const aiService = (u, s) => getAIResponseFromRouter(supabase, id, u, s);

                        if (command === 'inicio') {
                            response = await handleInicio(supabase, context, aiService);
                        } else if (command === 'cierre') {
                            response = await handleCierre(supabase, context, aiService);
                        } else if (command === 'cancelar') {
                            response = await handleCancelar(supabase, context, args);
                        } else if (command === 'venta') {
                            response = await handleVenta(supabase, context, body, jid);
                        }

                        if (response) {
                            await client.sendMessage(jid, response, msg);
                            logger.bot(name, 'out', `Respuesta a comando !${command}`);
                        }
                    }
                    continue; 
                }

                // 4. Ignorar otros grupos no vinculados
                if (context.type === 'UNAUTHORIZED_GROUP') continue;

                // 5. REGISTRAR MENSAJE (Siempre, esté el bot activo o no)
                const pushName = msg.pushName || jid.split('@')[0];
                
                // Buscar o crear chat
                const { data: chat } = await supabase
                    .from('chats')
                    .upsert({
                        instance_id: id,
                        external_id: jid,
                        customer_name: pushName,
                        last_message_at: new Date().toISOString()
                    }, { onConflict: 'instance_id,external_id' })
                    .select()
                    .single();

                if (chat) {
                    await supabase.from('messages').insert({
                        chat_id: chat.id,
                        sender_name: pushName,
                        content: body,
                        from_me: false,
                        type: 'text'
                    });

                    // Notificar a la UI
                    parentPort.postMessage({
                        type: 'message',
                        message: { from: jid, body, pushname: pushName, chat_id: chat.id, to: id }
                    });
                }

                // 6. Lógica para respuesta de la IA (Solo si el bot está activo)
                const { data: instStatus } = await supabase.from('instances').select('bot_enabled, bot_mode').eq('id', id).single();
                
                if (!instStatus?.bot_enabled || instStatus?.bot_mode !== 'BOT_ACTIVE') {
                    continue;
                }

                logger.worker(id, `Solicitando respuesta IA para: ${pushName}`);
                const aiReply = await getAIResponse(body, id, jid);
                
                if (aiReply) {
                    await client.sendMessage(jid, aiReply, msg);
                    logger.bot(name, 'out', `Respuesta IA a ${pushName}`);
                    
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
                        to: jid
                    });
                }

            } catch (e) {
                logger.worker(id, `Error procesando mensaje de ${msg.key.remoteJid}: ${e.message}`, 'error');
            }
        }
    });

    parentPort.on('message', async (cmd) => {
        try {
            if (cmd.type === 'send-message' && cmd.to && cmd.text) {
                await client.sendMessage(cmd.to, cmd.text);
                logger.bot(name, 'out', `Mensaje manual enviado a ${cmd.to}`);
            }
            
            if (cmd.type === 'get-groups') {
                try {
                    const sock = client?.sock;
                    if (!sock || !sock.ws || sock.ws.readyState !== 1) {
                        logger.worker(id, `Solicitud de grupos fallida: Conexión no activa (ReadyState: ${sock?.ws?.readyState || 'N/A'})`, 'warn');
                        parentPort.postMessage({ type: 'groups-list', groups: [] });
                        return;
                    }
                    logger.worker(id, `Sincronizando lista de grupos...`);
                    const groups = await sock.groupFetchAllParticipating();
                    const groupList = Object.values(groups).map(g => ({
                        id: g.id,
                        subject: g.subject
                    }));
                    logger.worker(id, `Grupos sincronizados: ${groupList.length}`, 'success');
                    parentPort.postMessage({ type: 'groups-list', groups: groupList });
                } catch (err) {
                    logger.worker(id, `Error sincronizando grupos: ${err.message}`, 'error');
                    parentPort.postMessage({ type: 'groups-list', groups: [] });
                }
            }
        } catch (e) {
            logger.worker(id, `Error en comando worker: ${e.message}`, 'error');
        }
    });
}

/**
 * Función auxiliar para obtener respuesta de la IA para clientes
 */
async function getAIResponse(prompt, instanceId, remoteJid) {
    const systemPrompt = "Eres un asistente de ventas atento."; // Simplificado
    return await getAIResponseFromRouter(supabase, instanceId, prompt, systemPrompt);
}

startWorker().catch(e => {
    logger.error('WORKER_FATAL', `Fallo crítico en hilo principal: ${e.message}`, e);
    process.exit(1);
});