import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    // Intenta obtener de window.process.env (inyectado por index.html) o del entorno de compilación
    const value = (window as any).process?.env?.[key] || (typeof process !== 'undefined' ? process.env?.[key] : '');
    return typeof value === 'string' ? value : '';
  } catch {
    return '';
  }
};

// URL y Key
const supabaseUrl = getEnv('SUPABASE_URL') || 'https://hxpvgtlmjxmsrmaxfqag.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Crear cliente solo si la clave es válida
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 10) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }) 
  : null;

if (!supabase) {
  console.warn("⚠️ SUPABASE OFFLINE: No se detectó SUPABASE_ANON_KEY. El sistema funcionará en MODO LOCAL.");
} else {
  console.log("🚀 SUPABASE ONLINE: Conexión establecida con éxito.");
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