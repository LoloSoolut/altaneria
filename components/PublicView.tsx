
import React, { useState } from 'react';
import { AppState, FlightData } from '../types';
import { Trophy, Medal, Search, Info, X, Clock, Navigation, CheckCircle, AlertCircle, ShieldAlert, Zap, ArrowUpCircle } from 'lucide-react';
import { SCORING, CAPTURA_LABELS } from '../constants';

interface Props {
  state: AppState;
}

const PublicView: React.FC<Props> = ({ state }) => {
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const champ = state.championships.find(c => c.id === state.publicChampionshipId);

  if (!champ) {
    return (
      <div className="text-center py-40">
        <Trophy className="w-20 h-20 text-gray-200 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-400">No hay campeonatos activos para el público en este momento</h3>
        <p className="text-gray-400">El juez debe activar la visibilidad de un campeonato.</p>
      </div>
    );
  }

  const participants = [...champ.participants].sort((a, b) => b.totalPoints - a.totalPoints);
  const podium = participants.slice(0, 3);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return { mins, secs };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-2">
        <span className="inline-block px-4 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse">En Vivo</span>
        <h2 className="text-4xl font-black text-field-green">{champ.name}</h2>
        <p className="text-gray-500 font-medium">{champ.location} • {champ.date}</p>
      </div>

      {/* Podium Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        {podium[1] && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border-b-8 border-gray-300 text-center order-2 md:order-1 h-64 flex flex-col justify-center">
            <Medal className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <h4 className="text-xl font-bold line-clamp-1">{podium[1].falconerName}</h4>
            <p className="text-gray-500 italic mb-4">{podium[1].falconName}</p>
            <p className="text-3xl font-black text-gray-700">{podium[1].totalPoints.toFixed(2)}</p>
          </div>
        )}
        {podium[0] && (
          <div className="bg-white p-8 rounded-2xl shadow-2xl border-b-8 border-yellow-400 text-center order-1 md:order-2 h-80 flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h4 className="text-2xl font-black line-clamp-1">{podium[0].falconerName}</h4>
            <p className="text-gray-600 font-medium italic mb-6">{podium[0].falconName}</p>
            <p className="text-5xl font-black text-field-green">{podium[0].totalPoints.toFixed(2)}</p>
          </div>
        )}
        {podium[2] && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border-b-8 border-amber-600 text-center order-3 h-56 flex flex-col justify-center">
            <Medal className="w-10 h-10 text-amber-600 mx-auto mb-2" />
            <h4 className="text-lg font-bold line-clamp-1">{podium[2].falconerName}</h4>
            <p className="text-gray-500 italic mb-4">{podium[2].falconName}</p>
            <p className="text-2xl font-black text-amber-800">{podium[2].totalPoints.toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* Full Classification Table */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-falcon-brown text-white px-8 py-4 font-bold flex justify-between items-center">
          <span>Clasificación Completa</span>
          <span className="text-xs uppercase tracking-widest opacity-75">{participants.length} Participantes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <tbody className="divide-y divide-gray-100">
              {participants.map((p, i) => (
                <tr key={p.id} className="hover:bg-gray-50 transition group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-6">
                      <span className="text-2xl font-black text-gray-200 group-hover:text-field-green transition">{i + 1}</span>
                      <div>
                        <h4 className="font-bold text-lg">{p.falconerName || "Por determinar"}</h4>
                        <p className="text-gray-500 text-sm">Halcón: <span className="font-medium text-falcon-brown">{p.falconName || "Introduce el nombre del halcón"}</span></p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="inline-block px-4 py-2 bg-green-50 text-field-green rounded-xl font-black text-xl">
                      {p.totalPoints.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedFlight(p)}
                      className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-field-green hover:text-white transition"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedFlight && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-falcon-brown text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Detalles del Vuelo</h3>
                <p className="opacity-75">{selectedFlight.falconerName} - {selectedFlight.falconName}</p>
              </div>
              <button onClick={() => setSelectedFlight(null)} className="p-2 hover:bg-white/10 rounded-full transition"><X /></button>
            </div>
            
            <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh]">
              {/* Primary Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-2xl border bg-gray-50 border-gray-100">
                  <div className="flex items-center gap-2 opacity-60 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">T. Vuelo</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black">{formatTime(selectedFlight.tiempoVuelo).mins}</span>
                    <span className="text-xs font-bold text-gray-400">m</span>
                    <span className="text-lg font-bold ml-1">{formatTime(selectedFlight.tiempoVuelo).secs}</span>
                    <span className="text-[10px] font-bold text-gray-400">s</span>
                  </div>
                </div>
                <DetailBox icon={<Navigation className="w-4 h-4" />} label="H. Servicio" value={`${selectedFlight.alturaServicio}m`} />
                <DetailBox icon={<Zap className="w-4 h-4" />} label="Veloc. Picado" value={`${selectedFlight.velocidadPicado}km/h`} />
                <DetailBox icon={<ArrowUpCircle className="w-4 h-4" />} label="Remontada" value={`${SCORING.calculateRemontadaValue(selectedFlight.alturaServicio, selectedFlight.tiempoVuelo).toFixed(1)}m/min`} />
                <DetailBox icon={<Medal className="w-4 h-4" />} label="Puntos" value={selectedFlight.totalPoints.toFixed(2)} highlight />
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-bold border-b pb-2 uppercase text-xs tracking-widest text-gray-400 mb-4">Desglose de Cálculos Técnicos</h4>
                  <div className="space-y-2 text-sm">
                    <CalculationRow label="Puntos por Altura (0.1 pts/m)" val={SCORING.calculateAlturaPoints(selectedFlight.alturaServicio)} />
                    <CalculationRow label="Puntos por Distancia/Posición" val={SCORING.calculateServicioPoints(selectedFlight.distanciaServicio)} />
                    <CalculationRow label="Puntos por Velocidad de Picado" val={SCORING.calculatePicadoPoints(selectedFlight.velocidadPicado)} />
                    <CalculationRow label="Puntos por Remontada (Ascensión)" val={SCORING.calculateRemontadaPoints(SCORING.calculateRemontadaValue(selectedFlight.alturaServicio, selectedFlight.tiempoVuelo))} />
                    {selectedFlight.capturaType && (
                      <CalculationRow 
                        label={`Captura (${CAPTURA_LABELS[selectedFlight.capturaType]})`} 
                        val={SCORING.calculateCapturaPoints(selectedFlight.capturaType, selectedFlight.alturaServicio)} 
                      />
                    )}
                  </div>
                </div>

                {/* Detailed Bonuses */}
                <div className="bg-green-50 p-5 rounded-2xl border border-green-100 shadow-sm">
                   <h5 className="text-green-800 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-4">
                     <CheckCircle className="w-4 h-4" /> Bonificaciones Aplicadas
                   </h5>
                   <div className="space-y-3">
                     <div className="flex flex-col gap-1">
                        <CalculationRow label="Recogida sin dudas ni desplazamiento" val={selectedFlight['bon recogida']} isPositive />
                        <p className="text-[10px] text-green-600 italic">Puntuación otorgada por el juez en la recogida.</p>
                     </div>
                     <div className="flex flex-col gap-1 pt-2 border-t border-green-200/50">
                        <CalculationRow label="Eficiencia de Tiempo (Bono Turno)" val={SCORING.calculateTimeBonus(selectedFlight.tiempoVuelo)} isPositive />
                        <p className="text-[10px] text-green-600 italic">Premio por completar el vuelo en tiempo óptimo.</p>
                     </div>
                   </div>
                </div>

                {/* Detailed Penalties */}
                <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
                   <h5 className="text-red-800 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-4">
                     <AlertCircle className="w-4 h-4" /> Penalizaciones Aplicadas
                   </h5>
                   <div className="space-y-3">
                     {selectedFlight.penSenueloEncarnado && (
                       <div className="flex flex-col gap-1">
                         <CalculationRow label="Señuelo encarnado (+1/3 paloma)" val={4} isNegative />
                         <p className="text-[10px] text-red-600 italic">Penalización fija por exceso de encarnado.</p>
                       </div>
                     )}
                     {selectedFlight.penEnsenarSenuelo && (
                       <div className="flex flex-col gap-1 pt-2 border-t border-red-200/50">
                         <CalculationRow label="Enseñar señuelo" val={6} isNegative />
                         <p className="text-[10px] text-red-600 italic">Penalización reglamentaria por mostrar el señuelo.</p>
                       </div>
                     )}
                     {selectedFlight.penSueltaObligada && (
                       <div className="flex flex-col gap-1 pt-2 border-t border-red-200/50">
                         <CalculationRow label="Suelta obligada (8 min)" val={10} isNegative />
                         <p className="text-[10px] text-red-600 italic">Exceso de tiempo sin captura voluntaria.</p>
                       </div>
                     )}
                     {selectedFlight.penPicado > 0 && (
                       <div className="flex flex-col gap-1 pt-2 border-t border-red-200/50">
                         <CalculationRow label="Valoración Juez respecto al picado" val={selectedFlight.penPicado} isNegative />
                         <p className="text-[10px] text-red-600 italic">Puntos descontados por la calidad técnica del picado.</p>
                       </div>
                     )}
                     {selectedFlight.penPicado === 0 && !selectedFlight.penSenueloEncarnado && !selectedFlight.penEnsenarSenuelo && !selectedFlight.penSueltaObligada && (
                       <p className="text-sm text-red-400 italic font-medium">No se han registrado penalizaciones en este vuelo.</p>
                     )}
                   </div>
                </div>
              </div>

              {Object.values(selectedFlight.disqualifications).some(v => v) && (
                <div className="bg-red-900 text-white p-6 rounded-2xl shadow-xl border-2 border-red-500">
                  <h5 className="font-bold text-base uppercase flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-6 h-6" /> DESCALIFICACIÓN REGLAMENTARIA
                  </h5>
                  <div className="space-y-2">
                    <p className="text-sm font-medium border-b border-white/20 pb-2">Motivos detectados por el juez:</p>
                    <ul className="text-sm space-y-2 list-disc list-inside opacity-90 pl-2">
                      {selectedFlight.disqualifications.superar10min && <li>Superar los 10 minutos de vuelo reglamentarios sin recogida.</li>}
                      {selectedFlight.disqualifications.ensenarVivos && <li>Enseñar palomas o señuelos vivos durante el ejercicio.</li>}
                      {selectedFlight.disqualifications.conductaAntideportiva && <li>Conducta antideportiva, falta de ética o respeto a jueces/concursantes.</li>}
                      {selectedFlight.disqualifications.noComparecer && <li>No comparecer al turno tras el segundo llamamiento.</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailBox = ({ icon, label, value, highlight = false }: { icon: any, label: string, value: string, highlight?: boolean }) => (
  <div className={`p-4 rounded-2xl border ${highlight ? 'bg-field-green text-white border-field-green shadow-lg' : 'bg-gray-50 border-gray-100'}`}>
    <div className="flex items-center gap-2 opacity-60 mb-1">
      {icon}
      <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
    </div>
    <span className="text-lg font-black">{value}</span>
  </div>
);

const CalculationRow = ({ label, val, isPositive = false, isNegative = false }: { label: string, val: number, isPositive?: boolean, isNegative?: boolean }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-gray-600">{label}</span>
    <span className={`font-bold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-900'}`}>
      {isNegative ? '-' : isPositive ? '+' : ''}{val.toFixed(2)}
    </span>
  </div>
);

export default PublicView;
