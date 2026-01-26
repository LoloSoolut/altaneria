
import { createClient } from '@supabase/supabase-js';

// Intentar obtener las variables desde process.env o window.process.env
const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  if ((window as any).process?.env?.[key]) {
    return (window as any).process.env[key];
  }
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL') || 'https://hxpvgtlmjxmsrmaxfqag.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Solo inicializar si tenemos la clave anon
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 10) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn("⚠️ SUPABASE OFFLINE: No se detectó la clave de API. Los cambios se guardarán solo localmente.");
} else {
  console.log("✅ SUPABASE ONLINE: Conectado al proyecto hxpvgtlmjxmsrmaxfqag.");
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
