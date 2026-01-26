import React, { useState, useEffect } from 'react';
import { AppState, FlightData, Championship } from '../types.ts';
import { Trophy, Medal, Search, X, Clock, Navigation, Zap, ArrowUpCircle, RefreshCw, Timer, ShieldAlert, BadgeCheck } from 'lucide-react';
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

  useEffect(() => {
    if (!supabase || !state.publicChampionshipId) return;

    const channel = supabase
      .channel('public-results')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'championships', filter: `id=eq.${state.publicChampionshipId}` }, (payload) => {
          setCurrentChamp(payload.new as Championship);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [state.publicChampionshipId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs}s`;
  };

  if (!currentChamp) {
    return (
      <div className="text-center py-24 animate-pulse">
        <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-2xl font-bold text-gray-400 font-serif">A la espera de competición pública</h3>
        <p className="text-gray-400 mt-2">Los resultados aparecerán aquí en tiempo real.</p>
      </div>
    );
  }

  const participants = [...currentChamp.participants].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-field-green/10 text-field-green px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-field-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-field-green"></span>
          </span>
          En Directo
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">{currentChamp.name}</h2>
        <div className="flex items-center justify-center gap-4 text-falcon-brown/60 font-medium text-sm">
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
                <th className="px-8 py-5">Pos.</th>
                <th className="px-8 py-5">Competidor</th>
                <th className="px-8 py-5 text-center">Techo</th>
                <th className="px-8 py-5 text-center">Puntos</th>
                <th className="px-8 py-5 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {participants.map((p, i) => (
                <tr key={p.id} className="group hover:bg-gray-50/80 transition-colors">
                  <td className="px-8 py-6">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' : 
                      i === 1 ? 'bg-gray-100 text-gray-700' : 
                      i === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-300'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-gray-900 group-hover:text-field-green transition-colors">{p.falconerName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{p.falconName}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-lg font-black text-gray-800">{p.alturaServicio}m</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`text-xl font-black ${p.totalPoints === 0 ? 'text-red-400' : 'text-field-green'}`}>
                      {p.totalPoints === 0 ? 'DESC.' : p.totalPoints.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => setSelectedFlight(p)} className="p-3 bg-gray-100 hover:bg-falcon-brown hover:text-white rounded-xl transition-all shadow-sm">
                      <Search className="w-4 h-4" />
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
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="bg-falcon-brown p-8 flex justify-between items-center text-white sticky top-0 z-10">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Análisis Técnico Oficial</span>
                <h3 className="text-3xl font-black leading-none">{selectedFlight.falconerName}</h3>
                <p className="text-xs opacity-80 italic">Halcón: {selectedFlight.falconName}</p>
              </div>
              <button onClick={() => setSelectedFlight(null)} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <ArrowUpCircle className="w-5 h-5 mx-auto text-field-green mb-1" />
                  <p className="text-[9px] uppercase font-black text-gray-400">Altura</p>
                  <p className="text-xl font-black text-gray-800">{selectedFlight.alturaServicio}m</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <Timer className="w-5 h-5 mx-auto text-field-green mb-1" />
                  <p className="text-[9px] uppercase font-black text-gray-400">Tiempo</p>
                  <p className="text-xl font-black text-gray-800">{formatTime(selectedFlight.tiempoVuelo)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <Zap className="w-5 h-5 mx-auto text-field-green mb-1" />
                  <p className="text-[9px] uppercase font-black text-gray-400">Picado</p>
                  <p className="text-xl font-black text-gray-800">{selectedFlight.velocidadPicado} km/h</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400 border-b pb-2 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-field-green" /> Conceptos Positivos
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600 font-medium">Puntos por Altura (0.1/m)</span>
                    <span className="font-black text-field-green">+{SCORING.calculateAlturaPoints(selectedFlight.alturaServicio).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600 font-medium">Técnica de Picado</span>
                    <span className="font-black text-field-green">+{SCORING.calculatePicadoPoints(selectedFlight.velocidadPicado).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600 font-medium">Bonificación Tiempo (Vel. Remontada)</span>
                    <span className="font-black text-field-green">+{SCORING.calculateRemontadaPoints(SCORING.calculateRemontadaValue(selectedFlight.alturaServicio, selectedFlight.tiempoVuelo)).toFixed(2)}</span>
                  </div>
                  {selectedFlight['bon recogida'] > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600 font-medium">Bonificación Recogida</span>
                      <span className="font-black text-field-green">+{selectedFlight['bon recogida'].toFixed(2)}</span>
                    </div>
                  )}
                  {selectedFlight.capturaType && (
                    <div className="flex justify-between items-center py-1 bg-green-50 px-3 rounded-lg border border-green-100">
                      <span className="text-field-green font-bold italic">{CAPTURA_LABELS[selectedFlight.capturaType]}</span>
                      <span className="font-black text-field-green">+{SCORING.calculateCapturaPoints(selectedFlight.capturaType, selectedFlight.alturaServicio).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {(selectedFlight.penSenueloEncarnado || selectedFlight.penEnsenarSenuelo || selectedFlight.penSueltaObligada || selectedFlight.penPicado > 0) && (
                <div className="space-y-4">
                  <h4 className="font-black text-[10px] uppercase tracking-widest text-red-400 border-b border-red-50 pb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Penalizaciones Aplicadas
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedFlight.penSenueloEncarnado && (
                      <div className="flex justify-between items-center py-1 text-red-600">
                        <span className="font-medium">Señuelo encarnado</span>
                        <span className="font-black">-4.00</span>
                      </div>
                    )}
                    {selectedFlight.penEnsenarSenuelo && (
                      <div className="flex justify-between items-center py-1 text-red-600">
                        <span className="font-medium">Enseñar señuelo</span>
                        <span className="font-black">-6.00</span>
                      </div>
                    )}
                    {selectedFlight.penSueltaObligada && (
                      <div className="flex justify-between items-center py-1 text-red-600">
                        <span className="font-medium">Suelta obligada</span>
                        <span className="font-black">-10.00</span>
                      </div>
                    )}
                    {selectedFlight.penPicado > 0 && (
                      <div className="flex justify-between items-center py-1 text-red-600">
                        <span className="font-medium">Falta de agresividad en picado</span>
                        <span className="font-black">-{selectedFlight.penPicado.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-8 border-t flex flex-col items-center gap-2">
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-[0.4em]">Puntuación Total Certificada</span>
                <p className={`text-7xl font-black tracking-tighter ${selectedFlight.totalPoints === 0 ? 'text-red-500' : 'text-field-green'}`}>
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