import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { saveChatHistory } from '../supabase.ts';
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, ScrollText } from 'lucide-react';

const TechnicalAssistant: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      // Directiva: Usar process.env.API_KEY directamente según lineamientos
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: userMsg,
        config: {
          systemInstruction: `Eres el Asistente Técnico Oficial de COMPETICIONES DE ALTANERÍA PARA PROFESIONALES. 
          Tu objetivo es proporcionar interpretaciones exactas y profesionales del reglamento técnico.
          REGLAS CLAVE:
          - Altura: 0.1 puntos por cada metro de altura de servicio.
          - Picado: +1 punto por cada 10 km/h que excedan los 100 km/h.
          - Remontada: (Altura / Tiempo de vuelo en segundos) * 60. Se puntúa sobre una base de 20 m/min.
          - Penalizaciones: Señuelo encarnado (-4 pts), Enseñar señuelo (-6 pts), Suelta obligada (-10 pts).
          - Captura: Los puntos dependen del tipo y la altura (ej. Limpia/Trabando = Altura / 12).
          Mantén un tono de autoridad técnica, serio y conciso.`,
        },
      });

      const aiText = response.text || 'Sin respuesta.';
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      
      // Persistencia opcional en Supabase
      await saveChatHistory('juez_oficial', userMsg, aiText);

    } catch (error) {
      console.error('Error IA:', error);
      setMessages(prev => [...prev, { role: 'ai', text: 'El servicio técnico de IA no está disponible en este momento. Verifique su configuración de API.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-professional border border-gray-100 flex flex-col h-[520px] overflow-hidden">
      <div className="p-4 border-b bg-field-green text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-bold text-sm tracking-wide uppercase">Consultoría Técnica</h3>
        </div>
        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
      </div>

      <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50/30">
        {messages.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-10" />
            <p className="text-xs font-semibold px-4">Consulte dudas sobre puntuaciones, penalizaciones o descalificaciones según el reglamento profesional.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-field-green text-white rounded-tr-none' 
                : 'bg-white border-l-4 border-l-falcon-brown text-gray-800 rounded-tl-none border-t border-r border-b border-gray-100'
            }`}>
              <div className="flex items-center gap-1.5 mb-1 opacity-60 text-[9px] font-black uppercase tracking-widest">
                {m.role === 'user' ? 'Juez Principal' : 'Gabinete Técnico'}
              </div>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-field-green animate-spin" />
              <span className="text-[10px] text-gray-400 font-bold uppercase animate-pulse">Analizando Reglamento...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-50">
        <div className="flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ej: ¿Penalización por enseñar señuelo?"
            className="flex-grow px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-field-green border border-transparent focus:border-field-green transition text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className="px-4 bg-field-green text-white rounded-xl hover:bg-green-800 transition disabled:opacity-50 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechnicalAssistant;