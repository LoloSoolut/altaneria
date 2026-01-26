
import React, { useState } from 'react';
import { AppState, FlightData } from '../types.ts';
import { Trophy, Medal, Search, X, Clock, Navigation, Zap, ArrowUpCircle } from 'lucide-react';
import { SCORING, CAPTURA_LABELS } from '../constants.ts';

interface Props {
  state: AppState;
}

const PublicView: React.FC<Props> = ({ state }) => {
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const champ = state.championships.find(c => c.id === state.publicChampionshipId);

  if (!champ) {
    return (
      <div className="text-center py-20">
        <Trophy className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-400">Sin campeonatos públicos</h3>
      </div>
    );
  }

  const participants = [...champ.participants].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-black text-field-green">{champ.name}</h2>
        <p className="text-gray-500">{champ.location} • {champ.date}</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-falcon-brown text-white text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Pos</th>
              <th className="px-6 py-3">Cetrero / Halcón</th>
              <th className="px-6 py-3 text-center">Puntos</th>
              <th className="px-6 py-3 text-right">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {participants.map((p, i) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-black text-gray-200">{i + 1}</td>
                <td className="px-6 py-4">
                  <p className="font-bold">{p.falconerName}</p>
                  <p className="text-xs text-gray-400 italic">{p.falconName}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-black text-field-green">{p.totalPoints.toFixed(2)}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setSelectedFlight(p)} className="p-2 bg-gray-100 rounded-full">
                    <Search className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedFlight && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-falcon-brown text-white p-4 flex justify-between items-center">
              <h3 className="font-bold">{selectedFlight.falconerName}</h3>
              <button onClick={() => setSelectedFlight(null)}><X /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Altura</p>
                  <p className="text-lg font-black">{selectedFlight.alturaServicio}m</p>
                </div>
                <div className="p-3 border rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Velocidad</p>
                  <p className="text-lg font-black">{selectedFlight.velocidadPicado}km/h</p>
                </div>
              </div>
              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between"><span>Altura (0.1/m)</span><span className="font-bold">{SCORING.calculateAlturaPoints(selectedFlight.alturaServicio).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Picado</span><span className="font-bold">{SCORING.calculatePicadoPoints(selectedFlight.velocidadPicado).toFixed(2)}</span></div>
                {selectedFlight.capturaType && (
                  <div className="flex justify-between text-green-600"><span>Captura: {CAPTURA_LABELS[selectedFlight.capturaType]}</span><span className="font-bold">+{SCORING.calculateCapturaPoints(selectedFlight.capturaType, selectedFlight.alturaServicio).toFixed(2)}</span></div>
                )}
              </div>
              <div className="text-center pt-4 border-t">
                <p className="text-3xl font-black text-field-green">{selectedFlight.totalPoints.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicView;
