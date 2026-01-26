
import React, { useState, useEffect } from 'react';
import { FlightData, CapturaType } from '../types.ts';
import { SCORING, CAPTURA_LABELS } from '../constants.ts';
import { Save, AlertTriangle, Check, ShieldAlert } from 'lucide-react';

interface Props {
  flight: FlightData;
  onSave: (data: FlightData) => void;
  onCancel: () => void;
}

const FlightScoringForm: React.FC<Props> = ({ flight, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FlightData>({ ...flight });

  const alturaPts = SCORING.calculateAlturaPoints(formData.alturaServicio);
  const servicioPts = SCORING.calculateServicioPoints(formData.distanciaServicio);
  const picadoPts = SCORING.calculatePicadoPoints(formData.velocidadPicado);
  const remontadaVal = SCORING.calculateRemontadaValue(formData.alturaServicio, formData.tiempoVuelo);
  const remontadaPts = SCORING.calculateRemontadaPoints(remontadaVal);
  const capturaPts = formData.capturaType ? SCORING.calculateCapturaPoints(formData.capturaType, formData.alturaServicio) : 0;
  const turnBonus = SCORING.calculateTimeBonus(formData.tiempoVuelo);
  
  const totalBon = formData['bon recogida'] + turnBonus;
  const totalPen = (formData.penSenueloEncarnado ? 4 : 0) + 
                   (formData.penEnsenarSenuelo ? 6 : 0) + 
                   (formData.penSueltaObligada ? 10 : 0) + 
                   formData.penPicado;

  const calculatedTotal = alturaPts + servicioPts + picadoPts + remontadaPts + capturaPts + totalBon - totalPen;
  const isDisqualified = Object.values(formData.disqualifications).some(v => v);

  useEffect(() => {
    setFormData(prev => ({ ...prev, totalPoints: isDisqualified ? 0 : calculatedTotal }));
  }, [calculatedTotal, isDisqualified]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <input placeholder="Halcón" value={formData.falconName} onChange={e => setFormData({...formData, falconName: e.target.value})} className="px-4 py-2 border rounded-lg" />
        <input placeholder="Cetrero" value={formData.falconerName} onChange={e => setFormData({...formData, falconerName: e.target.value})} className="px-4 py-2 border rounded-lg" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl">
        <div>
          <label className="block text-[10px] uppercase mb-1">Altura (m)</label>
          <input type="number" value={formData.alturaServicio || ''} onChange={e => setFormData({...formData, alturaServicio: Number(e.target.value)})} className="w-full px-2 py-1 border rounded" />
        </div>
        <div>
          <label className="block text-[10px] uppercase mb-1">Picado (km/h)</label>
          <input type="number" value={formData.velocidadPicado || ''} onChange={e => setFormData({...formData, velocidadPicado: Number(e.target.value)})} className="w-full px-2 py-1 border rounded" />
        </div>
        <div>
          <label className="block text-[10px] uppercase mb-1">Tiempo (s)</label>
          <input type="number" value={formData.tiempoVuelo || ''} onChange={e => setFormData({...formData, tiempoVuelo: Number(e.target.value)})} className="w-full px-2 py-1 border rounded" />
        </div>
        <div>
          <label className="block text-[10px] uppercase mb-1">Distancia (m)</label>
          <input type="number" value={formData.distanciaServicio || ''} onChange={e => setFormData({...formData, distanciaServicio: Number(e.target.value)})} className="w-full px-2 py-1 border rounded" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h4 className="font-bold text-xs">Captura</h4>
          {Object.keys(CapturaType).map((typeKey) => {
            const typeValue = CapturaType[typeKey as keyof typeof CapturaType];
            return (
              <label key={typeKey} className={`flex items-center justify-between p-2 rounded border cursor-pointer ${formData.capturaType === typeValue ? 'border-field-green bg-green-50' : ''}`}>
                <div className="flex items-center gap-2">
                  <input type="radio" checked={formData.capturaType === typeValue} onChange={() => setFormData({...formData, capturaType: typeValue})} />
                  <span className="text-xs">{CAPTURA_LABELS[typeValue]}</span>
                </div>
              </label>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-xl space-y-2">
            <h4 className="text-red-800 font-bold text-xs flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Penalizaciones</h4>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={formData.penSenueloEncarnado} onChange={e => setFormData({...formData, penSenueloEncarnado: e.target.checked})} /> Señuelo encarnado (-4)</label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={formData.penEnsenarSenuelo} onChange={e => setFormData({...formData, penEnsenarSenuelo: e.target.checked})} /> Enseñar señuelo (-6)</label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={formData.penSueltaObligada} onChange={e => setFormData({...formData, penSueltaObligada: e.target.checked})} /> Suelta obligada (-10)</label>
          </div>
          
          <div className="bg-gray-900 text-white p-4 rounded-xl space-y-2">
            <h4 className="text-red-400 font-bold text-[10px] uppercase">Descalificación</h4>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={formData.disqualifications.superar10min} onChange={e => setFormData({...formData, disqualifications: {...formData.disqualifications, superar10min: e.target.checked}})}/> +10 min</label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={formData.disqualifications.conductaAntideportiva} onChange={e => setFormData({...formData, disqualifications: {...formData.disqualifications, conductaAntideportiva: e.target.checked}})}/> Conducta</label>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-3xl font-black text-field-green">
          {isDisqualified ? 'DESC.' : formData.totalPoints.toFixed(2)}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-6 py-2 border rounded-xl">Cerrar</button>
          <button onClick={() => onSave(formData)} className="bg-field-green text-white px-8 py-2 rounded-xl flex items-center gap-2">
            <Save className="w-4 h-4" /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlightScoringForm;
