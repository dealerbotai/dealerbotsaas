import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import products endpoint
app.post('/api/import-products', async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        error: 'No se proporcionaron productos para importar' 
      });
    }

    // Get workspace ID from session or request
    const workspaceId = req.session?.workspaceId || 
                       req.headers['x-workspace-id'] || 
                       'default';

    let importedCount = 0;
    const errors = [];

    for (const product of products) {
      try {
        // Check if product already exists
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('name', product.name)
          .eq('store_id', workspaceId)
          .single();

        if (existing) {
          // Update existing product
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
          // Insert new product
          const { error } = await supabase
            .from('products')
            .insert({
              name: product.name,
              description: product.description,
              price: product.price,
              image_base64: product.image_base64 || null,
              store_id: workspaceId,
              is_active: true,
              created_at: new Date().toISOString()
            });

          if (error) throw error;
        }
        
        importedCount++;
      } catch (error) {
        console.error(`Error importing product ${product.name}:`, error);
        errors.push({ name: product.name, error: error.message });
      }
    }

    res.json({
      success: true,
      imported: importedCount,
      errors: errors.length,
      errorDetails: errors
    });

  } catch (error) {
    console.error('Error in import-products endpoint:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});

export default app;