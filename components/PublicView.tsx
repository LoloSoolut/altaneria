
import React, { useState, useEffect } from 'react';
import { AppState, FlightData, Championship } from '../types.ts';
// Fix: Import Bird from lucide-react
import { Trophy, Search, X, Clock, Navigation, Zap, ArrowUpCircle, Timer, ShieldAlert, BadgeCheck, Minus, Plus, Star, Bird } from 'lucide-react';
// Fix: Import APP_VERSION from constants
import { SCORING, CAPTURA_LABELS, APP_VERSION } from '../constants.ts';
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
      <div className="text-center py-24 animate-pulse px-4">
        <div className="bg-gray-100 w-24 h-24 rounded-[40px] flex items-center justify-center mx-auto mb-8 rotate-12">
          <Trophy className="w-12 h-12 text-gray-300" />
        </div>
        <h3 className="text-3xl font-black text-gray-400 font-serif text-center uppercase tracking-tighter">Competición en Preparación</h3>
        <p className="text-gray-400 mt-3 font-medium text-sm md:text-base">Sincronizando resultados con el centro técnico de jueces...</p>
      </div>
    );
  }

  const participants = [...currentChamp.participants].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 pb-20">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 bg-field-green/10 text-field-green px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-field-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-field-green"></span>
          </span>
          Transmisión Oficial
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none uppercase">{currentChamp.name}</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-falcon-brown/60 font-bold uppercase text-[10px] tracking-widest bg-white/50 backdrop-blur-sm p-4 rounded-3xl border border-gray-100 max-w-fit mx-auto">
          <span className="flex items-center gap-2"><Navigation className="w-4 h-4 text-field-green" /> {currentChamp.location}</span>
          <span className="hidden md:block w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
          <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-field-green" /> {currentChamp.date}</span>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-professional overflow-hidden border border-gray-100">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-field-green text-white text-[10px] uppercase tracking-[0.25em] font-black">
                <th className="px-6 md:px-10 py-6 text-center">Pos.</th>
                <th className="px-6 md:px-10 py-6">Equipo (Cetrero & Halcón)</th>
                <th className="px-6 md:px-10 py-6 text-center hidden sm:table-cell">Techo</th>
                <th className="px-6 md:px-10 py-6 text-center">Puntuación</th>
                <th className="px-6 md:px-10 py-6 text-right">Análisis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {participants.map((p, i) => (
                <tr key={p.id} className="group hover:bg-green-50/20 transition-all duration-300">
                  <td className="px-6 md:px-10 py-8 text-center">
                    <span className={`inline-flex w-10 h-10 rounded-2xl items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110 ${
                      i === 0 ? 'bg-yellow-400 text-yellow-900' : 
                      i === 1 ? 'bg-gray-200 text-gray-700' : 
                      i === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-50 text-gray-300'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-6 md:px-10 py-8">
                    <p className="font-black text-lg md:text-xl text-gray-900 group-hover:text-field-green transition-colors leading-none mb-1">{p.falconerName}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] italic">{p.falconName}</p>
                    <div className="sm:hidden mt-2 text-[9px] font-bold text-gray-400 uppercase flex gap-3">
                      <span>{p.alturaServicio}m techo</span>
                      <span>{formatTime(p.tiempoVuelo)}</span>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-8 text-center font-black text-gray-700 hidden sm:table-cell uppercase text-xs tracking-tighter">
                    {p.alturaServicio} metros
                  </td>
                  <td className="px-6 md:px-10 py-8 text-center">
                    <span className={`text-2xl md:text-3xl font-black tracking-tighter ${p.totalPoints === 0 ? 'text-red-500' : 'text-field-green'}`}>
                      {p.totalPoints === 0 ? 'DESC.' : p.totalPoints.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 md:px-10 py-8 text-right">
                    <button onClick={() => setSelectedFlight(p)} className="p-4 bg-gray-50 hover:bg-falcon-brown hover:text-white rounded-2xl transition-all shadow-sm border border-gray-100 group-hover:border-falcon-brown/20 group-hover:shadow-md">
                      <Search className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {participants.length === 0 && (
          <div className="p-20 text-center">
             <Bird className="w-12 h-12 text-gray-100 mx-auto mb-4" />
             <p className="text-gray-300 font-black uppercase text-[10px] tracking-widest">Sin vuelos puntuados aún</p>
          </div>
        )}
      </div>

      {selectedFlight && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-8">
            <div className="bg-field-green p-8 md:p-12 flex justify-between items-start text-white relative">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-yellow-400" />
                  <span className="text-[10px] uppercase font-black tracking-[0.4em] text-white/60">Informe Técnico de Vuelo</span>
                </div>
                <h3 className="text-3xl md:text-5xl font-black leading-none tracking-tight uppercase">{selectedFlight.falconerName}</h3>
                <p className="text-xs md:text-sm font-bold opacity-80 uppercase tracking-widest">Halcón: {selectedFlight.falconName}</p>
              </div>
              <button onClick={() => setSelectedFlight(null)} className="w-14 h-14 flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-[24px] transition-all text-white active:scale-90">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 md:p-12 space-y-10">
              <div className="grid grid-cols-3 gap-3 md:gap-6">
                <div className="bg-gray-50 p-5 rounded-3xl text-center border border-gray-100 shadow-sm group">
                  <ArrowUpCircle className="w-6 h-6 mx-auto text-field-green mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Altura</p>
                  <p className="text-2xl font-black text-gray-800">{selectedFlight.alturaServicio}m</p>
                </div>
                <div className="bg-gray-50 p-5 rounded-3xl text-center border border-gray-100 shadow-sm group">
                  <Timer className="w-6 h-6 mx-auto text-field-green mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Tiempo</p>
                  <p className="text-2xl font-black text-gray-800 tracking-tighter truncate">{formatTime(selectedFlight.tiempoVuelo)}</p>
                </div>
                <div className="bg-gray-50 p-5 rounded-3xl text-center border border-gray-100 shadow-sm group">
                  <Zap className="w-6 h-6 mx-auto text-field-green mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Picado</p>
                  <p className="text-2xl font-black text-gray-800 tracking-tighter">{selectedFlight.velocidadPicado} <span className="text-[10px]">km/h</span></p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-green-50/50 p-6 md:p-8 rounded-[40px] border border-green-100/50 shadow-sm">
                  <h4 className="font-black text-[11px] uppercase tracking-[0.3em] text-field-green border-b border-green-200 pb-4 mb-6 flex items-center gap-3">
                    <BadgeCheck className="w-5 h-5" /> Desglose de Puntos
                  </h4>
                  <div className="space-y-4 text-xs md:text-sm">
                    <div className="flex justify-between items-center bg-white/60 p-4 rounded-2xl border border-green-100">
                      <span className="text-gray-600 font-bold uppercase tracking-tight">Puntos Altura Serv.</span>
                      <span className="font-black text-field-green flex items-center gap-1 text-lg">
                        <Plus className="w-4 h-4"/> {SCORING.calculateAlturaPoints(selectedFlight.alturaServicio).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white/60 p-4 rounded-2xl border border-green-100">
                      <span className="text-gray-600 font-bold uppercase tracking-tight">Técnica de Picado</span>
                      <span className="font-black text-field-green flex items-center gap-1 text-lg">
                        <Plus className="w-4 h-4"/> {SCORING.calculatePicadoPoints(selectedFlight.velocidadPicado).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white/60 p-4 rounded-2xl border border-green-100">
                      <span className="text-gray-600 font-bold uppercase tracking-tight">Velocidad Remontada</span>
                      <span className="font-black text-field-green flex items-center gap-1 text-lg">
                        <Plus className="w-4 h-4"/> {SCORING.calculateRemontadaPoints(SCORING.calculateRemontadaValue(selectedFlight.alturaServicio, selectedFlight.tiempoVuelo)).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <div className="bg-white p-4 rounded-3xl border border-green-100 shadow-sm flex flex-col items-center">
                        <Star className="w-5 h-5 text-yellow-500 mb-2" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recogida</span>
                        <span className="text-xl font-black text-field-green">+{selectedFlight['bon recogida'].toFixed(2)}</span>
                      </div>
                      <div className="bg-white p-4 rounded-3xl border border-green-100 shadow-sm flex flex-col items-center">
                        <Clock className="w-5 h-5 text-field-green mb-2" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bono Tiempo</span>
                        <span className="text-xl font-black text-field-green">+{SCORING.calculateTimeBonus(selectedFlight.tiempoVuelo).toFixed(2)}</span>
                      </div>
                    </div>

                    {selectedFlight.capturaType && (
                      <div className="flex justify-between items-center mt-6 bg-field-green p-5 rounded-3xl shadow-xl shadow-green-900/10">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white"><Trophy className="w-4 h-4" /></div>
                           <span className="text-white font-black uppercase text-[11px] tracking-widest">{CAPTURA_LABELS[selectedFlight.capturaType]}</span>
                        </div>
                        <span className="font-black text-white flex items-center gap-1 text-xl">
                          <Plus className="w-5 h-5"/> {SCORING.calculateCapturaPoints(selectedFlight.capturaType, selectedFlight.alturaServicio).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedFlight.penSenueloEncarnado || selectedFlight.penEnsenarSenuelo || selectedFlight.penSueltaObligada || (selectedFlight.penPicado && selectedFlight.penPicado > 0)) && (
                  <div className="space-y-4 bg-red-50/50 p-6 md:p-8 rounded-[40px] border border-red-100">
                    <h4 className="font-black text-[11px] uppercase tracking-[0.3em] text-red-500 border-b border-red-200 pb-4 mb-6 flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5" /> Penalizaciones Aplicadas
                    </h4>
                    <div className="space-y-4">
                      {selectedFlight.penSenueloEncarnado && (
                        <div className="flex justify-between items-center text-red-700 bg-white/50 p-4 rounded-2xl border border-red-100 font-black uppercase text-[10px] tracking-widest">
                          <span>Señuelo encarnado</span>
                          <span className="flex items-center gap-1"><Minus className="w-4 h-4"/> 4.00</span>
                        </div>
                      )}
                      {selectedFlight.penEnsenarSenuelo && (
                        <div className="flex justify-between items-center text-red-700 bg-white/50 p-4 rounded-2xl border border-red-100 font-black uppercase text-[10px] tracking-widest">
                          <span>Enseñar señuelo</span>
                          <span className="flex items-center gap-1"><Minus className="w-4 h-4"/> 6.00</span>
                        </div>
                      )}
                      {selectedFlight.penSueltaObligada && (
                        <div className="flex justify-between items-center text-red-700 bg-white/50 p-4 rounded-2xl border border-red-100 font-black uppercase text-[10px] tracking-widest">
                          <span>Suelta obligada</span>
                          <span className="flex items-center gap-1"><Minus className="w-4 h-4"/> 10.00</span>
                        </div>
                      )}
                      {selectedFlight.penPicado > 0 && (
                        <div className="flex justify-between items-center text-red-700 bg-white/50 p-4 rounded-2xl border border-red-100 font-black uppercase text-[10px] tracking-widest">
                          <span>Calidad Picado (Juez)</span>
                          <span className="flex items-center gap-1 text-red-600"><Minus className="w-4 h-4"/> {selectedFlight.penPicado.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-12 border-t flex flex-col items-center gap-3">
                <span className="text-[11px] uppercase font-black text-gray-300 tracking-[0.6em] italic">Auditoría Final v{APP_VERSION}</span>
                <p className={`text-7xl md:text-9xl font-black tracking-tighter transition-all leading-none ${selectedFlight.totalPoints === 0 ? 'text-red-500 animate-pulse' : 'text-field-green'}`}>
                  {selectedFlight.totalPoints === 0 ? 'DESC.' : selectedFlight.totalPoints.toFixed(2)}
                </p>
                {selectedFlight.totalPoints > 0 && (
                   <p className="text-[10px] font-black uppercase text-field-green bg-field-green/10 px-6 py-2 rounded-full tracking-widest mt-4">Firma Técnica Digitalizada</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicView;
