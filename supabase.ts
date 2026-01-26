
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.39.0';

// Usamos la URL proporcionada como fallback si la variable de entorno no está definida.
// La clave ANON_KEY debe seguir viniendo de process.env por seguridad.
const supabaseUrl = process.env.SUPABASE_URL || 'https://hxpvgtlmjxmsrmaxfqag.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

/**
 * Inicialización segura del cliente.
 * Evita llamar a createClient si la URL o la Key son inválidas, lo que previene el error 
 * "Uncaught Error: supabaseUrl is required".
 */
export const supabase = (
  typeof supabaseUrl === 'string' && 
  supabaseUrl.trim().length > 0 && 
  typeof supabaseAnonKey === 'string' && 
  supabaseAnonKey.trim().length > 0
) ? createClient(supabaseUrl, supabaseAnonKey) : null;

/**
 * Función para guardar el historial de chats con Gemini en Supabase.
 * @param userId Identificador del usuario (Juez).
 * @param userMessage Pregunta enviada a la IA.
 * @param aiResponse Respuesta generada por Gemini.
 */
export async function saveChatHistory(userId: string, userMessage: string, aiResponse: string) {
  if (!supabase) {
    console.warn('Supabase no está configurado correctamente (faltan variables de entorno). El historial no se guardará en la nube.');
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
    
    if (error) {
      console.error('Error de Supabase al guardar historial:', error.message);
    }
    return { data, error };
  } catch (err) {
    console.error('Error inesperado al intentar guardar en historial_chats:', err);
    return { data: null, error: err };
  }
}
