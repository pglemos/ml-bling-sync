import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set');
}

// Cliente para uso no navegador
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Cliente para uso no servidor (com permissões elevadas)
export const supabaseServer = supabaseServiceKey 
  ? createSupabaseClient(supabaseUrl, supabaseServiceKey)
  : supabase;

// Exportar função createClient para compatibilidade
export const createClient = (cookieStore?: any) => {
  if (cookieStore) {
    // Para uso em server components com cookies
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });
  }
  return supabase;
};
