
import React, { useState, useEffect } from 'react';
import { FlightData, CapturaType } from '../types.ts';
import { SCORING, CAPTURA_LABELS } from '../constants.ts';
import { Save, AlertTriangle, Check, ShieldAlert, Zap, ArrowUp, Timer, MapPin } from 'lucide-react';

interface Props {
  flight: FlightData;
  onSave: (data: FlightData) => void;
  onCancel: () => void;
}

const FlightScoringForm: React.FC<Props> = ({ flight, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FlightData>({ ...flight });

  // Cálculos en tiempo real
  const alturaPts = SCORING.calculateAlturaPoints(formData.alturaServicio || 0);
  const servicioPts = SCORING.calculateServicioPoints(formData.distanciaServicio || 0);
  const picadoPts = SCORING.calculatePicadoPoints(formData.velocidadPicado || 0);
  const remontadaVal = SCORING.calculateRemontadaValue(formData.alturaServicio || 0, formData.tiempoVuelo || 0);
  const remontadaPts = SCORING.calculateRemontadaPoints(remontadaVal);
  const capturaPts = formData.capturaType ? SCORING.calculateCapturaPoints(formData.capturaType, formData.alturaServicio || 0) : 0;
  const turnBonus = SCORING.calculateTimeBonus(formData.tiempoVuelo || 0);
  
  const totalBon = (formData['bon recogida'] || 0) + turnBonus;
  const totalPen = (formData.penSenueloEncarnado ? 4 : 0) + 
                   (formData.penEnsenarSenuelo ? 6 : 0) + 
                   (formData.penSueltaObligada ? 10 : 0) + 
                   (formData.penPicado || 0);

  const calculatedTotal = alturaPts + servicioPts + picadoPts + remontadaPts + capturaPts + totalBon - totalPen;
  const isDisqualified = Object.values(formData.disqualifications).some(v => v);

  useEffect(() => {
    setFormData(prev => ({ ...prev, totalPoints: isDisqualified ? 0 : Number(calculatedTotal.toFixed(2)) }));
  }, [calculatedTotal, isDisqualified]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Nombre del Halcón</label>
          <input placeholder="Halcón" value={formData.falconName} onChange={e => setFormData({...formData, falconName: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-field-green outline-none transition-all" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Nombre del Cetrero</label>
          <input placeholder="Cetrero" value={formData.falconerName} onChange={e => setFormData({...formData, falconerName: e.target.value})} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-field-green outline-none transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><ArrowUp className="w-3 h-3"/> Altura (m)</label>
          <input type="number" value={formData.alturaServicio || ''} onChange={e => setFormData({...formData, alturaServicio: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-lg" />
          <p className="text-[9px] text-gray-400">+{alturaPts.toFixed(2)} pts</p>
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><Zap className="w-3 h-3"/> Picado (km/h)</label>
          <input type="number" value={formData.velocidadPicado || ''} onChange={e => setFormData({...formData, velocidadPicado: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-lg" />
          <p className="text-[9px] text-gray-400">+{picadoPts.toFixed(2)} pts</p>
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><Timer className="w-3 h-3"/> Tiempo (s)</label>
          <input type="number" value={formData.tiempoVuelo || ''} onChange={e => setFormData({...formData, tiempoVuelo: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-lg" />
          <p className="text-[9px] text-gray-400">+{remontadaPts.toFixed(2)} pts Remont.</p>
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><MapPin className="w-3 h-3"/> Distancia (m)</label>
          <input type="number" value={formData.distanciaServicio || ''} onChange={e => setFormData({...formData, distanciaServicio: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-lg" />
          <p className="text-[9px] text-gray-400">+{servicioPts.toFixed(2)} pts Posición</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 border-b pb-2">Evaluación de Captura</h4>
          <div className="grid gap-2">
            {Object.keys(CapturaType).map((typeKey) => {
              const typeValue = CapturaType[typeKey as keyof typeof CapturaType];
              const isSelected = formData.capturaType === typeValue;
              return (
                <label key={typeKey} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-field-green bg-green-50 shadow-md' : 'border-transparent bg-gray-50 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" className="w-4 h-4 accent-field-green" checked={isSelected} onChange={() => setFormData({...formData, capturaType: typeValue})} />
                    <span className="text-xs font-bold">{CAPTURA_LABELS[typeValue]}</span>
                  </div>
                  {isSelected && <span className="text-[10px] font-black text-field-green">+{capturaPts.toFixed(2)}</span>}
                </label>
              );
            })}
            <button onClick={() => setFormData({...formData, capturaType: null})} className="text-[10px] text-gray-400 uppercase font-bold text-right hover:text-red-500">Limpiar Captura</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4">
            <h4 className="text-red-800 font-bold text-xs uppercase tracking-widest flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Penalizaciones Técnicas</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-2 text-xs font-bold text-red-700 p-2 hover:bg-white/50 rounded-lg cursor-pointer">
                <div className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4" checked={formData.penSenueloEncarnado} onChange={e => setFormData({...formData, penSenueloEncarnado: e.target.checked})} /> Señuelo encarnado</div>
                <span>-4 pts</span>
              </label>
              <label className="flex items-center justify-between gap-2 text-xs font-bold text-red-700 p-2 hover:bg-white/50 rounded-lg cursor-pointer">
                <div className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4" checked={formData.penEnsenarSenuelo} onChange={e => setFormData({...formData, penEnsenarSenuelo: e.target.checked})} /> Enseñar señuelo</div>
                <span>-6 pts</span>
              </label>
              <label className="flex items-center justify-between gap-2 text-xs font-bold text-red-700 p-2 hover:bg-white/50 rounded-lg cursor-pointer">
                <div className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4" checked={formData.penSueltaObligada} onChange={e => setFormData({...formData, penSueltaObligada: e.target.checked})} /> Suelta obligada</div>
                <span>-10 pts</span>
              </label>
            </div>
          </div>
          
          <div className="bg-gray-900 text-white p-6 rounded-2xl space-y-3 shadow-2xl">
            <h4 className="text-orange-400 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">Protocolo de Descalificación</h4>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase p-2 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                <input type="checkbox" className="accent-orange-500" checked={formData.disqualifications.superar10min} onChange={e => setFormData({...formData, disqualifications: {...formData.disqualifications, superar10min: e.target.checked}})}/> Exceso Tiempo
              </label>
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase p-2 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                <input type="checkbox" className="accent-orange-500" checked={formData.disqualifications.conductaAntideportiva} onChange={e => setFormData({...formData, disqualifications: {...formData.disqualifications, conductaAntideportiva: e.target.checked}})}/> Antideportiva
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100 gap-6">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Puntuación Total Estimada</span>
          <div className={`text-5xl font-black transition-all ${isDisqualified ? 'text-red-500 scale-110' : 'text-field-green'}`}>
            {isDisqualified ? 'DESC.' : formData.totalPoints.toFixed(2)}
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={onCancel} className="flex-1 md:flex-none px-8 py-4 border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 md:flex-none bg-field-green text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-green-800 transition-all shadow-xl shadow-green-900/20">
            <Save className="w-5 h-5" /> Registrar Vuelo
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlightScoringForm;
