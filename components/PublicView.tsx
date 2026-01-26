
import React, { useState, useEffect } from 'react';
import { AppState, FlightData, Championship } from '../types.ts';
// Fix: Added missing 'Timer' icon to the imports
import { Trophy, Medal, Search, X, Clock, Navigation, Zap, ArrowUpCircle, RefreshCw, Timer } from 'lucide-react';
import { SCORING, CAPTURA_LABELS } from '../constants.ts';
import { supabase } from '../supabase.ts';

interface Props {
  state: AppState;
}

const PublicView: React.FC<Props> = ({ state }) => {
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [currentChamp, setCurrentChamp] = useState<Championship | null>(
    state.championships.find(c => c.id === state.publicChampionshipId) || null
  );

  // Suscripción en tiempo real a cambios en la base de datos
  useEffect(() => {
    if (!supabase || !state.publicChampionshipId) return;

    const channel = supabase
      .channel('public-results')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'championships',
          filter: `id=eq.${state.publicChampionshipId}` 
        },
        (payload) => {
          console.log("Actualización en tiempo real recibida:", payload.new);
          setCurrentChamp(payload.new as Championship);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.publicChampionshipId]);

  if (!currentChamp) {
    return (
      <div className="text-center py-24 animate-pulse">
        <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-2xl font-bold text-gray-400 font-serif">A la espera de competición pública</h3>
        <p className="text-gray-400 mt-2">Los resultados aparecerán aquí en cuanto el jurado habilite la retransmisión.</p>
      </div>
    );
  }

  const participants = [...currentChamp.participants].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-field-green/10 text-field-green px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-field-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-field-green"></span>
          </span>
          En Directo
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{currentChamp.name}</h2>
        <div className="flex items-center justify-center gap-4 text-falcon-brown/60 font-medium">
          <span className="flex items-center gap-1.5"><Navigation className="w-4 h-4" /> {currentChamp.location}</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {currentChamp.date}</span>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-professional overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-field-green text-white text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="px-8 py-5">Clasificación</th>
                <th className="px-8 py-5">Cetrero & Halcón</th>
                <th className="px-8 py-5 text-center">Altura Máx.</th>
                <th className="px-8 py-5 text-center">Puntuación</th>
                <th className="px-8 py-5 text-right">Análisis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {participants.map((p, i) => (
                <tr key={p.id} className="group hover:bg-gray-50/80 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        i === 1 ? 'bg-gray-100 text-gray-700' : 
                        i === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-300'
                      }`}>
                        {i + 1}
                      </span>
                      {i === 0 && <Trophy className="w-5 h-5 text-yellow-500 animate-bounce" />}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-gray-900 text-lg group-hover:text-field-green transition-colors">{p.falconerName}</p>
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-field-green" /> {p.falconName}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="inline-flex flex-col">
                      <span className="text-xl font-black text-gray-800">{p.alturaServicio}m</span>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Techo Vuelo</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`text-2xl font-black px-4 py-2 rounded-2xl ${p.totalPoints === 0 ? 'text-red-400' : 'text-field-green bg-green-50'}`}>
                      {p.totalPoints === 0 ? 'DESC.' : p.totalPoints.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedFlight(p)} 
                      className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-falcon-brown hover:text-white rounded-2xl transition-all shadow-sm group"
                    >
                      <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedFlight && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-falcon-brown p-8 flex justify-between items-center text-white">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Ficha Técnica de Vuelo</span>
                <h3 className="text-3xl font-black">{selectedFlight.falconerName}</h3>
              </div>
              <button onClick={() => setSelectedFlight(null)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-3xl text-center space-y-1">
                  <ArrowUpCircle className="w-6 h-6 mx-auto text-field-green mb-2" />
                  <p className="text-[10px] uppercase font-black text-gray-400">Altura Servicio</p>
                  <p className="text-2xl font-black text-gray-800">{selectedFlight.alturaServicio}m</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl text-center space-y-1">
                  <Zap className="w-6 h-6 mx-auto text-field-green mb-2" />
                  <p className="text-[10px] uppercase font-black text-gray-400">Vel. Picado</p>
                  <p className="text-2xl font-black text-gray-800">{selectedFlight.velocidadPicado}km/h</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl text-center space-y-1">
                  <Timer className="w-6 h-6 mx-auto text-field-green mb-2" />
                  <p className="text-[10px] uppercase font-black text-gray-400">Tiempo Vuelo</p>
                  <p className="text-2xl font-black text-gray-800">{selectedFlight.tiempoVuelo}s</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-black text-xs uppercase tracking-widest text-gray-400 border-b pb-2">Desglose de Puntos</h4>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm font-medium">
                  <div className="flex justify-between items-center border-b border-gray-50 py-2">
                    <span className="text-gray-500">Puntos por Altura (0.1/m)</span>
                    <span className="font-black text-field-green">+{SCORING.calculateAlturaPoints(selectedFlight.alturaServicio).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-50 py-2">
                    <span className="text-gray-500">Puntos por Picado</span>
                    <span className="font-black text-field-green">+{SCORING.calculatePicadoPoints(selectedFlight.velocidadPicado).toFixed(2)}</span>
                  </div>
                  {selectedFlight.capturaType && (
                    <div className="flex justify-between items-center border-b border-gray-50 py-2 col-span-2">
                      <span className="text-gray-500 italic">Bonificación por Captura: {CAPTURA_LABELS[selectedFlight.capturaType]}</span>
                      <span className="font-black text-field-green">+{SCORING.calculateCapturaPoints(selectedFlight.capturaType, selectedFlight.alturaServicio).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 border-t flex flex-col items-center gap-2">
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-[0.4em]">Puntuación Final Certificada</span>
                <p className="text-6xl font-black text-field-green tracking-tighter">
                  {selectedFlight.totalPoints === 0 ? 'DESC.' : selectedFlight.totalPoints.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicView;
