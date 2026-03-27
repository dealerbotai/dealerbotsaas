import makeWASocket, { 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    Browsers,
    jidNormalizedUser,
    proto
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { useSupabaseAuth } from './auth.js';

/**
 * WhatsAppClient - Clase modular para manejar la conexión de Baileys
 */
export default class WhatsAppClient {
    constructor(supabase, options = {}) {
        this.supabase = supabase;
        this.instanceId = options.instanceId || 'default';
        this.name = options.name || 'Bot';
        
        // REQUERIMIENTO: Pino correctamente importado e inicializado
        this.logger = pino({ 
            level: 'debug', 
            transport: {
                target: 'pino-pretty',
                options: { colorize: true, translateTime: 'HH:MM:ss Z' }
            }
        });
        
        this.sock = null;
        this.onEvent = options.onEvent || (() => {});
    }

    /**
     * Iniciar conexión - Sin dependencias de navegador
     */
    async connect() {
        this.logger.info(`🔌 Intentando conectar instancia "${this.name}" (ID: ${this.instanceId})...`);

        // REQUERIMIENTO: Sesión desde Supabase, no local
        const { state, saveCreds } = await useSupabaseAuth(this.supabase, this.instanceId);
        const { version } = await fetchLatestBaileysVersion();

        this.sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true, // REQUERIMIENTO: Mostrar QR en terminal
            browser: Browsers.ubuntu('Chrome'),
            logger: this.logger,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 25000,
            markOnlineOnConnect: true,
            defaultQueryTimeoutMs: 60000
        });

        // 1. Vincular evento de guardado automático de credenciales
        this.sock.ev.on('creds.update', saveCreds);

        // 2. Gestionar eventos de conexión y reconexión automática
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.onEvent('qr', { qr });
                this.logger.debug(`📱 Nuevo QR generado para vincular: ${this.name}`);
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error instanceof Boom)?.output?.statusCode;
                // REQUERIMIENTO: Manejo de reconexión automática
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                this.logger.warn(`⚠️ Conexión cerrada. Status: ${statusCode}. Reconectando: ${shouldReconnect}`);
                
                if (shouldReconnect) {
                    setTimeout(() => this.connect(), 5000);
                } else {
                    this.onEvent('expired', { message: 'Logged out' });
                    // Limpiar vestigios de sesión en Supabase si se desconectó voluntariamente
                    this.supabase.from('whatsapp_sessions').delete().eq('id', this.instanceId).then();
                }
            } else if (connection === 'open') {
                const phoneNumber = jidNormalizedUser(this.sock.user.id).split('@')[0];
                this.logger.info(`✅ Sesión "Open" para ${this.name} (+${phoneNumber})`);
                this.onEvent('ready', { phoneNumber });
            }
        });

        // 3. Gestionar entrada de mensajes (REQUERIMIENTO: Messages Upsert)
        this.sock.ev.on('messages.upsert', (m) => {
            if (m.type !== 'notify') return;
            
            for (const msg of m.messages) {
                if (msg.key.fromMe) continue; // No responder a uno mismo
                
                const jid = msg.key.remoteJid;
                if (jid.endsWith('@g.us')) continue; // Ignorar grupos

                const body = msg.message?.conversation || 
                             msg.message?.extendedTextMessage?.text || 
                             msg.message?.imageMessage?.caption;

                if (!body) continue;

                this.logger.debug(`📩 Mensaje de ${jid}: ${body}`);
                this.onEvent('message', { jid, body, msg, pushname: msg.pushName });
            }
        });

        return this.sock;
    }

    /**
     * Enviar mensaje de texto
     */
    async sendMessage(jid, text, quoted = null) {
        if (!this.sock) throw new Error('Cliente no conectado');
        return await this.sock.sendMessage(jid, { text }, { quoted });
    }
}
