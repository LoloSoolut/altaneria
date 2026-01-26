
import React, { useState, useEffect } from 'react';
import { FlightData, CapturaType } from '../types.ts';
import { SCORING, CAPTURA_LABELS } from '../constants.ts';
import { 
  Save, 
  ShieldAlert, 
  Zap, 
  ArrowUp, 
  Timer, 
  MapPin, 
  BadgeCheck, 
  Minus, 
  Plus, 
  Hourglass, 
  Star, 
  Clock, 
  AlertTriangle,
  Gavel
} from 'lucide-react';

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
  const bonRecogida = formData['bon recogida'] || 0;
  const totalBon = bonRecogida + turnBonus;

  const totalPen = (formData.penSenueloEncarnado ? 4 : 0) + 
                   (formData.penEnsenarSenuelo ? 6 : 0) + 
                   (formData.penSueltaObligada ? 10 : 0) + 
                   (formData.penPicado || 0);

  const calculatedTotal = alturaPts + servicioPts + picadoPts + remontadaPts + capturaPts + totalBon - totalPen;
  
  // Lógica de descalificación
  const isDisqualified = Object.values(formData.disqualifications).some(v => v);

  const formatTimeDisplay = (seconds: number) => {
    if (!seconds) return "0 min 0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs}s`;
  };

  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      totalPoints: isDisqualified ? 0 : Number(calculatedTotal.toFixed(2)) 
    }));
  }, [calculatedTotal, isDisqualified]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
      {/* Datos del Competidor */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 tracking-widest">Nombre del Halcón</label>
          <input 
            placeholder="Nombre" 
            value={formData.falconName} 
            onChange={e => setFormData({...formData, falconName: e.target.value})} 
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-field-green outline-none transition-all font-medium" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 tracking-widest">Cetrero Profesional</label>
          <input 
            placeholder="Apellidos, Nombre" 
            value={formData.falconerName} 
            onChange={e => setFormData({...formData, falconerName: e.target.value})} 
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-field-green outline-none transition-all font-medium" 
          />
        </div>
      </div>

      {/* Métricas de Campo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-inner">
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><ArrowUp className="w-3 h-3"/> Altura (m)</label>
          <input type="number" value={formData.alturaServicio || ''} onChange={e => setFormData({...formData, alturaServicio: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-lg focus:ring-2 focus:ring-field-green outline-none" />
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">+{alturaPts.toFixed(2)} pts</p>
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><Zap className="w-3 h-3"/> Picado (km/h)</label>
          <input type="number" value={formData.velocidadPicado || ''} onChange={e => setFormData({...formData, velocidadPicado: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-lg focus:ring-2 focus:ring-field-green outline-none" />
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">+{picadoPts.toFixed(2)} pts</p>
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><Timer className="w-3 h-3"/> Tiempo (s)</label>
          <input type="number" value={formData.tiempoVuelo || ''} onChange={e => setFormData({...formData, tiempoVuelo: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-lg focus:ring-2 focus:ring-field-green outline-none" />
          <div className="flex justify-between items-center mt-1">
            <p className="text-[10px] font-black text-field-green">{formatTimeDisplay(formData.tiempoVuelo)}</p>
          </div>
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><Hourglass className="w-3 h-3"/> Cortesía (s)</label>
          <input type="number" value={formData.tiempoCortesia || ''} onChange={e => setFormData({...formData, tiempoCortesia: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-lg focus:ring-2 focus:ring-field-green outline-none" />
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">T. Cortesía</p>
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><MapPin className="w-3 h-3"/> Distancia de Servicio</label>
          <input type="number" value={formData.distanciaServicio || ''} onChange={e => setFormData({...formData, distanciaServicio: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-lg focus:ring-2 focus:ring-field-green outline-none" />
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">+{servicioPts.toFixed(2)} pts Pos.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 border-b pb-2 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Bonificaciones</h4>
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recogida sin dudas</span>
                  <span className="text-xl font-black text-field-green">{bonRecogida} <span className="text-xs">pts</span></span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="4" 
                  step="1" 
                  value={bonRecogida} 
                  onChange={e => setFormData({...formData, 'bon recogida': Number(e.target.value)})} 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-field-green"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-field-green shadow-sm">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Bono Tiempo no usado</p>
                    <p className="text-[9px] text-gray-400 mt-1 font-bold italic">Auto-calculado por sistema</p>
                  </div>
                </div>
                <div className="text-xl font-black text-field-green">+{turnBonus} <span className="text-[10px]">pts</span></div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 border-b pb-2">Resultado de la Caza</h4>
            <div className="grid gap-2">
              {Object.keys(CapturaType).map((typeKey) => {
                const typeValue = CapturaType[typeKey as keyof typeof CapturaType];
                const isSelected = formData.capturaType === typeValue;
                return (
                  <label key={typeKey} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-field-green bg-green-50 shadow-md' : 'border-transparent bg-gray-50 opacity-60 hover:opacity-100'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="captura" className="w-4 h-4 accent-field-green" checked={isSelected} onChange={() => setFormData({...formData, capturaType: typeValue})} />
                      <span className="text-xs font-bold">{CAPTURA_LABELS[typeValue]}</span>
                    </div>
                    {isSelected && <span className="text-[10px] font-black text-field-green">+{capturaPts.toFixed(2)}</span>}
                  </label>
                );
              })}
              <button onClick={() => setFormData({...formData, capturaType: null})} className="text-[10px] text-gray-400 uppercase font-bold text-right hover:text-red-500 py-1">Limpiar Captura</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-red-50 p-6 rounded-3xl border border-red-100 space-y-4 shadow-sm">
            <h4 className="text-red-800 font-bold text-xs uppercase tracking-widest flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Penalizaciones Técnicas</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-2 text-xs font-bold text-red-700 p-3 bg-white/40 border border-red-200/30 rounded-xl cursor-pointer hover:bg-white/60 transition-all">
                <div className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 rounded accent-red-600" checked={formData.penSenueloEncarnado} onChange={e => setFormData({...formData, penSenueloEncarnado: e.target.checked})} /> Señuelo encarnado</div>
                <span className="flex items-center gap-1 font-black"><Minus className="w-3 h-3"/> 4.0</span>
              </label>
              <label className="flex items-center justify-between gap-2 text-xs font-bold text-red-700 p-3 bg-white/40 border border-red-200/30 rounded-xl cursor-pointer hover:bg-white/60 transition-all">
                <div className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 rounded accent-red-600" checked={formData.penEnsenarSenuelo} onChange={e => setFormData({...formData, penEnsenarSenuelo: e.target.checked})} /> Enseñar señuelo</div>
                <span className="flex items-center gap-1 font-black"><Minus className="w-3 h-3"/> 6.0</span>
              </label>
              <label className="flex items-center justify-between gap-2 text-xs font-bold text-red-700 p-3 bg-white/40 border border-red-200/30 rounded-xl cursor-pointer hover:bg-white/60 transition-all">
                <div className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 rounded accent-red-600" checked={formData.penSueltaObligada} onChange={e => setFormData({...formData, penSueltaObligada: e.target.checked})} /> Suelta obligada</div>
                <span className="flex items-center gap-1 font-black"><Minus className="w-3 h-3"/> 10.0</span>
              </label>
            </div>

            {/* SECCIÓN AÑADIDA: VALORACIÓN DEL JUEZ RESPECTO AL PICADO */}
            <div className="mt-6 pt-4 border-t border-red-200/50">
              <div className="flex items-center gap-2 mb-3">
                <Gavel className="w-4 h-4 text-red-800" />
                <span className="text-[10px] font-black text-red-900 uppercase tracking-widest">Valoración del Juez (Picado)</span>
              </div>
              <div className="bg-white/60 p-5 rounded-2xl border border-red-200/30">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-bold text-red-800 uppercase italic">Calidad y agresividad</span>
                  <span className="text-xl font-black text-red-600 flex items-center gap-1">
                    <Minus className="w-4 h-4" />{formData.penPicado || 0} <span className="text-[10px]">pts</span>
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="5" 
                  step="0.5" 
                  value={formData.penPicado || 0} 
                  onChange={e => setFormData({...formData, penPicado: Number(e.target.value)})} 
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <div className="flex justify-between mt-2 px-1">
                  <span className="text-[8px] font-black text-red-300">EXCELENTE (0)</span>
                  <span className="text-[8px] font-black text-red-300">DEFICIENTE (5)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black text-white p-6 rounded-3xl border-2 border-red-600 shadow-xl space-y-4">
            <h4 className="text-red-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-3">
              <AlertTriangle className="w-4 h-4"/> Descalificaciones Directas (Reglamento)
            </h4>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 mt-0.5 rounded accent-red-600" 
                  checked={formData.disqualifications.superar10min} 
                  onChange={e => setFormData({
                    ...formData, 
                    disqualifications: { ...formData.disqualifications, superar10min: e.target.checked }
                  })} 
                />
                <span className="text-[10px] font-bold leading-tight uppercase group-hover:text-red-400 transition-colors">Superar 10 min sin persecución y no recoge en punto de servicio</span>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 mt-0.5 rounded accent-red-600" 
                  checked={formData.disqualifications.ensenarVivos} 
                  onChange={e => setFormData({
                    ...formData, 
                    disqualifications: { ...formData.disqualifications, ensenarVivos: e.target.checked }
                  })} 
                />
                <span className="text-[10px] font-bold leading-tight uppercase group-hover:text-red-400 transition-colors">Enseñar paloma o señuelos vivos</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 mt-0.5 rounded accent-red-600" 
                  checked={formData.disqualifications.conductaAntideportiva} 
                  onChange={e => setFormData({
                    ...formData, 
                    disqualifications: { ...formData.disqualifications, conductaAntideportiva: e.target.checked }
                  })} 
                />
                <span className="text-[10px] font-bold leading-tight uppercase group-hover:text-red-400 transition-colors">Conducta antideportiva / Falta de respeto a jueces o concursantes</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 mt-0.5 rounded accent-red-600" 
                  checked={formData.disqualifications.noComparecer} 
                  onChange={e => setFormData({
                    ...formData, 
                    disqualifications: { ...formData.disqualifications, noComparecer: e.target.checked }
                  })} 
                />
                <span className="text-[10px] font-bold leading-tight uppercase group-hover:text-red-400 transition-colors">No comparecer tras ser llamado 2 veces y pasado 1 minuto</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100 gap-6 p-8 rounded-b-3xl transition-colors ${isDisqualified ? 'bg-red-50' : 'bg-gray-50/50'}`}>
        <div className="flex flex-col items-center md:items-start">
          <span className="text-[10px] uppercase font-black text-gray-400 tracking-[0.4em] mb-1 italic">
            {isDisqualified ? 'Estado de Descalificación' : 'Puntuación Técnica Final'}
          </span>
          <div className={`text-7xl font-black transition-all ${isDisqualified ? 'text-red-600 animate-pulse' : 'text-field-green'}`}>
            {isDisqualified ? 'DESC.' : formData.totalPoints.toFixed(2)}
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={onCancel} className="flex-1 md:flex-none px-8 py-4 border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-100 transition-colors uppercase text-xs tracking-widest text-gray-400">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 md:flex-none bg-field-green text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-green-800 transition-all shadow-xl shadow-green-900/20 active:scale-95">
            <Save className="w-5 h-5" /> Firmar Acta de Vuelo
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlightScoringForm;
