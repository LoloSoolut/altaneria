import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  const value = (window as any).process?.env?.[key];
  if (value) return value.trim();
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Verificación más flexible: Las claves modernas pueden empezar por sb_publishable_ o ser JWTs (eyJ...)
const isValidKey = (key: string) => {
  return key && (key.length > 20 || key.startsWith('sb_'));
};

const initSupabase = () => {
  if (!supabaseUrl || !isValidKey(supabaseAnonKey)) {
    console.error("❌ ERROR DE CONFIGURACIÓN: No se detectaron credenciales válidas en index.html.");
    console.info("💡 URL detectada:", supabaseUrl || "VACÍA");
    console.info("💡 Key detectada (primeros 5 caracteres):", supabaseAnonKey ? supabaseAnonKey.substring(0, 5) + "..." : "VACÍA");
    return null;
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey);
    console.log("✅ SISTEMA CONECTADO: Sincronización activa con Supabase.");
    return client;
  } catch (err) {
    console.error("❌ ERROR AL CREAR CLIENTE SUPABASE:", err);
    return null;
  }
};

export const supabase = initSupabase();

export async function saveChatHistory(userId: string, userMessage: string, aiResponse: string) {
  if (!supabase) return { data: null, error: "Supabase no conectado" };
  try {
    const { data, error } = await supabase
      .from('historial_chats')
      .insert([{ usuario_id: userId, mensaje_usuario: userMessage, respuesta_ia: aiResponse }]);
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}