import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger.js';
import { stripeService } from './services/stripe.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const workers = new Map();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
);

// Middleware
app.use(cors());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     summary: Stripe Webhook
 *     description: Recibe eventos en tiempo real desde Stripe (pagos, suscripciones, etc.).
 *     tags: [Billing]
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evento procesado correctamente
 *       400:
 *         description: Error en la firma o procesamiento del webhook
 */
// Webhook endpoint MUST use express.raw for signature verification before JSON processing
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = await stripeService.handleWebhook(sig, req.body);
    res.json({received: true, type: event.type});
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Plan Usage Validation Middleware (AHORA DECLARADO ANTES DE SER USADO)
const checkPlanLimits = async (req, res, next) => {
  const workspaceId = req.headers['x-workspace-id'];
  if (!workspaceId) return next();

  const limits = {
    free: { instances: 1, stores: 1, agents: 1, products: 50 },
    starter: { instances: 3, stores: 10, agents: 5, products: 500 },
    pro: { instances: 10, stores: 999, agents: 999, products: 10000 }
  };

  try {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('plan')
      .eq('id', workspaceId)
      .single();

    const currentPlan = workspace?.plan || 'free';
    const planLimits = limits[currentPlan];
    
    // Identificar el recurso basándose en la ruta
    let resourceType = req.path.split('/').pop(); 
    if (resourceType === 'import-products') resourceType = 'products';
    
    if (planLimits[resourceType]) {
      const { count } = await supabase
        .from(resourceType)
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      if (count >= planLimits[resourceType]) {
        return res.status(403).json({ 
          error: `Límite del plan ${currentPlan} alcanzado (${planLimits[resourceType]} ${resourceType}). Por favor actualiza tu plan para continuar.` 
        });
      }
    }
    next();
  } catch (error) {
    next();
  }
};

/**
 * @swagger
 * /api/import-products:
 *   post:
 *     summary: Importar Productos
 *     description: Permite sincronizar un catálogo de productos hacia el espacio de trabajo activo. Valida los límites del plan actual.
 *     tags: [Products]
 *     security:
 *       - WorkspaceIdAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               storeId:
 *                 type: string
 *                 description: ID de la tienda destino
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     stock:
 *                       type: number
 *     responses:
 *       200:
 *         description: Productos importados correctamente
 *       400:
 *         description: Datos inválidos o faltan productos
 *       403:
 *         description: Límite del plan excedido
 *       500:
 *         description: Error interno del servidor
 */
