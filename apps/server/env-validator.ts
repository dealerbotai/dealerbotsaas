import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = fs.existsSync(path.join(__dirname, '.env')) 
  ? path.join(__dirname, '.env') 
  : path.join(__dirname, '../.env');

dotenv.config({ path: envPath });

const envSchema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL debe ser una URL válida"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY no puede estar vacío"),
  GROQ_API_KEY: z.string().optional(), // o requerida si depende totalmente de Groq
  PORT: z.string().optional().default("3000")
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    logger.error('ENV_VALIDATION', 'Faltan variables de entorno requeridas o son inválidas:');
    parsed.error.errors.forEach(err => {
      logger.error('ENV_VALIDATION', `  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  
  return parsed.data;
}

// Ejecutar automáticamente al importar si es necesario
export const env = validateEnv();
