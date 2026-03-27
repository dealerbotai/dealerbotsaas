import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    Browsers,
    jidNormalizedUser
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';
import pino from 'pino';

// Configuración de Logging - Mantenlo en 'silent' para producción si quieres ahorrar RAM/CPU
const logger = pino({ level: 'info' });

/**
 * WhatsAppBaileysService - Migración a @whiskeysockets/baileys
 * Sin Chromium | RAM < 100MB | Arquitectura Modular
 */
export async function startWhatsAppInstance(instanceId) {
    const authPath = path.resolve(`./.baileys_auth_${instanceId}`);
    
    // useMultiFileAuthState: Gestiona la sesión de forma persistente en una carpeta local
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    
    // Obtener la versión más reciente de WhatsApp soportada
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true, // Requerimiento: Mostrar código QR en terminal
        browser: Browsers.ubuntu('Chrome'), // Identificación de navegador optimizada
        logger: pino({ level: 'silent' }) // Minimalista para ahorrar recursos
    });

    // Guardar credenciales cada vez que se actualizan
    sock.ev.on('creds.update', saveCreds);

    // --- MANEJO DE CONEXIÓN ---
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Se puede integrar con Socket.io aquí para enviar a la UI
            logger.info('Nuevo código QR generado. Escanea para vincular.');
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error instanceof Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            logger.warn(`Conexión cerrada. Status Code: ${statusCode}. Reconectando: ${shouldReconnect}`);

            // Optimización: Manejador de reconexión automática inteligente
            if (shouldReconnect) {
                startWhatsAppInstance(instanceId);
            } else {
                logger.error('Sesión cerrada permanentemente. Borrando carpeta de sesión...');
                fs.rmSync(authPath, { recursive: true, force: true });
            }
        } else if (connection === 'open') {
            logger.info('✅ Conexión establecida y sesión "open". Estamos online.');
        }
    });

    // --- LÓGICA DE MENSAJERÍA ---
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        // Requerimiento: Filtrar solo mensajes nuevos (notify)
        if (type !== 'notify') return;

        for (const msg of messages) {
            // Evitar responder a mensajes propios
            if (msg.key.fromMe) continue;
            
            const jid = msg.key.remoteJid;
            
            // Filtrar mensajes de grupos
            if (jid.endsWith('@g.us')) continue;

            // Extraer el cuerpo del mensaje de diferentes tipos posibles
            const body = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || 
                         msg.message?.imageMessage?.caption;

            if (!body) continue;

            logger.info(`Mensaje entrante de ${jid}: ${body}`);

            // --- ESPACIO PARA LÓGICA DE AGENTES DE IA ---
            /*
               AQUÍ INTEGRAS TU IA:
               1. Consultas a Supabase (Personality, contexto).
               2. Llamada a LLM (Groq, OpenAI, etc).
               3. Envío de respuesta.
               
               Ejemplo:
               const response = await myAIAgent.getResponse(body);
               if (response) {
                   await sock.sendMessage(jid, { text: response }, { quoted: msg });
               }
            */

           // Ejemplo: Simple Respuesta Automática (Eco)
           if (body.toLowerCase().includes('hola')) {
               await sock.sendMessage(jid, { text: '¡Hola! Soy un bot optimizado con Baileys. ¿En qué puedo ayudarte?' }, { quoted: msg });
           }
        }
    });

    return sock;
}

// Inicialización de ejemplo (Para correrlo solo: node baileys-script.js)
// startWhatsAppInstance('main-instance');
