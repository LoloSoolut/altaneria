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
    <div className="space-y-8 animate-in fade-in duration-500 px-1 pb-32 no-scrollbar">
      {/* 1. Datos del Competidor */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 tracking-widest">Nombre del Halcón</label>
          <input 
            placeholder="Nombre" 
            value={formData.falconName} 
            onChange={e => setFormData({...formData, falconName: e.target.value})} 
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-field-green outline-none transition-all font-medium text-sm md:text-base" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 tracking-widest">Cetrero Profesional</label>
          <input 
            placeholder="Apellidos, Nombre" 
            value={formData.falconerName} 
            onChange={e => setFormData({...formData, falconerName: e.target.value})} 
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-field-green outline-none transition-all font-medium text-sm md:text-base" 
          />
        </div>
      </section>

      {/* 2. Métricas de Campo */}
      <section className="bg-gray-50 p-4 md:p-6 rounded-3xl border border-gray-100 shadow-inner">
        <h4 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">Métricas de Vuelo</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><ArrowUp className="w-3 h-3"/> Altura (m)</label>
            <input type="number" value={formData.alturaServicio || ''} onChange={e => setFormData({...formData, alturaServicio: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-base md:text-lg focus:ring-2 focus:ring-field-green outline-none" />
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">+{alturaPts.toFixed(2)} pts</p>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><Zap className="w-3 h-3"/> Picado (km/h)</label>
            <input type="number" value={formData.velocidadPicado || ''} onChange={e => setFormData({...formData, velocidadPicado: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-base md:text-lg focus:ring-2 focus:ring-field-green outline-none" />
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">+{picadoPts.toFixed(2)} pts</p>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><Timer className="w-3 h-3"/> Tiempo (s)</label>
            <input type="number" value={formData.tiempoVuelo || ''} onChange={e => setFormData({...formData, tiempoVuelo: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-base md:text-lg focus:ring-2 focus:ring-field-green outline-none" />
            <p className="text-[9px] font-black text-field-green uppercase truncate">{formatTimeDisplay(formData.tiempoVuelo)}</p>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><Hourglass className="w-3 h-3"/> Cortesía (s)</label>
            <input type="number" value={formData.tiempoCortesia || ''} onChange={e => setFormData({...formData, tiempoCortesia: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-base md:text-lg focus:ring-2 focus:ring-field-green outline-none" />
          </div>
          <div className="space-y-1 col-span-2 md:col-span-1">
            <label className="flex items-center gap-1.5 text-[10px] uppercase font-black text-field-green mb-1"><MapPin className="w-3 h-3"/> Distancia</label>
            <input type="number" value={formData.distanciaServicio || ''} onChange={e => setFormData({...formData, distanciaServicio: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-xl font-bold text-base md:text-lg focus:ring-2 focus:ring-field-green outline-none" />
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">+{servicioPts.toFixed(2)} pts Pos.</p>
          </div>
        </div>
      </section>

      {/* 3. Resultado de la Caza */}
      <section className="space-y-4">
        <h4 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 border-b pb-2 flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-field-green" /> Resultado de la Caza
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.keys(CapturaType).map((typeKey) => {
            const typeValue = CapturaType[typeKey as keyof typeof CapturaType];
            const isSelected = formData.capturaType === typeValue;
            return (
              <label key={typeKey} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer h-full ${isSelected ? 'border-field-green bg-green-50 shadow-md ring-2 ring-field-green/10' : 'border-transparent bg-white shadow-sm hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="captura" className="w-4 h-4 accent-field-green" checked={isSelected} onChange={() => setFormData({...formData, capturaType: typeValue})} />
                  <span className="text-[11px] font-bold uppercase leading-tight">{CAPTURA_LABELS[typeValue]}</span>
                </div>
                {isSelected && <span className="text-[10px] font-black text-field-green">+{capturaPts.toFixed(2)}</span>}
              </label>
            );
          })}
        </div>
        <button onClick={() => setFormData({...formData, capturaType: null})} className="text-[10px] text-gray-400 uppercase font-black tracking-widest hover:text-red-500 py-1 flex items-center gap-1">
          <Minus className="w-3 h-3" /> Limpiar Selección de Caza
        </button>
      </section>

      {/* 4. Bonificaciones */}
      <section className="space-y-4 pt-4">
        <h4 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 border-b pb-2 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" /> Bonificaciones Extra
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recogida sin dudas</span>
                <p className="text-[9px] text-gray-400 font-bold uppercase italic">Evaluación Manual</p>
              </div>
              <span className="text-2xl font-black text-field-green">{bonRecogida} <span className="text-[10px]">pts</span></span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="4" 
              step="1" 
              value={bonRecogida} 
              onChange={e => setFormData({...formData, 'bon recogida': Number(e.target.value)})} 
              className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-field-green"
            />
          </div>

          <div className="bg-green-50/50 p-5 rounded-3xl border border-green-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-field-green shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Bono por Tiempo</p>
                <p className="text-[9px] text-gray-400 mt-1 font-bold italic">Sistema Automático</p>
              </div>
            </div>
            <div className="text-2xl font-black text-field-green">+{turnBonus} <span className="text-[10px]">pts</span></div>
          </div>
        </div>
      </section>

      {/* 5. Penalizaciones Técnicas */}
      <section className="space-y-4 pt-4">
        <h4 className="text-red-800 font-bold text-[10px] uppercase tracking-widest border-b border-red-100 pb-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600"/> Penalizaciones Técnicas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            {[
              { id: 'penSenueloEncarnado', label: 'Señuelo encarnado', pts: 4 },
              { id: 'penEnsenarSenuelo', label: 'Enseñar señuelo', pts: 6 },
              { id: 'penSueltaObligada', label: 'Suelta obligada', pts: 10 }
            ].map(pen => (
              <label key={pen.id} className="flex items-center justify-between gap-3 text-[11px] font-black uppercase text-red-700 p-4 bg-white border border-red-100 rounded-2xl cursor-pointer hover:bg-red-50 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded accent-red-600" 
                    checked={(formData as any)[pen.id]} 
                    onChange={e => setFormData({...formData, [pen.id]: e.target.checked})} 
                  /> 
                  {pen.label}
                </div>
                <span className="flex items-center gap-1 opacity-60"><Minus className="w-3 h-3"/> {pen.pts}.0</span>
              </label>
            ))}
          </div>

          <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-red-900" />
                <div>
                  <span className="text-[10px] font-black text-red-900 uppercase tracking-widest block">Calidad del Picado</span>
                  <p className="text-[9px] text-red-700 font-bold uppercase italic opacity-60">Valoración Juez</p>
                </div>
              </div>
              <span className="text-2xl font-black text-red-600 flex items-center gap-1">
                <Minus className="w-4 h-4" />{formData.penPicado || 0}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="5" 
              step="0.5" 
              value={formData.penPicado || 0} 
              onChange={e => setFormData({...formData, penPicado: Number(e.target.value)})} 
              className="w-full h-3 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <div className="flex justify-between mt-2 px-1 text-[8px] font-black text-red-300">
              <span>EXCELENTE (0)</span>
              <span>DEFICIENTE (-5)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Descalificaciones Directas */}
      <section className="bg-black text-white p-6 md:p-8 rounded-[32px] border-2 border-red-600 shadow-2xl space-y-4">
        <h4 className="text-red-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-4">
          <AlertTriangle className="w-5 h-5"/> Reglamento de Descalificación Directa
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'superar10min', label: 'Superar 10 min sin persecución y no recoge' },
            { key: 'ensenarVivos', label: 'Enseñar paloma o señuelos vivos' },
            { key: 'conductaAntideportiva', label: 'Conducta antideportiva / Falta respeto' },
            { key: 'noComparecer', label: 'No comparecer tras avisos oficiales' }
          ].map(item => (
            <label key={item.key} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-6 h-6 mt-0.5 rounded accent-red-600 border-none" 
                checked={(formData.disqualifications as any)[item.key]} 
                onChange={e => setFormData({
                  ...formData, 
                  disqualifications: { ...formData.disqualifications, [item.key]: e.target.checked }
                })} 
              />
              <span className="text-[10px] font-black leading-snug uppercase tracking-tight group-hover:text-red-400 transition-colors">{item.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 7. Footer de Puntuación (Sticky en Móvil) */}
      <div className={`fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto z-[60] flex flex-col md:flex-row justify-between items-center bg-white md:bg-gray-100/50 p-6 md:p-8 border-t border-gray-100 gap-6 md:rounded-3xl shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-none transition-colors ${isDisqualified ? 'border-red-200 bg-red-50' : ''}`}>
        <div className="flex flex-col items-center md:items-start w-full md:w-auto">
          <span className="text-[10px] uppercase font-black text-gray-400 tracking-[0.4em] mb-1 italic">
            {isDisqualified ? 'ESTADO COMPETICIÓN' : 'PUNTUACIÓN TÉCNICA TOTAL'}
          </span>
          <div className={`text-5xl md:text-7xl font-black transition-all leading-none ${isDisqualified ? 'text-red-600 animate-pulse' : 'text-field-green'}`}>
            {isDisqualified ? 'DESC.' : formData.totalPoints.toFixed(2)}
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={onCancel} className="flex-1 md:flex-none px-8 py-5 border-2 border-gray-200 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-50 bg-white">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 md:flex-none bg-field-green text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-green-800 transition-all shadow-xl shadow-green-900/20 active:scale-95">
            <Save className="w-5 h-5" /> Firmar Acta
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlightScoringForm;