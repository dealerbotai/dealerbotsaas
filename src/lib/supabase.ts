import { createClient } from '@supabase/supabase-js';

// Using the provided Supabase credentials for the project
const SUPABASE_URL = "https://mnlqbmpbyybsfxtjjalb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubHFibXBieXlic2Z4dGpqYWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjI3NzIsImV4cCI6MjA4ODkzODc3Mn0.yq9_PFpCapgL0bFCsu5X8JEZMNdaImD7nCAl5OsYTL0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);