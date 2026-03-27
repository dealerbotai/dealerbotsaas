import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeInMemoryStore,
    Browsers
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';
import pino from 'pino';

/**
 * WhatsAppService - Modular Baileys Service
 * Optimizada para bajo consumo de RAM (<100MB) y estabilidad.
 */
export default class WhatsAppService {
    constructor(instanceId, logger = null) {
        this.instanceId = instanceId;
        this.authPath = path.resolve(`./.baileys_auth_${instanceId}`);
        this.sock = null;
        this.logger = logger || pino({ level: 'info' });
        
        // Almacén en memoria para contactos y chats (opcional, consume RAM)
        // Se puede desactivar para minimizar consumo si no se necesita.
        this.store = makeInMemoryStore({}); 
    }

    async start() {
        const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        
        this.logger.info(`Usando Baileys v${version.join('.')} (Latest: ${isLatest})`);

        this.sock = makeWASocket({
            version,
            printQRInTerminal: true, // Requerimiento: Mostrar QR en terminal
            auth: state,
            browser: Browsers.ubuntu('Chrome'), // Evita ser detectado como bot genérico
            logger: this.logger,
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(
                    message.buttonsMessage ||
                    message.templateMessage ||
                    message.listMessage
                );
                if (requiresPatch) {
                    message = {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                ...message
                            }
                        }
                    };
                }
                return message;
            }
        });

        // Vincular el store al socket
        this.store?.bind(this.sock.ev);

        // --- MANEJO DE EVENTOS ---

        // 1. Connection Update (QR y Estado)
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                // Ya se imprime automáticamente por printQRInTerminal: true, 
                // pero aquí podrías emitirlo a un webhook o UI.
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                this.logger.error(`Conexión cerrada. Razón: ${lastDisconnect?.error}. Reconectando: ${shouldReconnect}`);
                
                // Reconexión automática
                if (shouldReconnect) {
                    this.start();
                } else {
                    this.logger.warn('Sesión cerrada permanentemente. Limpiando credenciales...');
                    fs.rmSync(this.authPath, { recursive: true, force: true });
                }
            } else if (connection === 'open') {
                this.logger.info('🚀 Conexión abierta con éxito');
                // NOTA: Aquí puedes notificar al proceso principal que el socket está listo.
            }
        });

        // 2. Credential Update
        this.sock.ev.on('creds.update', saveCreds);

        // 3. Messages Upsert (Mensajes Entrantes)
        this.sock.ev.on('messages.upsert', async (m) => {
            // Filtrar solo mensajes nuevos (notify)
            if (m.type !== 'notify') return;

            for (const msg of m.messages) {
                // Evitar mensajes propios
                if (msg.key.fromMe) continue;
                
                const jid = msg.key.remoteJid;
                
                // Evitar mensajes de grupos (opcional)
                if (jid.endsWith('@g.us')) continue;

                const body = msg.message?.conversation || 
                             msg.message?.extendedTextMessage?.text || 
                             msg.message?.imageMessage?.caption;

                if (!body) continue;

                this.logger.info(`Mensaje recibido de ${jid}: ${body}`);

                // --- INTEGRACIÓN DE AGENTE IA ---
                // Aquí es donde llamarías a tu lógica de IA:
                // const aiReply = await getAIResponse(body, this.instanceId, msg);
                // if (aiReply) {
                //     await this.sendMessage(jid, aiReply, msg);
                // }
                
                // Ejemplo de eco simple:
                // await this.sendMessage(jid, `Recibido: ${body}`, msg);
            }
        });
    }

    /**
     * Enviar un mensaje de texto con opción de citar el anterior
     */
    async sendMessage(jid, text, quoted = null) {
        if (!this.sock) throw new Error('Socket no inicializado');
        
        await this.sock.sendMessage(jid, { text }, { quoted });
    }
}
