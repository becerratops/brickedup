import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
  const configured = Boolean(supabaseUrl && supabaseAnonKey);
  console.log('🔧 Supabase configuration check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    configured
  });
  return configured;
}

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false },
    })
  : (undefined as unknown as ReturnType<typeof createClient>);

if (isSupabaseConfigured()) {
  console.log('✅ Supabase client created successfully');
} else {
  console.warn('⚠️ Supabase not configured - running in local-only mode');
}


