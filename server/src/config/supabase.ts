import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? '';

if (!supabaseUrl || !supabaseKey) {
  console.error('[ERRO CRÍTICO] Configure SUPABASE_URL e SUPABASE_SECRET_KEY no arquivo .env.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
