
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { saveChatHistory } from '../supabase';
import { MessageSquare, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

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
      // Inicialización siguiendo las guías oficiales de Google GenAI
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: `Eres un experto técnico en competiciones de Altanería (Caza con halcones). 
          Ayudas a los jueces a interpretar el reglamento oficial. 
          Puntos clave del reglamento:
          - Altura de servicio: 0.1 pts por cada metro de altura.
          - Picado: +1 pt por cada 10km/h que exceda los 100km/h.
          - Remontada: (Altura / TiempoVuelo) * 60.
          - Penalizaciones: Señuelo encarnado (-4), Enseñar señuelo (-6), Suelta obligada (-10).
          Tu tono debe ser profesional, conciso y técnico.`,
        },
      });

      const aiText = response.text || 'No he podido procesar la consulta técnica en este momento.';
      
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      
      // Intentar guardar en historial si Supabase está activo
      try {
        await saveChatHistory('juez_oficial', userMsg, aiText);
      } catch (e) {
        console.debug('Historial no guardado (modo local activo)');
      }

    } catch (error) {
      console.error('Error IA:', error);
      setMessages(prev => [...prev, { role: 'ai', text: 'El servicio de asistencia técnica no está disponible. Verifique la configuración de la API_KEY en el servidor.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[500px]">
      <div className="p-4 border-b bg-falcon-brown text-white rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-bold">Asistente Técnico IA</h3>
        </div>
        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
      </div>

      <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Consulta dudas sobre el reglamento o cálculos técnicos aquí.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-field-green text-white rounded-tr-none' 
                : 'bg-white border text-gray-700 shadow-sm rounded-tl-none'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-70 text-[10px] font-bold uppercase">
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
            placeholder="Ej: ¿Cómo se puntúa la captura limpia?"
            className="flex-grow px-4 py-2 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-field-green transition text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className="p-2 bg-field-green text-white rounded-xl hover:bg-green-700 transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechnicalAssistant;
