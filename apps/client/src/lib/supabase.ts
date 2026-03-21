import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Supabase URL or Anon Key is missing in environment variables');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_PUBLISHABLE_KEY || '');