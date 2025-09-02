import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente para uso no navegador
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente para uso no servidor (com permissões elevadas)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);
