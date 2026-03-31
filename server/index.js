import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapeProducts } from './services/scraper.js';
import { logger } from './utils/logger.js';

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Scrape products endpoint
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Se requiere una URL' });
    }

    logger.info('SCRAPER', `Iniciando escaneo de URL: ${url}`);
    const workspaceId = req.headers['x-workspace-id'] || 'default';
    const result = await scrapeProducts(url, workspaceId);
    logger.success('SCRAPER', `Escaneo completado: ${result.products?.length || 0} productos encontrados`);
    res.json(result);
  } catch (error) {
    logger.error('SCRAPER', `Error en endpoint de escaneo: ${error.message}`, error);
    res.status(500).json({ error: error.message });
  }
});

// Import products endpoint
app.post('/api/import-products', async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        error: 'No se proporcionaron productos para importar' 
      });
    }

    logger.info('DATABASE', `Importando ${products.length} productos...`);
    const workspaceId = req.headers['x-workspace-id'] || 'default';

    let importedCount = 0;
    const errors = [];

    for (const product of products) {
      try {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('name', product.name)
          .eq('workspace_id', workspaceId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('products')
            .update({
              description: product.description,
              price: product.price,
              image_base64: product.image_base64 || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('products')
            .insert({
              name: product.name,
              description: product.description,
              price: product.price,
              image_base64: product.image_base64 || null,
              workspace_id: workspaceId,
              is_active: true,
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), activeWorkers: workers.size });
});

// Function to start a worker
function startInstanceWorker(instanceId, name) {
    if (workers.has(instanceId)) {
        logger.warn('WORKER', `La instancia ${name} (${instanceId}) ya tiene un worker activo.`);
        return;
    }

    logger.info('WORKER', `Iniciando nuevo nodo para: ${name}`);

    const worker = new Worker(path.join(__dirname, 'baileys-worker.js'), {
        workerData: {
            id: instanceId,
            name: name,
            SUPABASE_URL: process.env.SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
        }
    });

    worker.on('message', (msg) => {
        // Enviar evento al socket room específico de la instancia
        io.to(`instance:${instanceId}`).emit(msg.type, { ...msg, instanceId });

        // Mapear eventos de mensaje para la actividad en tiempo real
        if (msg.type === 'message' || msg.type === 'bot-reply') {
            io.to(`instance:${instanceId}`).emit('message-update', { ...msg, instanceId });
        }

        // Actualizar estado en Supabase
        if (msg.type === 'ready') {
            logger.success('WORKER', `Instancia conectada correctamente: ${name} (${msg.phoneNumber})`);
            supabase.from('instances').update({ 
                status: 'connected', 
                phone_number: msg.phoneNumber,
                last_connected_at: new Date().toISOString()
            }).eq('id', instanceId).then();
        } else if (msg.type === 'qr') {
            logger.info('WORKER', `Nuevo QR generado para: ${name}`);
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
}

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
            instances.forEach(inst => {
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
