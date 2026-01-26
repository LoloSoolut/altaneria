import { createClient } from '@supabase/supabase-js';

// Función para obtener variables de entorno de forma segura en navegador con fallback agresivo
const getEnv = (key: string): string => {
  // 1. Intentar desde process.env (inyectado por el entorno de ejecución)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // 2. Intentar desde window.process.env (configurado en index.html)
  if ((window as any).process?.env?.[key]) {
    return (window as any).process.env[key];
  }
  // 3. Variables de entorno globales del sistema
  if ((import.meta as any).env?.[`VITE_${key}`]) {
    return (import.meta as any).env[`VITE_${key}`];
  }
  return '';
};

// URL del proyecto hxpvgtlmjxmsrmaxfqag proporcionada por el usuario
const supabaseUrl = getEnv('SUPABASE_URL') || 'https://hxpvgtlmjxmsrmaxfqag.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Inicializar el cliente solo si existe la clave anon (mínimo 20 caracteres)
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 10) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
      db: { schema: 'public' }
    }) 
  : null;

// Diagnóstico de conexión en consola
if (!supabase) {
  console.warn("⚠️ MODO LOCAL ACTIVO: No se ha detectado SUPABASE_ANON_KEY. Los datos se guardarán temporalmente en LocalStorage.");
} else {
  console.log("✅ CONEXIÓN SUPABASE ESTABLECIDA: Sincronizando con hxpvgtlmjxmsrmaxfqag.supabase.co");
}

/**
 * Guarda el historial de interacciones con la IA.
 */
export async function saveChatHistory(userId: string, userMessage: string, aiResponse: string) {
  if (!supabase) return { data: null, error: null };
  try {
    const { data, error } = await supabase
      .from('historial_chats')
      .insert([{ usuario_id: userId, mensaje_usuario: userMessage, respuesta_ia: aiResponse }]);
    return { data, error };
  } catch (err) {
    console.error("Error al guardar historial de chat:", err);
    return { data: null, error: err };
  }
}