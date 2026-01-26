
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.39.0';

const supabaseUrl = process.env.SUPABASE_URL || 'https://hxpvgtlmjxmsrmaxfqag.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

/**
 * Inicialización segura de Supabase.
 */
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 20) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.debug("Supabase: Operando en MODO LOCAL.");
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
