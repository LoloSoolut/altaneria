
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { saveChatHistory } from '../supabase.ts';
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, ScrollText, Scale, ShieldAlert } from 'lucide-react';

const TechnicalAssistant: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Referencia para mantener la instancia del chat y su historial
  const chatInstance = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const systemInstruction = `Eres el "Asistente Técnico del Gabinete de Jueces" para COMPETICIONES DE ALTANERÍA PARA PROFESIONALES. 
  Tu función es resolver dudas REGLAMENTARIAS de forma tajante, técnica y profesional.

  REGLAMENTO TÉCNICO VIGENTE (v1.3.3):
  1. ALTURA: 0.1 puntos por cada metro de altura de servicio.
  2. POSICIÓN (SERVICIO): Puntuación máxima 15 pts hasta 30m. Disminuye progresivamente hasta 0 pts a los 160m.
  3. VELOCIDAD PICADO: Base 100km/h (0 pts). +1 punto por cada 10 km/h adicionales.
  4. VALORACIÓN PICADO (NUEVA): El juez puede penalizar de -0.5 a -5 puntos por falta de agresividad, calidad o estilo en el picado.
  5. REMONTADA: (Altura / Tiempo de vuelo en seg) * 60. Se puntúa si supera 20 m/min.
  6. CAPTURA: 
     - Limpia o Trabando: Altura / 12
     - Persecución Corta: Altura / 15
     - Persecución Larga: Altura / 18
     - Acuchilla: Altura / 40
     - Toca/Rinde: Altura / 50
  7. BONOS DE TIEMPO: 
     - < 5 min: +6 pts
     - 5:00 a 5:59: +4 pts
     - 6:00 a 6:59: +2 pts
  8. PENALIZACIONES FIJAS: Señuelo encarnado (-4), Enseñar señuelo (-6), Suelta obligada (-10).
  9. DESCALIFICACIONES: Superar 10 min sin recoger, enseñar vivos, conducta antideportiva o no comparecer (2 avisos + 1 min).

  Instrucciones de Respuesta:
  - Usa terminología cetrera (techos, servicio, trabar, acuchillar).
  - Sé conciso. No saludes en cada respuesta, ve directo al dato reglamentario.
  - Si no estás seguro, cita: "Remitirse al comité técnico de la federación".`;

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Inicializar chat si no existe
      if (!chatInstance.current) {
        chatInstance.current = ai.chats.create({
          model: 'gemini-3-pro-preview',
          config: {
            systemInstruction: systemInstruction,
          },
        });
      }

      const response = await chatInstance.current.sendMessage({ message: userMsg });
      const aiText = response.text || 'Sin respuesta oficial registrada.';
      
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      
      // Persistencia en Supabase
      await saveChatHistory('juez_oficial', userMsg, aiText);

    } catch (error) {
      console.error('Error IA:', error);
      // Reset chat instance on fatal error to allow retry
      chatInstance.current = null;
      setMessages(prev => [...prev, { role: 'ai', text: 'ERROR DE CONEXIÓN: El gabinete técnico no puede responder. Reinicie la consulta.' }]);
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
    <div className="bg-white rounded-[32px] shadow-professional border border-gray-100 flex flex-col h-[580px] overflow-hidden border-t-4 border-t-field-green">
      <div className="p-5 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-field-green rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-900/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-xs tracking-wider uppercase text-gray-800">Gabinete Consultivo</h3>
            <p className="text-[9px] font-bold text-field-green uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Sistema IA Activo
            </p>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-field-green/30" />
      </div>

      <div ref={scrollRef} className="flex-grow p-5 overflow-y-auto space-y-4 bg-gray-50/50 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-40">
            <Bot className="w-12 h-12 text-gray-300" />
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Reglamento Técnico Profesional</p>
              <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed italic">Consulte cualquier duda sobre penalizaciones por picado, bonos o descalificaciones.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 px-4">
              <QuickQuery text="¿Picado Juez?" onClick={() => { setInput("¿Cómo funciona la valoración del juez en el picado?"); }} />
              <QuickQuery text="¿Bono Tiempo?" onClick={() => { setInput("¿Cuáles son los tramos de bonificación por tiempo?"); }} />
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
              <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Verificando Reglamento...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.03)]">
        <div className="flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Consulte al experto técnico..."
            className="flex-grow px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-field-green/20 border-2 border-transparent focus:border-field-green/10 transition text-sm font-medium"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className="w-14 h-14 bg-field-green text-white rounded-2xl hover:bg-green-800 transition-all disabled:opacity-50 shadow-lg shadow-green-900/20 flex items-center justify-center active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechnicalAssistant;
