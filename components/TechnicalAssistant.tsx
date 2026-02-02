
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { saveChatHistory } from '../supabase.ts';
import { MessageSquare, Send, Bot, User, Scale, ShieldAlert, Key, AlertCircle, RefreshCw, X } from 'lucide-react';
import { APP_VERSION } from '../constants.ts';

const TechnicalAssistant: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // We keep the history manually to support recreating the AI client/chat if needed
  const chatHistory = useRef<{ role: string, parts: { text: string }[] }[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleOpenKeySelector = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        setNeedsKey(false);
        setErrorDetails(null);
      } catch (err) {
        console.error("Error al abrir selector de claves:", err);
      }
    } else {
      window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
    }
  };

  const systemInstruction = `Eres el "Asistente Técnico del Gabinete de Jueces" para COMPETICIONES DE ALTANERÍA PARA PROFESIONALES. 
  Tu función es resolver dudas REGLAMENTARIAS de forma tajante, técnica y profesional.
  Usa el reglamento v${APP_VERSION}. No saludes. No divagues. Cita puntos exactos si es posible.
  Responde siempre en español. Si no sabes la respuesta basada en el reglamento, indica que se debe consultar al Juez Principal.`;

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    setErrorDetails(null);

    try {
      // 1. Check if we have a key or need one (Race condition management)
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!process.env.API_KEY && !hasKey) {
          setNeedsKey(true);
          throw new Error("Falta clave API profesional");
        }
      }

      // 2. Create a fresh instance right before the call as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // 3. Initialize chat with history
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.1, // Technical precision
        },
        history: chatHistory.current.length > 0 ? chatHistory.current : undefined
      });

      const response = await chat.sendMessage({ message: userMsg });
      const aiText = response.text || 'Sin respuesta oficial. Consulte el acta física.';
      
      // Update local message state
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      
      // Update chat history for next turn
      chatHistory.current = [
        ...chatHistory.current,
        { role: 'user', parts: [{ text: userMsg }] },
        { role: 'model', parts: [{ text: aiText }] }
      ];

      // Save to Supabase if available
      await saveChatHistory('juez_oficial', userMsg, aiText);

    } catch (error: any) {
      console.error('Error en el Gabinete Técnico:', error);
      
      let errorMsg = 'ERROR DE CONEXIÓN: El gabinete técnico no responde.';
      const errorStr = error.message || String(error);

      if (errorStr.includes('Requested entity was not found') || errorStr.includes('API key')) {
        errorMsg = 'ERROR DE CREDENCIALES: No se encuentra una clave válida.';
        setNeedsKey(true);
      } else if (errorStr.includes('quota')) {
        errorMsg = 'ERROR DE CUOTA: Se ha alcanzado el límite de consultas permitidas.';
      }

      setErrorDetails(errorStr);
      setMessages(prev => [...prev, { role: 'ai', text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-professional border border-gray-100 flex flex-col h-[650px] overflow-hidden border-t-8 border-t-field-green relative">
      {/* Header */}
      <div className="p-6 border-b bg-white flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-field-green rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-100">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-sm tracking-tighter uppercase text-gray-800">Gabinete Consultivo</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Reglamento Técnico Oficial v{APP_VERSION}
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleOpenKeySelector}
          className={`group flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${needsKey ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' : 'bg-gray-50 text-gray-400 hover:bg-field-green hover:text-white'}`}
          title="Configurar Clave API"
        >
          <Key className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase hidden sm:block">Clave API</span>
        </button>
      </div>

      {/* Key Selection Overlay */}
      {needsKey && (
        <div className="absolute inset-0 z-[40] bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white border-2 border-red-100 p-8 rounded-[40px] shadow-2xl max-w-sm text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black uppercase text-red-600 tracking-tight">Acceso Restringido</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Para utilizar el Gabinete de IA en producción, es obligatorio vincular una clave de <strong>Google Gemini</strong> con facturación activa.
              </p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={handleOpenKeySelector}
                className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" /> Vincular Clave Profesional
              </button>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-field-green transition-colors"
              >
                Ver Documentación de Facturación
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-6 bg-[#fafafa] custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 py-10">
            <div className="relative">
               <Bot className="w-16 h-16 text-gray-200" />
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-field-green rounded-full border-2 border-white"></div>
            </div>
            <div className="space-y-3 max-w-[280px]">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Consultoría Técnica v{APP_VERSION}</p>
              <p className="text-xs text-gray-400 leading-relaxed font-medium italic">
                Realice consultas específicas sobre el reglamento de Altanería, puntuaciones o penalizaciones técnicas.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
              {["¿Cómo se puntúa la captura trabando?", "¿Penaliza enseñar el señuelo?", "¿Cuándo se produce una descalificación?"].map((q, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setInput(q); }}
                  className="text-[10px] font-bold text-gray-400 hover:text-field-green hover:bg-white border border-transparent hover:border-field-green/20 p-3 rounded-xl transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[90%] p-5 rounded-[24px] text-sm leading-relaxed shadow-sm relative group ${
              m.role === 'user' 
                ? 'bg-field-green text-white rounded-tr-none' 
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none border-l-4 border-l-falcon-brown'
            }`}>
              <div className={`flex items-center gap-2 mb-3 text-[8px] font-black uppercase tracking-widest ${m.role === 'user' ? 'text-white/60' : 'text-falcon-brown/60'}`}>
                {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                {m.role === 'user' ? 'Juez de Campo' : 'Gabinete Técnico'}
              </div>
              <div className="font-medium whitespace-pre-wrap">{m.text}</div>
              
              {m.role === 'ai' && errorDetails && i === messages.length - 1 && (
                <div className="mt-4 pt-4 border-t border-red-50 text-[10px] text-red-300 font-mono break-all opacity-0 group-hover:opacity-100 transition-opacity">
                  Debug: {errorDetails}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-white border border-gray-100 p-5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-4">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-field-green rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-field-green rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-field-green rounded-full animate-bounce"></span>
              </div>
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Analizando Reglamento...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-100">
        <div className="flex gap-3 items-center">
          <div className="flex-grow relative">
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={needsKey ? "Se requiere clave para continuar..." : "Escriba su consulta técnica..."}
              className={`w-full pl-6 pr-12 py-5 bg-gray-50 rounded-[20px] outline-none border-2 transition-all text-sm font-semibold ${
                needsKey ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:border-field-green/20 focus:bg-white focus:ring-4 focus:ring-field-green/5'
              }`}
              disabled={isTyping || needsKey}
            />
            {input && (
              <button 
                onClick={() => setInput('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button 
            onClick={handleSend}
            disabled={isTyping || !input.trim() || needsKey}
            className={`w-16 h-16 rounded-[20px] flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              !input.trim() || isTyping || needsKey 
                ? 'bg-gray-100 text-gray-300 shadow-none' 
                : 'bg-field-green text-white shadow-green-900/20 hover:bg-green-800'
            }`}
          >
            {isTyping ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </div>
        <p className="text-center mt-4 text-[8px] font-black text-gray-300 uppercase tracking-widest">
          Soporte Inteligente para Jueces Profesionales — Soolut AI
        </p>
      </div>
    </div>
  );
};

export default TechnicalAssistant;
