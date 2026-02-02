
import React, { useState, useEffect } from 'react';
import { AppState, FlightData, Championship } from '../types.ts';
import { Trophy, Search, X, Clock, Navigation, Zap, ArrowUpCircle, Timer, ShieldAlert, BadgeCheck, Minus, Plus, Star, Bird, Medal, Users, ChevronRight, RefreshCw, Radio, History, Calendar, AlertTriangle } from 'lucide-react';
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
    if (!supabase || !state.publicChampionshipId) {
      setCurrentChamp(null);
      return;
    }

    const channel = supabase
      .channel('public-results-live')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'championships', 
        filter: `id=eq.${state.publicChampionshipId}` 
      }, (payload) => {
          setIsSyncing(true);
          const updatedChamp = payload.new as Championship;
          
          // Si el evento ya no es público, lo quitamos de la vista.
          if (!updatedChamp.isPublic) {
            setCurrentChamp(null);
            setSelectedFlight(null);
          } else {
            setCurrentChamp(updatedChamp);
            setLastUpdate(new Date());
            
            if (selectedFlight) {
              const updatedFlight = updatedChamp.participants.find(p => p.id === selectedFlight.id);
              if (updatedFlight) setSelectedFlight(updatedFlight);
            }
          }
          setTimeout(() => setIsSyncing(false), 2000);
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [state.publicChampionshipId, selectedFlight]);

  const handleManualRefresh = () => {
    setIsSyncing(true);
    // Solo recargamos la página para que la lógica de fetchData en App.tsx vuelva a correr.
    // Esto respetará el estado actual de Supabase sin inventar eventos.
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "0 min 0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs}s`;
  };

  if (!currentChamp || !currentChamp.isPublic) {
    return (
      <div className="text-center py-24 animate-pulse px-4">
        <div className="bg-gray-100 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-8 rotate-12">
          <Trophy className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-2xl font-black text-gray-400 font-serif text-center uppercase tracking-tighter">Preparando Resultados</h3>
        <p className="text-gray-400 mt-2 font-medium text-xs md:text-sm">Sincronizando con el centro de jueces...</p>
        <button 
          onClick={handleManualRefresh}
          className="mt-8 px-8 py-4 bg-field-green text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 mx-auto"
        >
          <RefreshCw className="w-4 h-4" /> Forzar Refresco
        </button>
      </div>
    );
  }

  const sortedParticipants = [...currentChamp.participants].sort((a, b) => b.totalPoints - a.totalPoints);
  const podium = sortedParticipants.slice(0, 3);

  const getTechnicalBreakdown = (flight: FlightData) => {
    const altPts = SCORING.calculateAlturaPoints(flight.alturaServicio || 0);
    const picPts = SCORING.calculatePicadoPoints(flight.velocidadPicado || 0);
    const remVal = SCORING.calculateRemontadaValue(flight.alturaServicio || 0, flight.tiempoVuelo || 0);
    const remPts = SCORING.calculateRemontadaPoints(remVal);
    const distPts = SCORING.calculateServicioPoints(flight.distanciaServicio || 0);
    const capPts = flight.capturaType ? SCORING.calculateCapturaPoints(flight.capturaType, flight.alturaServicio || 0) : 0;
    const timeBonus = SCORING.calculateTimeBonus(flight.tiempoVuelo || 0);
    const recBonus = flight['bon recogida'] || 0;
    const penTotal = (flight.penSenueloEncarnado ? 4 : 0) + 
                     (flight.penEnsenarSenuelo ? 6 : 0) + 
                     (flight.penSueltaObligada ? 10 : 0) + 
                     (flight.penPicado || 0);
    
    return { altPts, picPts, remPts, distPts, capPts, timeBonus, recBonus, penTotal };
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 no-scrollbar relative">
      
      <button 
        onClick={handleManualRefresh}
        className="fixed bottom-8 right-6 w-14 h-14 bg-field-green text-white rounded-2xl shadow-2xl flex items-center justify-center hover:bg-green-700 active:scale-95 transition-all z-[90] border-2 border-white/20 group"
        title="Actualizar Clasificación"
      >
        <RefreshCw className={`w-6 h-6 transition-transform duration-500 group-hover:rotate-180 ${isSyncing ? 'animate-spin' : ''}`} />
      </button>

      <div className="flex justify-center items-center gap-2 mb-2">
        <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] shadow-sm transition-all duration-500 ${isSyncing ? 'bg-field-green text-white scale-105' : 'bg-white text-gray-400'}`}>
          <Radio className={`w-3 h-3 ${isSyncing ? 'animate-pulse' : 'text-field-green animate-pulse'}`} />
          {isSyncing ? 'Actualizando Datos...' : `Sincronizado: ${lastUpdate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}`}
        </div>
      </div>

      <div className="text-center space-y-2 px-4">
        <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter leading-tight uppercase">{currentChamp.name}</h2>
        <div className="flex flex-wrap items-center justify-center gap-4 text-falcon-brown/50 font-bold uppercase text-[8px] tracking-[0.2em]">
          <span className="flex items-center gap-1"><Navigation className="w-3 h-3 text-field-green" /> {currentChamp.location}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-field-green" /> {currentChamp.date}</span>
        </div>
      </div>

      {currentChamp.publishedAt && (
        <div className="mx-1 bg-white border-2 border-field-green/30 rounded-[28px] p-5 flex items-center justify-between shadow-lg shadow-green-900/5 animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-field-green rounded-2xl flex items-center justify-center text-white shadow-md">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-field-green leading-none mb-1">Certificación de Resultados</p>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-tighter text-wrap max-w-[150px] leading-tight">Publicación Oficial de Resultados</h3>
            </div>
          </div>
          <div className="text-right border-l pl-5 border-gray-100 flex flex-col justify-center">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha y Hora</p>
            <p className="text-[10px] font-black text-gray-500 tracking-tight uppercase">
              {new Date(currentChamp.publishedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            <p className="text-xl font-black text-gray-900 tracking-tighter leading-none mt-1">
              {new Date(currentChamp.publishedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      )}

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

      <div className="bg-white rounded-[28px] shadow-professional border border-gray-100 overflow-hidden mx-1">
        <div className="bg-gray-50/80 px-4 py-3 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Clasificación General</span>
            {isSyncing && <RefreshCw className="w-2.5 h-2.5 text-field-green animate-spin" />}
          </div>
          <button 
            onClick={handleManualRefresh}
            className="flex items-center gap-1 px-2 py-1 bg-white border rounded-lg text-[7px] font-black uppercase text-field-green hover:bg-field-green hover:text-white transition-all shadow-sm"
          >
            <RefreshCw className="w-2.5 h-2.5" /> Actualizar
          </button>
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

      {selectedFlight && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[340px] rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[85vh]">
            <div className="bg-field-green px-6 py-5 text-white flex justify-between items-center shrink-0">
              <div className="min-w-0">
                <span className="text-[7px] uppercase font-black tracking-widest text-white/50 block mb-0.5">Acta de Vuelo Oficial v{APP_VERSION}</span>
                <h3 className="text-base font-black leading-none uppercase truncate">{selectedFlight.falconerName}</h3>
              </div>
              <button onClick={() => setSelectedFlight(null)} className="w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-white hover:text-field-green rounded-lg transition-all text-white active:scale-90">
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
                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider">Duración total del Vuelo</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-800">{formatTime(selectedFlight.duracionTotalVuelo)}</span>
                </div>
              )}

              <div className="bg-green-50/40 rounded-2xl border border-green-100/50 overflow-hidden">
                <div className="px-4 py-2 bg-green-100/30 border-b border-green-100/50 flex justify-between items-center">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-field-green">Desglose de Puntuación Técnica</span>
                </div>
                <div className="p-3 space-y-2">
                  {(() => {
                    const b = getTechnicalBreakdown(selectedFlight);
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-gray-500 uppercase">Puntos por Altura</span>
                          <span className="text-[10px] font-black text-field-green">+{b.altPts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-gray-500 uppercase">Velocidad Picado</span>
                          <span className="text-[10px] font-black text-field-green">+{b.picPts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-gray-500 uppercase">Tasa de Remontada</span>
                          <span className="text-[10px] font-black text-field-green">+{b.remPts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-gray-500 uppercase">Posición Servicio</span>
                          <span className="text-[10px] font-black text-field-green">+{b.distPts.toFixed(2)}</span>
                        </div>
                        {b.capPts > 0 && (
                          <div className="flex justify-between items-center pt-1 border-t border-green-100/50">
                            <span className="text-[9px] font-bold text-gray-500 uppercase">Puntos por Captura</span>
                            <span className="text-[10px] font-black text-field-green">+{b.capPts.toFixed(2)}</span>
                          </div>
                        )}
                        {(b.timeBonus > 0 || b.recBonus > 0) && (
                          <div className="flex justify-between items-center pt-1 border-t border-green-100/50">
                            <span className="text-[9px] font-bold text-gray-500 uppercase">Bonos (Tiempo/Recogida)</span>
                            <span className="text-[10px] font-black text-field-green">+{(b.timeBonus + b.recBonus).toFixed(2)}</span>
                          </div>
                        )}
                        {b.penTotal > 0 && (
                          <div className="flex justify-between items-center pt-1 border-t border-red-100">
                            <span className="text-[9px] font-bold text-red-400 uppercase">Penalizaciones</span>
                            <span className="text-[10px] font-black text-red-500">-{b.penTotal.toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {Object.values(selectedFlight.disqualifications).some(v => v) && (
                <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-200 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-red-600 leading-none">Descalificación Directa</p>
                    <p className="text-[8px] font-bold text-red-400 uppercase mt-1">Infringimiento grave del reglamento</p>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 text-center space-y-1">
                 <p className="text-[8px] font-black uppercase text-gray-400 tracking-[0.3em] mb-1">Puntuación Final Certificada</p>
                 <p className={`text-4xl font-black tracking-tighter ${selectedFlight.totalPoints === 0 ? 'text-red-500' : 'text-field-green'}`}>
                   {selectedFlight.totalPoints === 0 ? 'DESC.' : selectedFlight.totalPoints.toFixed(2)}
                 </p>
                 <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="px-3 py-1 bg-field-green/5 border border-field-green/10 rounded-full flex items-center gap-2">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-field-green" />
                    <span className="text-[7px] font-black uppercase text-field-green tracking-widest">Sincronizado Jueces</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t md:hidden">
               <button onClick={() => setSelectedFlight(null)} className="w-full py-3 bg-white border border-gray-200 rounded-xl font-black uppercase text-[9px] tracking-widest text-gray-500 active:bg-gray-100 transition-colors">
                  Cerrar Acta
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicView;
