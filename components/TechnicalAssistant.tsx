
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { saveChatHistory } from '../supabase.ts';
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, ScrollText, Scale, ShieldAlert, Key, AlertCircle } from 'lucide-react';
import { APP_VERSION } from '../constants.ts';

const TechnicalAssistant: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const chatInstance = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Verificar si hay una clave seleccionada al montar el componente
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setNeedsKey(!hasKey);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setNeedsKey(false);
      // Forzar reinicio del chat con la nueva clave
      chatInstance.current = null;
    }
  };

  const systemInstruction = `Eres el "Asistente Técnico del Gabinete de Jueces" para COMPETICIONES DE ALTANERÍA PARA PROFESIONALES. 
  Tu función es resolver dudas REGLAMENTARIAS de forma tajante, técnica y profesional.

  REGLAMENTO TÉCNICO VIGENTE (v${APP_VERSION}):
  1. ALTURA: 0.1 puntos por cada metro de altura de servicio.
  2. POSICIÓN (SERVICIO): Puntuación máxima 15 pts hasta 30m. Disminuye progresivamente hasta 0 pts a los 160m.
  3. VELOCIDAD PICADO: Base 100km/h (0 pts). +1 punto por cada 10 km/h adicionales.
  4. VALORACIÓN PICADO: El juez puede penalizar de -0.5 a -5 puntos por falta de agresividad, calidad o estilo en el picado.
  5. REMONTADA: (Altura / Tiempo de Remontada en seg) * 60. Se puntúa si supera 20 m/min.
  6. CAPTURA: 
     - Limpia o Trabando: Altura / 12
     - Persecución Corta: Altura / 15
     - Persecución Larga: Altura / 18
     - Acuchilla: Altura / 40
     - Toca/Rinde: Altura / 50
  7. BONOS DE TIEMPO: 
     - Hasta 7:00 min: +6 pts
     - De 7:01 min a 8:00 min: +4 pts
     - De 8:01 min a 9:00 min: +2 pts
     - De 9:01 min en adelante: 0 pts
  8. PENALIZACIONES FIJAS: Señuelo encarnado (-4), Enseñar señuelo (-6), Suelta obligada (-10).
  9. DESCALIFICACIONES: Superar 10 min sin recoger, enseñar vivos, conducta antideportiva.

  Instrucciones de Respuesta:
  - Usa terminología cetrera (techos, servicio, trabar, acuchillar).
  - Sé conciso. No saludes, ve directo al dato.
  - Si no estás seguro, cita: "Remitirse al comité técnico de la federación".`;

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    const apiKey = process.env.API_KEY;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      // Creamos la instancia justo antes de usarla para asegurar que usa la clave actual
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      if (!chatInstance.current) {
        chatInstance.current = ai.chats.create({
          model: 'gemini-3-flash-preview', // Cambiado a Flash para mejor estabilidad en producción
          config: {
            systemInstruction: systemInstruction,
          },
        });
      }

      const response = await chatInstance.current.sendMessage({ message: userMsg });
      const aiText = response.text || 'Sin respuesta oficial registrada.';
      
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      await saveChatHistory('juez_oficial', userMsg, aiText);

    } catch (error: any) {
      console.error('Error IA:', error);
      chatInstance.current = null; // Reset para el próximo intento
      
      let errorMsg = 'ERROR DE CONEXIÓN: El gabinete técnico no responde.';
      
      if (error.message?.includes('Requested entity was not found') || error.message?.includes('API key')) {
        errorMsg = 'ERROR DE CREDENCIALES: Se requiere vincular una API Key de Google Cloud con facturación activa para operar en producción.';
        setNeedsKey(true);
      }

      setMessages(prev => [...prev, { role: 'ai', text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const QuickQuery = ({ text, onClick }: { text: string, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className="text-[9px] font-black uppercase tracking-tighter bg-gray-100 hover:bg-falcon-brown hover:text-white px-2 py-1 rounded-md transition-all border border-gray-200"
    >
      {text}
    </button>
  );

  return (
    <div className="bg-white rounded-[32px] shadow-professional border border-gray-100 flex flex-col h-[600px] overflow-hidden border-t-4 border-t-field-green relative">
      <div className="p-5 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-field-green rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-900/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-xs tracking-wider uppercase text-gray-800">Gabinete Consultivo</h3>
            <p className="text-[9px] font-bold text-field-green uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Sistema IA v{APP_VERSION}
            </p>
          </div>
        </div>
        <button 
          onClick={handleOpenKeySelector}
          className={`p-2 rounded-xl transition-all ${needsKey ? 'bg-red-50 text-red-600 animate-bounce' : 'text-gray-300 hover:bg-gray-50'}`}
          title="Configurar API Key"
        >
          <Key className="w-4 h-4" />
        </button>
      </div>

      {needsKey && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-red-600 text-white p-4 rounded-2xl shadow-2xl animate-in zoom-in-95">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">Requiere Configuración</p>
              <p className="text-[9px] font-medium leading-relaxed mb-3">Para usar la IA en modo profesional/explotación, debe vincular su propia clave de Google Cloud con facturación habilitada.</p>
              <button 
                onClick={handleOpenKeySelector}
                className="bg-white text-red-600 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all"
              >
                Vincular Clave Cloud
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-grow p-5 overflow-y-auto space-y-4 bg-gray-50/50 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-40">
            <Bot className="w-12 h-12 text-gray-300" />
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Gabinete Técnico IA</p>
              <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed italic">Resolución inmediata de dudas sobre el reglamento oficial de altanería.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 px-4">
              <QuickQuery text="¿Bono Tiempo?" onClick={() => { setInput("¿Cuáles son los tramos de bonificación por tiempo?"); }} />
              <QuickQuery text="¿Captura?" onClick={() => { setInput("Diferencia de puntos entre Trabar y Acuchillar"); }} />
              <QuickQuery text="¿Descalificar?" onClick={() => { setInput("Causas de descalificación directa"); }} />
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-field-green text-white rounded-tr-none font-medium' 
                : 'bg-white border-l-4 border-l-falcon-brown text-gray-800 rounded-tl-none border border-gray-100'
            }`}>
              <div className={`flex items-center gap-1.5 mb-1.5 text-[8px] font-black uppercase tracking-[0.2em] ${m.role === 'user' ? 'text-white/60' : 'text-falcon-brown'}`}>
                {m.role === 'user' ? <User className="w-2.5 h-2.5" /> : <ShieldAlert className="w-2.5 h-2.5" />}
                {m.role === 'user' ? 'Juez de Campo' : 'Gabinete Técnico'}
              </div>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-field-green rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-field-green rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-field-green rounded-full animate-bounce delay-150"></span>
              </div>
              <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Consultando Reglamento...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={needsKey ? "Vincule su clave para preguntar..." : "Consulte al experto técnico..."}
            disabled={needsKey}
            className="flex-grow px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-field-green/20 border-2 border-transparent focus:border-field-green/10 transition text-sm font-medium disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping || needsKey}
            className="w-14 h-14 bg-field-green text-white rounded-2xl hover:bg-green-800 transition-all disabled:opacity-50 shadow-lg shadow-green-900/20 flex items-center justify-center active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {needsKey && (
          <p className="text-[8px] text-red-500 font-black uppercase tracking-widest text-center mt-3 cursor-pointer" onClick={handleOpenKeySelector}>
            Haga clic en el icono de llave para configurar la API KEY
          </p>
        )}
      </div>
    </div>
  );
};

export default TechnicalAssistant;
