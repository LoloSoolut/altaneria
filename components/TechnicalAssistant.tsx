
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { saveChatHistory } from '../supabase';
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';

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

  // Función para obtener la API_KEY de forma segura
  const getSafeApiKey = (): string => {
    try {
      // @ts-ignore
      return window.process?.env?.API_KEY || (typeof process !== 'undefined' ? process.env.API_KEY : '') || '';
    } catch {
      return '';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const apiKey = getSafeApiKey();
    if (!apiKey) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'Error: La API_KEY no está configurada. Por favor, añádela en los ajustes de Vercel como "API_KEY".' 
      }]);
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: `Eres un experto técnico en competiciones de Altanería (Caza con halcones). 
          Ayudas a los jueces a interpretar el reglamento oficial. 
          Puntos clave:
          - Altura: 0.1 pts/metro.
          - Picado: +1 pt cada 10km/h extra (>100km/h).
          - Remontada: (Altura / Tiempo) * 60.
          - Penalizaciones fijas: Señuelo encarnado (-4), Enseñar señuelo (-6), Suelta obligada (-10).
          Sé conciso y profesional.`,
        },
      });

      const aiText = response.text || 'Sin respuesta.';
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      
      await saveChatHistory('juez_oficial', userMsg, aiText);

    } catch (error) {
      console.error('Error IA:', error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Error de conexión con el asistente. Revisa la consola.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[500px]">
      <div className="p-4 border-b bg-falcon-brown text-white rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-bold text-sm">Asistente Técnico IA</h3>
        </div>
        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
      </div>

      <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-xs font-medium">Consulta dudas sobre el reglamento oficial aquí.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-field-green text-white rounded-tr-none' 
                : 'bg-white border text-gray-700 rounded-tl-none'
            }`}>
              <div className="flex items-center gap-1.5 mb-1 opacity-60 text-[9px] font-black uppercase tracking-wider">
                {m.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                {m.role === 'user' ? 'Juez' : 'Soporte Técnico'}
              </div>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border p-3 rounded-2xl rounded-tl-none shadow-sm">
              <Loader2 className="w-4 h-4 text-field-green animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Duda técnica..."
            className="flex-grow px-3 py-2 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-field-green transition text-[13px]"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className="p-2 bg-field-green text-white rounded-xl hover:bg-green-700 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechnicalAssistant;
