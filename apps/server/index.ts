import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger.js';
import { stripeService } from './services/stripe.js';

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
const workers = new Map<string, Worker>();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY!
);

// Middleware
app.use(cors());

// Webhook endpoint MUST use express.raw for signature verification before JSON processing
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req: express.Request, res: express.Response) => {
  const sig = req.headers['stripe-signature'] as string;
  
  try {
    const event = await stripeService.handleWebhook(sig, req.body);
    res.json({received: true, type: event.type});
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Plan Usage Validation Middleware
const checkPlanLimits = async (req: Request, res: Response, next: NextFunction) => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) return next();

  try {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('plan')
      .eq('id', workspaceId)
      .single();

    if (workspace?.plan === 'free') {
      const resourceType = req.path.split('/')[2]; // e.g., 'instances', 'agents', 'stores'
      
      const { count } = await supabase
        .from(resourceType)
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      if (count && count >= 1) {
        res.status(403).json({ 
          error: `Límite del plan gratuito alcanzado. El plan Gratis solo permite 1 ${resourceType.slice(0,-1)}. Por favor actualiza tu plan.` 
        });
        return;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// Import products endpoint with plan limit check
app.post('/api/import-products', checkPlanLimits, async (req: Request, res: Response) => {
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
      } catch (error: any) {
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

  } catch (error: any) {
    logger.error('DATABASE', `Error crítico en importación: ${error.message}`, error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Billing Endpoints
app.post('/api/billing/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { workspaceId, priceId, successUrl, cancelUrl } = req.body;
    const session = await stripeService.createCheckoutSession(workspaceId, priceId, successUrl, cancelUrl);
    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/billing/create-portal-session', async (req: Request, res: Response) => {
  try {
    const { workspaceId, returnUrl } = req.body;
    const session = await stripeService.createPortalSession(workspaceId, returnUrl);
    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), activeWorkers: workers.size });
});

// Function to start a worker
async function startInstanceWorker(instanceId: string, name: string) {
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

        const workerFile = platform === 'messenger' ? 'messenger-worker.ts' : 'baileys-worker.ts';

        const worker = new Worker(path.join(__dirname, workerFile), {
            // Soporte para cargar modulos TS dinamicamente si usamos tsx o ts-node workers, 
            // sino debemos usar .js despues de transpilar.
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

        worker.on('message', (msg: any) => {
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

        worker.on('error', (err: Error) => {
            logger.error('WORKER', `Fallo crítico en worker ${name}: ${err.message}`, err);
            io.to(`instance:${instanceId}`).emit('instance-status-update', { instanceId, status: 'disconnected', error: err.message });
        });

        worker.on('exit', (code: number) => {
            logger.info('WORKER', `Worker de ${name} finalizado (Código: ${code})`);
            workers.delete(instanceId);
            supabase.from('instances').update({ status: 'disconnected' }).eq('id', instanceId).then();
        });

        workers.set(instanceId, worker);
    } catch (error: any) {
        logger.error('WORKER', `Error al iniciar worker: ${error.message}`);
    }
}

// FB Messenger Webhook
app.get('/api/webhook/messenger', (req: Request, res: Response) => {
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

app.post('/api/webhook/messenger', async (req: Request, res: Response) => {
    const body = req.body;
    
    if (body.object === 'page') {
        body.entry.forEach(async (entry: any) => {
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
io.on('connection', (socket: Socket) => {
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
            instances.forEach((inst: any) => {
                startInstanceWorker(inst.id, inst.name);
            });
        } else {
            logger.info('INIT', 'No hay instancias activas para auto-iniciar.');
        }
    } catch (e: any) {
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
