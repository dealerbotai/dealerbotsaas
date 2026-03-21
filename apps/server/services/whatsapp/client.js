import { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
    isJidBroadcast
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { logger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WhatsAppClient {
    constructor(supabase, options) {
        this.supabase = supabase;
        this.instanceId = options.instanceId;
        this.name = options.name;
        this.onEvent = options.onEvent || (() => {});
        this.sock = null;
        // Mover a la raíz del monorepo (3 niveles arriba desde services/whatsapp/)
        this.authPath = path.join(__dirname, `../../../../auth_info_baileys/${this.instanceId}`);
    }

    async connect() {
        const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        
        logger.info('WHATSAPP', `Iniciando instancia "${this.name}" con Baileys v${version.join('.')}${isLatest ? ' (Latest)' : ''}`);

        this.sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }), 
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
            },
            browser: Browsers.ubuntu('Desktop'),
            generateHighQualityLinkPreview: false,
            syncFullHistory: false,
            shouldIgnoreJid: (jid) => isJidBroadcast(jid)
        });

        this.sock.ev.on('creds.update', saveCreds);

        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                logger.info('WHATSAPP', `Nuevo QR generado para ${this.name}`);
                this.onEvent('qr', { qr });
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode || 
                                   lastDisconnect?.error?.data?.statusCode;
                
                // Si la conexión se cierra por cualquier motivo que no sea logout, reintentamos
                if (statusCode !== DisconnectReason.loggedOut) {
                    logger.warn('WHATSAPP', `Reconectando instancia ${this.name}...`);
                    setTimeout(() => this.connect(), 3000);
                } else {
                    this.onEvent('expired', { message: 'Sesión cerrada' });
                }
            } else if (connection === 'open') {
                const phoneNumber = this.sock.user.id.split(':')[0];
                this.onEvent('ready', { phoneNumber });
            }
        });

        return this.sock;
    }

    async sendMessage(jid, text, quoted = null) {
        if (!this.sock) throw new Error('Socket no disponible');
        
        // Uso de protocolo binario nativo para envío
        return await this.sock.sendMessage(jid, { 
            text: text.trim() 
        }, { 
            quoted,
            backgroundColor: '#000000',
            font: 1 
        });
    }

    terminate() {
        if (this.sock) {
            this.sock.ev.removeAllListeners();
            this.sock.end(new Error('Termination requested'));
            this.sock = null;
        }
    }
}

export default WhatsAppClient;
