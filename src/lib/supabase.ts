import { createClient } from '@supabase/supabase-js';

// Intentamos obtener las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si faltan las variables, usamos valores temporales para evitar que la app se rompa al cargar,
// pero mostramos un error claro en la consola.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERROR: Faltan las credenciales de Supabase en los Secrets.");
  console.info("Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY configurados.");
}

// Solo inicializamos si tenemos una URL válida para evitar el error de .trim()
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);