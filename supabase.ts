import { createClient } from '@supabase/supabase-js';

// Función para obtener variables de entorno de forma segura en navegador
const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  if ((window as any).process?.env?.[key]) {
    return (window as any).process.env[key];
  }
  return '';
};

// URL y Key del proyecto hxpvgtlmjxmsrmaxfqag
const supabaseUrl = getEnv('SUPABASE_URL') || 'https://hxpvgtlmjxmsrmaxfqag.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Inicializar el cliente solo si existe la clave anon
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 10) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true },
      db: { schema: 'public' }
    }) 
  : null;

if (!supabase) {
  console.warn("⚠️ MODO LOCAL: No se detectó SUPABASE_ANON_KEY. Los datos se guardarán solo en este navegador.");
} else {
  console.log("✅ CONECTADO A SUPABASE: Proyecto hxpvgtlmjxmsrmaxfqag listo.");
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