// Import products endpoint with plan limit check
app.post('/api/import-products', checkPlanLimits, async (req, res) => {
  try {
    const { products, storeId } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({ 
        error: 'No se proporcionaron productos para importar' 
      });
      return;
    }

    const workspaceId = req.headers['x-workspace-id'];
    
    if (!workspaceId || workspaceId === 'default') {
      res.status(400).json({ 
        error: 'ID de espacio de trabajo inválido o ausente' 
      });
      return;
    }

    logger.info('DATABASE', `Importando ${products.length} productos en workspace ${workspaceId}...`);

    let importedCount = 0;
    const errors = [];

    for (const product of products) {
      try {
        const is_active = product.status?.toLowerCase() === 'active' || product.is_active === true;
        
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .or(`handle.eq.${product.handle},name.eq.${product.name}`)
          .eq('workspace_id', workspaceId)
          .eq('store_id', storeId || null)
          .maybeSingle();

        const productData = {
          name: product.name,
          handle: product.handle || null,
          category: product.category || null,
          description: product.description,
          price: product.price,
          stock: parseInt(product.stock) || 0,
          image_url: product.image_url || null,
          image_base64: product.image_base64 || null,
          is_active: is_active,
          updated_at: new Date().toISOString()
        };

        if (existing) {
          const { error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existing.id);
          
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('products')
            .insert({
              ...productData,
              workspace_id: workspaceId,
              store_id: storeId || null,
              created_at: new Date().toISOString()
            });

          if (error) throw error;
        }
        
        importedCount++;
      } catch (error) {
        logger.error('DATABASE', `Error importando producto ${product.name}: ${error.message}`);
        errors.push({ name: product.name, error: error.message });
      }
    }

    logger.success('DATABASE', `Importación finalizada: ${importedCount} exitosos, ${errors.length} fallidos`);
    res.json({
      success: true,
      imported: importedCount,
      errors: errors.length,
      errorDetails: errors
    });

  } catch (error) {
    logger.error('DATABASE', `Error crítico en importación: ${error.message}`, error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Billing Endpoints
app.post('/api/billing/create-checkout-session', async (req, res) => {
  try {
    const { workspaceId, priceId, successUrl, cancelUrl } = req.body;
    const session = await stripeService.createCheckoutSession(workspaceId, priceId, successUrl, cancelUrl);
    res.json({ id: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/billing/create-portal-session:
 *   post:
 *     summary: Crear Portal de Cliente
 *     description: Genera una URL segura para que el cliente gestione su suscripción en Stripe.
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workspaceId:
 *                 type: string
 *               returnUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Devuelve la URL del portal de cliente
 *       500:
 *         description: Error al comunicarse con Stripe
 */
app.post('/api/billing/create-portal-session', async (req, res) => {
  try {
    const { workspaceId, returnUrl } = req.body;
    const session = await stripeService.createPortalSession(workspaceId, returnUrl);
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), activeWorkers: workers.size });
});

// Function to start a worker
async function startInstanceWorker(instanceId, name) {
    if (workers.has(instanceId)) {
        logger.warn('WORKER', `La instancia ${name} (${instanceId}) ya tiene un worker activo.`);
        return;
    }

    try {
        const { data: instance } = await supabase
            .from('instances')
            .select('*')
            .eq('id', instanceId)
            .single();

        if (!instance) {
            logger.error('WORKER', `Instancia ${instanceId} no encontrada en DB.`);
            return;
        }

        const platform = instance.platform || 'whatsapp';
        logger.info('WORKER', `Iniciando nuevo nodo para: ${name} en plataforma: ${platform}`);

        const workerFile = platform === 'messenger' ? 'messenger-worker.js' : 'baileys-worker.js';

        const worker = new Worker(path.join(__dirname, workerFile), {
            execArgv: process.env.NODE_ENV === 'development' ? ['--import', 'tsx'] : [],
            workerData: {
                id: instanceId,
                name: name,
                SUPABASE_URL: process.env.SUPABASE_URL,
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
                external_id: instance.external_id,
                access_token: instance.access_token
            }
        });

        worker.on('message', (msg) => {
            io.to(`instance:${instanceId}`).emit(msg.type, { ...msg, instanceId });

            if (msg.type === 'message' || msg.type === 'bot-reply') {
                io.to(`instance:${instanceId}`).emit('message-update', { 
                    instanceId,
                    message: {
                        from: msg.from,
                        body: msg.body || msg.reply,
                        pushname: msg.pushname || 'Bot',
                        chat_id: msg.chat_id,
                        from_me: msg.type === 'bot-reply'
                    }
                });
                io.to(`instance:${instanceId}`).emit('instance-log', {
                    level: msg.type === 'message' ? 'bot-in' : 'bot-out',
                    message: msg.body || msg.reply,
                    context: msg.pushname || 'Platform',
                    timestamp: new Date().toISOString()
                });
            }

            if (msg.type === 'ready') {
                logger.success('WORKER', `Instancia conectada correctamente: ${name} (${msg.phoneNumber})`);
                supabase.from('instances').update({ 
                    status: 'connected', 
                    phone_number: msg.phoneNumber,
                    last_connected_at: new Date().toISOString()
                }).eq('id', instanceId).then();
            } else if (msg.type === 'qr') {
                logger.info('WORKER', `Nuevo QR generado para: ${name}`);
                io.to(`instance:${instanceId}`).emit('qr', { instanceId, qr: msg.qr });
                io.emit('qr', { instanceId, qr: msg.qr });
                supabase.from('instances').update({ status: 'qr_ready' }).eq('id', instanceId).then();
            } else if (msg.type === 'expired') {
                logger.warn('WORKER', `Sesión expirada para: ${name}`);
                supabase.from('instances').update({ status: 'expired' }).eq('id', instanceId).then();
            }
        });

        worker.on('error', (err) => {
            logger.error('WORKER', `Fallo crítico en worker ${name}: ${err.message}`, err);
            io.to(`instance:${instanceId}`).emit('instance-status-update', { instanceId, status: 'disconnected', error: err.message });
        });

        worker.on('exit', (code) => {
            logger.info('WORKER', `Worker de ${name} finalizado (Código: ${code})`);
            workers.delete(instanceId);
            supabase.from('instances').update({ status: 'disconnected' }).eq('id', instanceId).then();
        });

        workers.set(instanceId, worker);
    } catch (error) {
        logger.error('WORKER', `Error al iniciar worker: ${error.message}`);
    }
}

// FB Messenger Webhook
app.get('/api/webhook/messenger', (req, res) => {
    const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'salesbot_secret_token';
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            logger.success('WEBHOOK', 'Webhook de Facebook verificado correctamente');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

/**
 * @swagger
 * /api/webhook/messenger:
 *   post:
 *     summary: Recibir Eventos de Messenger
 *     description: Endpoint que recibe los mensajes y eventos de las páginas de Facebook conectadas.
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               object:
 *                 type: string
 *               entry:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Evento recibido exitosamente (EVENT_RECEIVED)
 *       404:
 *         description: Formato de evento no soportado
 */
app.post('/api/webhook/messenger', async (req, res) => {
    const body = req.body;
    
    if (body.object === 'page') {
        body.entry.forEach(async (entry) => {
            const pageId = entry.id; 
            const webhookEvent = entry.messaging[0];
            
            const senderId = webhookEvent.sender.id;
            
            if (webhookEvent.message && webhookEvent.message.text) {
                const { data: instances } = await supabase
                    .from('instances')
                    .select('id')
                    .eq('platform', 'messenger')
                    .eq('external_id', pageId)
                    .eq('status', 'connected');

                if (instances && instances.length > 0) {
                    const instanceId = instances[0].id;
                    const worker = workers.get(instanceId);
                    
                    if (worker) {
                        worker.postMessage({
                            type: 'messenger-event',
                            payload: {
                                senderId: senderId,
                                messageText: webhookEvent.message.text,
                                timestamp: webhookEvent.timestamp
                            }
                        });
                    }
                }
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Socket.io logic
io.on('connection', (socket) => {
    logger.info('SOCKET', `Nuevo cliente conectado: ${socket.id}`);

    socket.on('register-instance', ({ instanceId }) => {
        socket.join(`instance:${instanceId}`);
        logger.info('SOCKET', `Cliente ${socket.id} registrado en instancia: ${instanceId}`);
    });

    socket.on('start-instance', ({ instanceId, name }) => {
        startInstanceWorker(instanceId, name);
    });

    socket.on('stop-instance', ({ instanceId }) => {
        logger.info('SOCKET', `Solicitud de detención para instancia: ${instanceId}`);
        const worker = workers.get(instanceId);
        if (worker) {
            worker.terminate();
            workers.delete(instanceId);
            logger.success('WORKER', `Worker detenido para instancia: ${instanceId}`);
        }
    });

    socket.on('delete-instance', async ({ instanceId }) => {
        logger.warn('SOCKET', `Eliminando instancia y archivos de sesión: ${instanceId}`);
        
        const worker = workers.get(instanceId);
        if (worker) {
            worker.terminate();
            workers.delete(instanceId);
        }

        io.emit('instance-deleted', { instanceId });
    });

    socket.on('send-message', ({ instanceId, to, text }) => {
        logger.socket(socket.id, 'send-message', { to, text: text.substring(0, 30) + '...' });
        const worker = workers.get(instanceId);
        if (worker) {
            worker.postMessage({ type: 'send-message', to, text });
        }
    });

    socket.on('request-groups', ({ instanceId }) => {
        logger.info('SOCKET', `Solicitud de grupos para instancia: ${instanceId}`);
        const worker = workers.get(instanceId);
        if (worker) {
            worker.postMessage({ type: 'get-groups' });
        } else {
            logger.error('SOCKET', `No se encontró worker activo para la instancia: ${instanceId}`);
        }
    });

    socket.on('disconnect', () => {
        logger.info('SOCKET', `Cliente desconectado: ${socket.id}`);
    });
});

// Auto-start active instances
const initActiveInstances = async () => {
    try {
        const { data: instances } = await supabase
            .from('instances')
            .select('*')
            .eq('status', 'connected');
        
        if (instances && instances.length > 0) {
            logger.info('INIT', `Auto-iniciando ${instances.length} instancias activas...`);
            instances.forEach((inst) => {
                startInstanceWorker(inst.id, inst.name);
            });
        } else {
            logger.info('INIT', 'No hay instancias activas para auto-iniciar.');
        }
    } catch (e) {
        logger.error('INIT', `Error en auto-inicio: ${e.message}`);
    }
};

// Start server
httpServer.listen(PORT, () => {
  console.log('\n' + '═'.repeat(50));
  logger.success('SERVER', `DEALERBOT AI ENGINE ACTIVO`);
  logger.info('SERVER', `Puerto: ${PORT}`);
  logger.info('SERVER', `Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log('═'.repeat(50) + '\n');
  initActiveInstances();
});

export default app;
