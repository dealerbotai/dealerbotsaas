import makeWASocket, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers,
    jidNormalizedUser,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { useSupabaseAuthStore } from './auth.js';

/**
 * WhatsAppClient Wrapper (Baileys Headless)
 * Arquitectura Pro: Sin Chromium | RAM < 150MB | Cloud-ready
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
        this.onEvent = options.onEvent || (() => { });
    }

    /**
     * Iniciar conexión (Stateless)
     */
    async connect() {
        this.logger.info(`🔌 Intentando conectar instancia "${this.name}" (ID: ${this.instanceId})...`);

        // REQUERIMIENTO: Cero archivos locales. Leer/Escribir en whatsapp_sessions de Supabase.
        const { state, saveCreds } = await useSupabaseAuthStore(this.supabase, this.instanceId);
        const { version } = await fetchLatestBaileysVersion();

        this.sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true, // REQUERIMIENTO: QR en consola
            browser: Browsers.ubuntu('Chrome'),
            logger: this.logger,
            connectTimeoutMs: 120000, // 120s rescue timeout for Windows/Cloud
            keepAliveIntervalMs: 30000,
            markOnlineOnConnect: true,
            defaultQueryTimeoutMs: 120000
        });

        // 1. Vincular evento de guardado automático de credenciales
        this.sock.ev.on('creds.update', saveCreds);

        // 2. Gestionar eventos de conexión y reconexión automática en Render
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.onEvent('qr', { qr });
                this.logger.debug(`📱 Nuevo QR generado para vincular: ${this.name}`);
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error instanceof Boom)?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                this.logger.warn(`⚠️ Socket cerrado. Status: ${statusCode}. Reconectando: ${shouldReconnect}`);

                if (shouldReconnect) {
                    setTimeout(() => this.connect(), 5000); // 5s de respiro antes de reconexión
                } else {
                    this.onEvent('expired', { message: 'Sesión finalizada manualmente.' });
                    // Limpieza opcional de sesión en la base de datos
                    this.supabase.from('whatsapp_sessions').delete().eq('id', this.instanceId).then();
                }
            } else if (connection === 'open') {
                const phoneNumber = jidNormalizedUser(this.sock.user.id).split('@')[0];
                this.logger.info(`✅ [ESTADO] Conectado exitosamente (+${phoneNumber})`);
                this.onEvent('ready', { phoneNumber });
            }
        });

        // 3. Gestionar entrada de mensajes (Upsert)
        this.sock.ev.on('messages.upsert', (m) => {
            if (m.type !== 'notify') return;

            for (const msg of m.messages) {
                if (msg.key.fromMe) continue;
                const jid = msg.key.remoteJid;
                if (jid.endsWith('@g.us')) continue; // Saltar grupos

                const body = msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text ||
                    msg.message?.imageMessage?.caption;

                if (!body) continue;

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
