
import { createClient } from '@supabase/supabase-js';

/**
 * Acceso seguro a variables de entorno inyectadas.
 */
const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    return window.process?.env?.[key] || (typeof process !== 'undefined' ? process.env[key] : '') || '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnv('SUPABASE_URL') || 'https://hxpvgtlmjxmsrmaxfqag.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Solo inicializamos si tenemos una clave válida de longitud suficiente
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 20) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.info("Supabase: Iniciando en MODO LOCAL (Sin persistencia en la nube).");
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
