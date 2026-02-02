
import React, { useState, useEffect } from 'react';
import { AppState, FlightData, Championship, CapturaType } from '../types.ts';
import { Trophy, Search, X, Clock, Navigation, Zap, ArrowUpCircle, Timer, ShieldAlert, BadgeCheck, Minus, Plus, Star, Bird, Medal, Users, ChevronRight, RefreshCw, Radio, History, Calendar, AlertTriangle, MapPin } from 'lucide-react';
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
    
    // Penalizaciones detalladas
    const pens = {
      senuelo: flight.penSenueloEncarnado ? 4 : 0,
      ensenar: flight.penEnsenarSenuelo ? 6 : 0,
      suelta: flight.penSueltaObligada ? 10 : 0,
      picado: flight.penPicado || 0
    };
    const penTotal = pens.senuelo + pens.ensenar + pens.suelta + pens.picado;
    
    return { altPts, picPts, remPts, distPts, capPts, timeBonus, recBonus, pens, penTotal };
  };

  const getDisqualificationReasons = (flight: FlightData) => {
    const reasons: string[] = [];
    if (flight.disqualifications.superar10min) reasons.push("Superar 10 min sin recoger");
    if (flight.disqualifications.ensenarVivos) reasons.push("Enseñar señuelos vivos");
    if (flight.disqualifications.conductaAntideportiva) reasons.push("Conducta antideportiva");
    if (flight.disqualifications.noComparecer) reasons.push("No comparecer");
    return reasons;
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

      <div className="flex flex-col items-center gap-2 mb-2">
        <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] shadow-sm transition-all duration-500 ${isSyncing ? 'bg-field-green text-white scale-105' : 'bg-white text-gray-400'}`}>
          <Radio className={`w-3 h-3 ${isSyncing ? 'animate-pulse' : 'text-field-green animate-pulse'}`} />
          {isSyncing ? 'Actualizando Datos...' : `Sincronizado: ${lastUpdate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}`}
        </div>
        
        {currentChamp.publishedAt && (
          <div className="px-4 py-1.5 rounded-full bg-falcon-brown/5 text-falcon-brown/70 flex items-center gap-2 text-[7px] font-black uppercase tracking-[0.2em] border border-falcon-brown/10 animate-in fade-in duration-1000">
            <Calendar className="w-2.5 h-2.5" />
            Resultados Públicos desde: {new Date(currentChamp.publishedAt).toLocaleDateString('es-ES')} a las {new Date(currentChamp.publishedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      <div className="text-center space-y-2 px-4">
        <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter leading-tight uppercase">{currentChamp.name}</h2>
        <div className="flex flex-wrap items-center justify-center gap-4 text-falcon-brown/50 font-bold uppercase text-[8px] tracking-[0.2em]">
          <span className="flex items-center gap-1"><Navigation className="w-3 h-3 text-field-green" /> {currentChamp.location}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-field-green" /> {currentChamp.date}</span>
        </div>
      </div>

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
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Clasificación General</span>
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
          <div className="bg-white w-full max-w-[350px] rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[90vh]">
            <div className="bg-field-green px-6 py-5 text-white flex justify-between items-center shrink-0">
              <div className="min-w-0">
                <span className="text-[7px] uppercase font-black tracking-widest text-white/50 block mb-0.5">Acta de Vuelo Oficial v{APP_VERSION}</span>
                <h3 className="text-base font-black leading-none uppercase truncate">{selectedFlight.falconerName}</h3>
              </div>
              <button onClick={() => setSelectedFlight(null)} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white hover:text-field-green rounded-lg transition-all text-white active:scale-90">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100 text-center">
                  <ArrowUpCircle className="w-3 h-3 mx-auto text-field-green mb-1" />
                  <p className="text-[7px] uppercase font-black text-gray-400">Altura</p>
                  <p className="text-xs font-black text-gray-800">{selectedFlight.alturaServicio}m</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100 text-center">
                  <Timer className="w-3 h-3 mx-auto text-field-green mb-1" />
                  <p className="text-[7px] uppercase font-black text-gray-400">T. Remontada</p>
                  <p className="text-xs font-black text-gray-800 truncate">{formatTime(selectedFlight.tiempoVuelo)}</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100 text-center">
                  <Zap className="w-3 h-3 mx-auto text-field-green mb-1" />
                  <p className="text-[7px] uppercase font-black text-gray-400">Picado</p>
                  <p className="text-xs font-black text-gray-800">{selectedFlight.velocidadPicado}k</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-2xl border border-gray-100 text-center">
                  <MapPin className="w-3 h-3 mx-auto text-field-green mb-1" />
                  <p className="text-[7px] uppercase font-black text-gray-400">Pos. Servicio</p>
                  <p className="text-xs font-black text-gray-800">{selectedFlight.distanciaServicio}m</p>
                </div>
              </div>

              <div className="bg-green-50/40 rounded-2xl border border-green-100/50 overflow-hidden">
                <div className="px-4 py-2 bg-green-100/30 border-b border-green-100/50">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-field-green">Desglose Técnico Detallado</span>
                </div>
                <div className="p-3 space-y-2">
                  {(() => {
                    const b = getTechnicalBreakdown(selectedFlight);
                    return (
                      <>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-gray-500 uppercase">Altura de Vuelo</span>
                          <span className="font-black text-field-green">+{b.altPts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-gray-500 uppercase">Velocidad Picado</span>
                          <span className="font-black text-field-green">+{b.picPts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-gray-500 uppercase">Tasa de Remontada</span>
                          <span className="font-black text-field-green">+{b.remPts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-gray-500 uppercase">Posición Servicio</span>
                          <span className="font-black text-field-green">+{b.distPts.toFixed(2)}</span>
                        </div>
                        
                        {/* Detalle Captura */}
                        {b.capPts > 0 && (
                          <div className="pt-1 border-t border-green-100/50 space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-gray-500 uppercase">Captura ({CAPTURA_LABELS[selectedFlight.capturaType!]})</span>
                              <span className="font-black text-field-green">+{b.capPts.toFixed(2)}</span>
                            </div>
                          </div>
                        )}

                        {/* Detalle Bonificaciones */}
                        {(b.timeBonus > 0 || b.recBonus > 0) && (
                          <div className="pt-1 border-t border-green-100/50 space-y-1">
                            {b.timeBonus > 0 && (
                              <div className="flex justify-between items-center text-[9px]">
                                <span className="font-medium text-gray-400 uppercase italic">Bono por tiempo de vuelo</span>
                                <span className="font-black text-field-green">+{b.timeBonus.toFixed(2)}</span>
                              </div>
                            )}
                            {b.recBonus > 0 && (
                              <div className="flex justify-between items-center text-[9px]">
                                <span className="font-medium text-gray-400 uppercase italic">Bono por recogida limpia</span>
                                <span className="font-black text-field-green">+{b.recBonus.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Detalle Penalizaciones */}
                        {b.penTotal > 0 && (
                          <div className="pt-1 border-t border-red-100 space-y-1">
                            <span className="text-[8px] font-black uppercase text-red-300 block mb-1">Penalizaciones Aplicadas</span>
                            {b.pens.senuelo > 0 && (
                              <div className="flex justify-between items-center text-[9px]">
                                <span className="font-medium text-red-400 uppercase italic">Señuelo encarnado</span>
                                <span className="font-black text-red-500">-{b.pens.senuelo.toFixed(2)}</span>
                              </div>
                            )}
                            {b.pens.ensenar > 0 && (
                              <div className="flex justify-between items-center text-[9px]">
                                <span className="font-medium text-red-400 uppercase italic">Enseñar señuelo</span>
                                <span className="font-black text-red-500">-{b.pens.ensenar.toFixed(2)}</span>
                              </div>
                            )}
                            {b.pens.suelta > 0 && (
                              <div className="flex justify-between items-center text-[9px]">
                                <span className="font-medium text-red-400 uppercase italic">Suelta obligada</span>
                                <span className="font-black text-red-500">-{b.pens.suelta.toFixed(2)}</span>
                              </div>
                            )}
                            {b.pens.picado > 0 && (
                              <div className="flex justify-between items-center text-[9px]">
                                <span className="font-medium text-red-400 uppercase italic">Calidad/Estilo picado</span>
                                <span className="font-black text-red-500">-{b.pens.picado.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Detalle Descalificación */}
              {Object.values(selectedFlight.disqualifications).some(v => v) && (
                <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-red-600 leading-none">Descalificación Directa</p>
                      <p className="text-[8px] font-bold text-red-400 uppercase mt-1 italic">Infringimiento grave del reglamento</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-red-100 flex flex-wrap gap-1.5">
                    {getDisqualificationReasons(selectedFlight).map((reason, idx) => (
                      <span key={idx} className="bg-red-600 text-white text-[7px] font-black uppercase px-2 py-1 rounded-md">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 text-center">
                 <p className="text-[8px] font-black uppercase text-gray-400 tracking-[0.3em] mb-1">Puntuación Final Certificada</p>
                 <p className={`text-4xl font-black tracking-tighter ${selectedFlight.totalPoints === 0 ? 'text-red-500' : 'text-field-green'}`}>
                   {selectedFlight.totalPoints === 0 ? 'DESC.' : selectedFlight.totalPoints.toFixed(2)}
                 </p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t">
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
