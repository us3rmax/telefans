import { createClient } from '@supabase/supabase-js';

// Essas variáveis devem ser configuradas na Vercel/Netlify ou no seu arquivo .env local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL ou Anon Key não configuradas. Verifique suas variáveis de ambiente.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
