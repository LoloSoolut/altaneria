
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.39.0';

/**
 * Función auxiliar para obtener variables de entorno de forma segura en el navegador.
 * Evita el error "process is not defined" que bloquea el renderizado.
 */
const safeGetEnv = (key: string): string | undefined => {
  try {
    return process.env[key];
  } catch (e) {
    return undefined;
  }
};

const supabaseUrl = safeGetEnv('SUPABASE_URL') || 'https://hxpvgtlmjxmsrmaxfqag.supabase.co';
const supabaseAnonKey = safeGetEnv('SUPABASE_ANON_KEY');

/**
 * Inicialización protegida del cliente de Supabase.
 */
export const supabase = (
  typeof supabaseUrl === 'string' && 
  supabaseUrl.trim().length > 10 && 
  typeof supabaseAnonKey === 'string' && 
  supabaseAnonKey.trim().length > 10
) ? createClient(supabaseUrl, supabaseAnonKey) : null;

/**
 * Función para guardar el historial de chats con Gemini en Supabase.
 */
export async function saveChatHistory(userId: string, userMessage: string, aiResponse: string) {
  if (!supabase) {
    console.warn('Supabase no configurado: Operando en modo local.');
    return { data: null, error: new Error('Supabase no configurado') };
  }

  try {
    const { data, error } = await supabase
      .from('historial_chats')
      .insert([
        { 
          usuario_id: userId, 
          mensaje_usuario: userMessage, 
          respuesta_ia: aiResponse 
        }
      ]);
    
    if (error) console.error('Error Supabase:', error.message);
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
