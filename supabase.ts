
import { createClient } from '@supabase/supabase-js';

// Detector universal de variables de entorno
const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key] as string;
  if ((window as any).process?.env?.[key]) return (window as any).process.env[key];
  if ((import.meta as any).env?.[`VITE_${key}`]) return (import.meta as any).env[`VITE_${key}`];
  return '';
};

// URL del proyecto hxpvgtlmjxmsrmaxfqag
const supabaseUrl = getEnv('SUPABASE_URL') || 'https://hxpvgtlmjxmsrmaxfqag.supabase.co';
// Probamos con varios nombres comunes de la clave anon
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || getEnv('SUPABASE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 10) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true },
      db: { schema: 'public' }
    }) 
  : null;

if (!supabase) {
  console.warn("⚠️ SISTEMA EN MODO LOCAL: No se detectó SUPABASE_ANON_KEY. Los datos no se sincronizarán con la nube.");
} else {
  console.log("✅ CONECTADO A SUPABASE: " + supabaseUrl);
}

export async function saveChatHistory(userId: string, userMessage: string, aiResponse: string) {
  if (!supabase) return { data: null, error: null };
  try {
    const { data, error } = await supabase
      .from('historial_chats')
      .insert([{ usuario_id: userId, mensaje_usuario: userMessage, respuesta_ia: aiResponse }]);
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
