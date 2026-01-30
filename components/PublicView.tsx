import React, { useState, useEffect } from 'react';
import { AppState, FlightData, Championship } from '../types.ts';
import { Trophy, Search, X, Clock, Navigation, Zap, ArrowUpCircle, Timer, ShieldAlert, BadgeCheck, Minus, Plus, Star, Bird, Medal, Users, ChevronRight, RefreshCw, Radio, History, Calendar } from 'lucide-react';
import { SCORING, CAPTURA_LABELS, APP_VERSION } from '../constants.ts';
import { supabase } from '../supabase.ts';

interface Props {
  state: AppState;
}

const PublicView: React.FC<Props> = ({ state }) => {
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentChamp, setCurrentChamp] = useState<Championship | null>(
    state.championships.find(c => c.id === state.publicChampionshipId) || null
  );

  useEffect(() => {
    if (!supabase || !state.publicChampionshipId) return;

    // Suscripción en tiempo real a cambios en el campeonato activo
    const channel = supabase
      .channel('public-results-live')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'championships', 
        filter: `id=eq.${state.publicChampionshipId}` 
      }, (payload) => {
          console.log("¡NUEVOS DATOS RECIBIDOS EN TIEM REAL!");
          setIsSyncing(true);
          setCurrentChamp(payload.new as Championship);
          setLastUpdate(new Date());
          
          // Animación visual de refresco
          setTimeout(() => setIsSyncing(false), 2000);
          
          // Si tenemos un vuelo seleccionado, actualizamos sus datos si han cambiado
          if (selectedFlight) {
            const updatedParticipants = (payload.new as Championship).participants;
            const updatedFlight = updatedParticipants.find(p => p.id === selectedFlight.id);
            if (updatedFlight) setSelectedFlight(updatedFlight);
          }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [state.publicChampionshipId, selectedFlight]);

  const formatTime = (seconds: number) => {
    if (!seconds) return "0 min 0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs}s`;
  };

  if (!currentChamp) {
    return (
      <div className="text-center py-24 animate-pulse px-4">
        <div className="bg-gray-100 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-8 rotate-12">
          <Trophy className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-2xl font-black text-gray-400 font-serif text-center uppercase tracking-tighter">Preparando Resultados</h3>
        <p className="text-gray-400 mt-2 font-medium text-xs md:text-sm">Sincronizando con el centro de jueces...</p>
      </div>
    );
  }

  const sortedParticipants = [...currentChamp.participants].sort((a, b) => b.totalPoints - a.totalPoints);
  const podium = sortedParticipants.slice(0, 3);

  const getTechnicalBreakdown = (flight: FlightData) => {
    const altPts = SCORING.calculateAlturaPoints(flight.alturaServicio);
    const picPts = SCORING.calculatePicadoPoints(flight.velocidadPicado);
    const remVal = SCORING.calculateRemontadaValue(flight.alturaServicio, flight.tiempoVuelo);
    const remPts = SCORING.calculateRemontadaPoints(remVal);
    const distPts = SCORING.calculateServicioPoints(flight.distanciaServicio);
    
    return { altPts, picPts, remPts, distPts };
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 no-scrollbar">
      {/* Indicador de Tiempo Real */}
      <div className="flex justify-center items-center gap-2 mb-2">
        <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] shadow-sm transition-all duration-500 ${isSyncing ? 'bg-field-green text-white scale-105' : 'bg-white text-gray-400'}`}>
          <Radio className={`w-3 h-3 ${isSyncing ? 'animate-pulse' : 'text-field-green animate-pulse'}`} />
          {isSyncing ? 'Actualizando Datos...' : `Sincronizado: ${lastUpdate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}`}
        </div>
      </div>

      {/* Header Compacto */}
      <div className="text-center space-y-2 px-4">
        <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter leading-tight uppercase">{currentChamp.name}</h2>
        <div className="flex flex-wrap items-center justify-center gap-4 text-falcon-brown/50 font-bold uppercase text-[8px] tracking-[0.2em]">
          <span className="flex items-center gap-1"><Navigation className="w-3 h-3 text-field-green" /> {currentChamp.location}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-field-green" /> {currentChamp.date}</span>
        </div>
      </div>

      {/* Cuadro de Hora de Publicación */}
      {currentChamp.publishedAt && (
        <div className="mx-1 bg-white border-2 border-field-green/20 rounded-[28px] p-5 flex items-center justify-between shadow-sm animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-field-green/10 rounded-2xl flex items-center justify-center text-field-green shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">Publicación Oficial</p>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-tighter">Resultados Activos</h3>
            </div>
          </div>
          <div className="text-right border-l pl-5 border-gray-100">
            <p className="text-[8px] font-black text-field-green uppercase tracking-widest mb-0.5">Hora Publicación</p>
            <p className="text-xl font-black text-gray-900 tracking-tighter leading-none">
              {new Date(currentChamp.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
      )}

      {/* Podium Compacto */}
      {podium.length > 0 && (
        <div className="flex items-end justify-center gap-1 sm:gap-3 px-2 py-6">
          {podium[1] && (
            <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm flex flex-col items-center animate-in slide-in-from-bottom-4 delay-100 max-w-[100px]">
              <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-black text-[10px] mb-2">2º</div>
              <p className="text-[9px] font-black text-gray-800 uppercase truncate w-full text-center">{podium[1].falconerName.split(' ')[0]}</p>
              <p className="text-xs font-black text-slate-600 mt-0.5">{podium[1].totalPoints.toFixed(2)}</p>
            </div>
          )}
          {podium[0] && (
            <div className="flex-1 bg-white border-2 border-yellow-400 rounded-2xl p-4 shadow-xl flex flex-col items-center relative -top-4 animate-in slide-in-from-bottom-6 max-w-[120px]">
              <Trophy className="w-5 h-5 text-yellow-500 mb-2" />
              <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center text-yellow-900 font-black text-xs mb-2 shadow-lg shadow-yellow-200">1º</div>
              <p className="text-[10px] font-black text-gray-900 uppercase truncate w-full text-center">{podium[0].falconerName.split(' ')[0]}</p>
              <p className="text-base font-black text-field-green mt-0.5">{podium[0].totalPoints.toFixed(2)}</p>
            </div>
          )}
          {podium[2] && (
            <div className="flex-1 bg-white border border-orange-100 rounded-2xl p-3 shadow-sm flex flex-col items-center animate-in slide-in-from-bottom-4 delay-200 max-w-[100px]">
              <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 font-black text-[10px] mb-2">3º</div>
              <p className="text-[9px] font-black text-gray-800 uppercase truncate w-full text-center">{podium[2].falconerName.split(' ')[0]}</p>
              <p className="text-xs font-black text-orange-700 mt-0.5">{podium[2].totalPoints.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}

      {/* Lista Principal de Clasificación */}
      <div className="bg-white rounded-[28px] shadow-professional border border-gray-100 overflow-hidden mx-1">
        <div className="bg-gray-50/80 px-4 py-2 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Clasificación General</span>
            {isSyncing && <RefreshCw className="w-2.5 h-2.5 text-field-green animate-spin" />}
          </div>
          <span className="text-[8px] font-black uppercase text-gray-400">{sortedParticipants.length} Vuelos Registrados</span>
        </div>
        
        <div className="divide-y divide-gray-50">
          {sortedParticipants.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors group">
              <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                i === 0 ? 'bg-yellow-400 text-yellow-900 shadow-sm' : 
                i === 1 ? 'bg-slate-200 text-slate-700' : 
                i === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 text-gray-300'
              }`}>
                {i + 1}
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="font-black text-xs text-gray-900 uppercase truncate leading-none">{p.falconerName}</p>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest truncate mt-0.5">{p.falconName}</p>
              </div>

              <div className="text-right shrink-0">
                <p className={`text-sm font-black tracking-tighter leading-none ${p.totalPoints === 0 ? 'text-red-500' : 'text-field-green'}`}>
                  {p.totalPoints === 0 ? 'DESC.' : p.totalPoints.toFixed(2)}
                </p>
                <p className="text-[7px] text-gray-300 font-black uppercase tracking-tighter mt-0.5">{p.alturaServicio}m techo</p>
              </div>

              <button 
                onClick={() => setSelectedFlight(p)} 
                className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:bg-field-green hover:text-white transition-all shadow-sm active:scale-90"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DETALLADO */}
      {selectedFlight && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[340px] rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[85vh]">
            
            <div className="bg-field-green px-6 py-5 text-white flex justify-between items-center shrink-0">
              <div className="min-w-0">
                <span className="text-[7px] uppercase font-black tracking-widest text-white/50 block mb-0.5">Acta de Vuelo Oficial v{APP_VERSION}</span>
                <h3 className="text-base font-black leading-none uppercase truncate">{selectedFlight.falconerName}</h3>
              </div>
              <button 
                onClick={() => setSelectedFlight(null)} 
                className="w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-white hover:text-field-green rounded-lg transition-all text-white active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-5 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-gray-50 p-2.5 rounded-xl text-center border border-gray-100">
                  <ArrowUpCircle className="w-3 h-3 mx-auto text-field-green mb-1" />
                  <p className="text-[7px] uppercase font-black text-gray-400">Altura</p>
                  <p className="text-xs font-black text-gray-800">{selectedFlight.alturaServicio}m</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl text-center border border-gray-100">
                  <Timer className="w-3 h-3 mx-auto text-field-green mb-1" />
                  <p className="text-[7px] uppercase font-black text-gray-400">T. Remontada</p>
                  <p className="text-xs font-black text-gray-800 truncate">{formatTime(selectedFlight.tiempoVuelo)}</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl text-center border border-gray-100">
                  <Zap className="w-3 h-3 mx-auto text-field-green mb-1" />
                  <p className="text-[7px] uppercase font-black text-gray-400">Picado</p>
                  <p className="text-xs font-black text-gray-800">{selectedFlight.velocidadPicado}k</p>
                </div>
              </div>

              {selectedFlight.duracionTotalVuelo > 0 && (
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-400" />
                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider">Duración Total (Manual)</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-800">{formatTime(selectedFlight.duracionTotalVuelo)}</span>
                </div>
              )}

              <div className="bg-green-50/40 rounded-2xl border border-green-100/50 overflow-hidden">
                <div className="px-4 py-2 bg-green-100/30 border-b border-green-100/50 flex justify-between items-center">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-field-green">Vuelo Técnico Desglosado</span>
                  <div className="w-4 h-4 rounded-full bg-field-green flex items-center justify-center">
                     <Medal className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                
                <div className="p-3 space-y-2">
                  {(() => {
                    const breakdown = getTechnicalBreakdown(selectedFlight);
                    return (
                      <>
                        <div className="flex justify-between items-center group">
                          <span className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                            <ChevronRight className="w-2.5 h-2.5 text-field-green/40" />
                            Puntos por Altura
                          </span>
                          <span className="text-[10px] font-black text-field-green">+{breakdown.altPts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                            <ChevronRight className="w-2.5 h-2.5 text-field-green/40" />
                            Velocidad Picado
                          </span>
                          <span className="text-[10px] font-black text-field-green">+{breakdown.picPts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                            <ChevronRight className="w-2.5 h-2.5 text-field-green/40" />
                            Tasa de Remontada
                          </span>
                          <span className="text-[10px] font-black text-field-green">+{breakdown.remPts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                            <ChevronRight className="w-2.5 h-2.5 text-field-green/40" />
                            Posición Servicio
                          </span>
                          <span className="text-[10px] font-black text-field-green">+{breakdown.distPts.toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-1.5 px-1">
                <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase">
                  <span>Bonificaciones de Vuelo</span>
                  <span className="text-field-green">+{ (selectedFlight['bon recogida'] + SCORING.calculateTimeBonus(selectedFlight.tiempoVuelo)).toFixed(2) }</span>
                </div>
                
                {selectedFlight.capturaType && (
                  <div className="flex justify-between text-[9px] font-black text-white bg-field-green px-3 py-2 rounded-xl uppercase shadow-sm">
                    <span className="flex items-center gap-2"><Star className="w-3 h-3" /> {CAPTURA_LABELS[selectedFlight.capturaType]}</span>
                    <span className="font-black">+{ SCORING.calculateCapturaPoints(selectedFlight.capturaType, selectedFlight.alturaServicio).toFixed(2) }</span>
                  </div>
                )}
              </div>

              {(selectedFlight.penSenueloEncarnado || selectedFlight.penEnsenarSenuelo || selectedFlight.penSueltaObligada || selectedFlight.penPicado > 0) && (
                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
                  <p className="text-[7px] font-black uppercase text-red-400 mb-2 tracking-widest flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Penalizaciones Aplicadas
                  </p>
                  <div className="space-y-1">
                    {selectedFlight.penSenueloEncarnado && <div className="flex justify-between text-[8px] font-bold text-red-700 uppercase"><span>Señuelo Encarnado (+ 1/3 paloma)</span> <span>-4.00</span></div>}
                    {selectedFlight.penSueltaObligada && <div className="flex justify-between text-[8px] font-bold text-red-700 uppercase"><span>Suelta Obligada</span> <span>-10.00</span></div>}
                    {selectedFlight.penPicado > 0 && <div className="flex justify-between text-[8px] font-bold text-red-700 uppercase"><span>Estética de Picado</span> <span>-{selectedFlight.penPicado.toFixed(2)}</span></div>}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 text-center space-y-1">
                <div className="flex flex-col items-center">
                   <p className="text-[8px] font-black uppercase text-gray-400 tracking-[0.3em] mb-1">Puntuación Final Acta</p>
                   <p className={`text-4xl font-black tracking-tighter ${selectedFlight.totalPoints === 0 ? 'text-red-500' : 'text-field-green'}`}>
                     {selectedFlight.totalPoints === 0 ? 'DESC.' : selectedFlight.totalPoints.toFixed(2)}
                   </p>
                </div>
                <p className="text-[7px] font-black uppercase text-gray-300 tracking-[0.2em] mt-2 italic flex items-center justify-center gap-2">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-field-green" /> Sincronizado en Vivo
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t md:hidden">
               <button onClick={() => setSelectedFlight(null)} className="w-full py-3 bg-white border border-gray-200 rounded-xl font-black uppercase text-[9px] tracking-widest text-gray-500 active:bg-gray-100 transition-colors">
                  Volver a Clasificación
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicView;