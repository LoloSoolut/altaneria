
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    return window.process?.env?.[key] || (typeof process !== 'undefined' ? process.env[key] : '') || '';
  } catch {
    return '';
  }
};

// URL y Key por defecto o desde entorno
const supabaseUrl = getEnv('SUPABASE_URL') || 'https://hxpvgtlmjxmsrmaxfqag.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 20) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }) 
  : null;

if (!supabase) {
  console.warn("Supabase: Modo Local activo. Los cambios no se guardarán en la nube.");
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
