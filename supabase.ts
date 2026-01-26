
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.39.0';

/**
 * Intenta obtener valores de entorno sin romper la ejecución si 'process' no existe.
 */
const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    return (window.process?.env?.[key] || "");
  } catch (e) {
    return "";
  }
};

const supabaseUrl = getEnv('SUPABASE_URL') || 'https://hxpvgtlmjxmsrmaxfqag.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

/**
 * Inicialización segura. Si no hay clave, 'supabase' será null y App.tsx usará localStorage.
 */
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 20) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn("Supabase: No se detectaron credenciales válidas. Iniciando en MODO LOCAL.");
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
