import { createClient } from '@supabase/supabase-js';

// Vite solo expone variables que empiezan con VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log de diagnóstico (solo visible en la consola del navegador)
if (!supabaseUrl) {
  console.warn("⚠️ VITE_SUPABASE_URL está vacía. Usando fallback de error.");
} else {
  console.log("✅ VITE_SUPABASE_URL detectada correctamente.");
}

// Inicialización del cliente con valores de fallback claros
export const supabase = createClient(
  supabaseUrl || 'https://missing-url-check-secrets.supabase.co', 
  supabaseAnonKey || 'missing-key-check-secrets'
);