
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { saveChatHistory } from '../supabase.ts';
import { MessageSquare, Send, Bot, User, Scale, ShieldAlert, Key, AlertCircle, RefreshCw } from 'lucide-react';
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

  // Verificar estado de la clave en producción
  useEffect(() => {
    const checkKeyStatus = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        // Si no hay API_KEY en el proceso Y no hay clave seleccionada, avisamos
        if (!process.env.API_KEY && !hasKey) {
          setNeedsKey(true);
        }
      }
    };
    checkKeyStatus();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        setNeedsKey(false);
        chatInstance.current = null; // Reiniciar para usar la nueva clave
      } catch (err) {
        console.error("Error al abrir selector de claves:", err);
      }
    } else {
      window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
    }
  };

  const systemInstruction = `Eres el "Asistente Técnico del Gabinete de Jueces" para COMPETICIONES DE ALTANERÍA PARA PROFESIONALES. 
  Tu función es resolver dudas REGLAMENTARIAS de forma tajante, técnica y profesional.
  Usa el reglamento v${APP_VERSION}. No saludes. No divagues. Cita puntos exactos si es posible.`;

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    // Priorizamos la clave inyectada por el entorno (Vercel)
    const apiKey = process.env.API_KEY;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      // Inicialización bajo demanda para capturar la clave más reciente
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      if (!chatInstance.current) {
        chatInstance.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.2, // Respuestas más precisas y técnicas
          },
        });
      }

      const response = await chatInstance.current.sendMessage({ message: userMsg });
      const aiText = response.text || 'Sin respuesta oficial. Consulte el acta física.';
      
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      await saveChatHistory('juez_produccion', userMsg, aiText);

    } catch (error: any) {
      console.error('Error Crítico IA:', error);
      chatInstance.current = null;
      
      let errorMsg = 'ERROR TÉCNICO: El gabinete no puede procesar la consulta en este momento.';
      
      // Manejo específico de errores de cuota o clave en Vercel
      if (error.message?.includes('API key') || error.message?.includes('403') || error.message?.includes('not found')) {
        errorMsg = 'ERROR DE CREDENCIALES: La clave de Vercel no es válida o ha expirado. Vincule una clave profesional para continuar.';
        setNeedsKey(true);
      }

      setMessages(prev => [...prev, { role: 'ai', text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-professional border border-gray-100 flex flex-col h-[600px] overflow-hidden border-t-4 border-t-field-green relative">
      <div className="p-5 border-b bg-white flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-field-green/10 rounded-xl flex items-center justify-center text-field-green">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-xs tracking-wider uppercase text-gray-800">Gabinete Consultivo</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              Modo Explotación v{APP_VERSION}
            </p>
          </div>
        </div>
        <button 
          onClick={handleOpenKeySelector}
          className={`p-2.5 rounded-xl transition-all ${needsKey ? 'bg-red-50 text-red-600 animate-pulse' : 'text-gray-300 hover:bg-gray-50'}`}
        >
          <Key className="w-4 h-4" />
        </button>
      </div>

      {needsKey && (
        <div className="absolute top-24 left-4 right-4 z-[30] bg-white border-2 border-red-100 p-5 rounded-[24px] shadow-2xl animate-in zoom-in-95">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase text-red-600 tracking-widest">Error de Conexión en Producción</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                El asistente requiere una clave de <strong>Google Cloud</strong> válida. Si eres el administrador, añádela en el panel de Vercel. Si eres juez, vincula tu clave profesional.
              </p>
              <button 
                onClick={handleOpenKeySelector}
                className="w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200 active:scale-95 transition-all"
              >
                Vincular Clave Cloud
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-4 bg-gray-50/50 no-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-30">
            <Bot className="w-14 h-14 text-gray-300" />
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Soporte Reglamentario</p>
              <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed italic">Consulte cualquier duda técnica sobre el reglamento de competición.</p>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-field-green text-white rounded-tr-none' 
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none border-l-4 border-l-falcon-brown'
            }`}>
              <div className={`flex items-center gap-2 mb-2 text-[8px] font-black uppercase tracking-widest ${m.role === 'user' ? 'text-white/50' : 'text-falcon-brown'}`}>
                {m.role === 'user' ? <User className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                {m.role === 'user' ? 'Juez de Campo' : 'Gabinete Técnico'}
              </div>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
              <RefreshCw className="w-3 h-3 text-field-green animate-spin" />
              <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Analizando Reglamento...</span>
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
            placeholder={needsKey ? "Falta clave de configuración..." : "Pregunte sobre el reglamento..."}
            className="flex-grow px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-field-green/20 border-2 border-transparent focus:border-field-green/10 transition text-sm font-medium"
            disabled={isTyping}
          />
          <button 
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="w-14 h-14 bg-field-green text-white rounded-2xl hover:bg-green-800 transition-all disabled:opacity-30 shadow-lg shadow-green-900/20 flex items-center justify-center active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechnicalAssistant;
