import { createClient } from '@supabase/supabase-js';

// Vite requiere el prefijo VITE_ para exponer variables al cliente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.error("❌ ERROR CRÍTICO: VITE_SUPABASE_URL no detectada o es inválida.");
}

if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
  console.error("❌ ERROR CRÍTICO: VITE_SUPABASE_ANON_KEY no detectada.");
}

// Inicialización del cliente
export const supabase = createClient(
  supabaseUrl || 'https://missing-url.supabase.co', 
  supabaseAnonKey || 'missing-key'
);