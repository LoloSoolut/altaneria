
import React, { useState, useEffect } from 'react';
import { FlightData, CapturaType } from '../types';
import { SCORING, CAPTURA_LABELS } from '../constants';
import { Save, X, AlertTriangle, Check, ShieldAlert } from 'lucide-react';

interface Props {
  flight: FlightData;
  onSave: (data: FlightData) => void;
  onCancel: () => void;
}

const FlightScoringForm: React.FC<Props> = ({ flight, onSave, onCancel }) => {
  const [formData, setFormData] = useState<FlightData>({ ...flight });

  // Calculate scores in real-time
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
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-bold text-gray-700 border-b pb-2 uppercase text-xs tracking-widest">Información Básica</h4>
          <div className="grid gap-4">
            <input 
              placeholder="Introduce el nombre del halcón"
              value={formData.falconName}
              onChange={e => setFormData({...formData, falconName: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-field-green outline-none"
            />
            <input 
              placeholder="Introduce el nombre del cetrero"
              value={formData.falconerName}
              onChange={e => setFormData({...formData, falconerName: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-field-green outline-none"
            />
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold text-gray-700 border-b pb-2 uppercase text-xs tracking-widest">Tiempos (Segundos)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Cortesía</label>
              <input 
                type="number"
                value={formData.tiempoCortesia || ''}
                onChange={e => setFormData({...formData, tiempoCortesia: Number(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-field-green outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Vuelo</label>
              <input 
                type="number"
                value={formData.tiempoVuelo || ''}
                onChange={e => setFormData({...formData, tiempoVuelo: Number(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-field-green outline-none"
              />
              <p className="text-[10px] text-green-600 mt-1">Bonif. Tiempo: +{turnBonus} pts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h4 className="font-bold text-gray-700 border-b pb-2 uppercase text-xs tracking-widest">Métricas de Vuelo</h4>
          
          <div className="bg-gray-50 p-4 rounded-xl space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Velocidad del Picado (km/h)</label>
              <input 
                type="number"
                value={formData.velocidadPicado || ''}
                onChange={e => setFormData({...formData, velocidadPicado: Number(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg outline-none"
              />
              <p className="text-xs font-bold text-field-green mt-1">Puntos Picado: {picadoPts.toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Altura de Servicio (m)</label>
              <input 
                type="number"
                value={formData.alturaServicio || ''}
                onChange={e => setFormData({...formData, alturaServicio: Number(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg outline-none"
              />
              <p className="text-xs font-bold text-field-green mt-1">Puntos Altura: {alturaPts.toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Distancia de Servicio (m)</label>
              <input 
                type="number"
                value={formData.distanciaServicio || ''}
                onChange={e => setFormData({...formData, distanciaServicio: Number(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg outline-none"
              />
              <p className="text-xs font-bold text-field-green mt-1">Puntos Servicio: {servicioPts.toFixed(2)}</p>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Remontada: <span className="text-falcon-brown">{remontadaVal.toFixed(2)} m/min</span></span>
                <span className="text-xs font-bold text-field-green">Puntos: {remontadaPts.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="font-bold text-gray-700 border-b pb-2 uppercase text-xs tracking-widest">Tipo de Captura</h4>
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(CapturaType) as Array<keyof typeof CapturaType>).map((typeKey) => {
              const typeValue = CapturaType[typeKey];
              const points = SCORING.calculateCapturaPoints(typeValue, formData.alturaServicio);
              return (
                <label key={typeKey} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition border-2 ${formData.capturaType === typeValue ? 'border-field-green bg-green-50 shadow-inner' : 'border-gray-100 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="captura"
                      checked={formData.capturaType === typeValue}
                      onChange={() => setFormData({...formData, capturaType: typeValue})}
                      className="w-4 h-4 accent-field-green"
                    />
                    <span className="text-sm font-medium">{CAPTURA_LABELS[typeValue]}</span>
                  </div>
                  <span className="text-xs font-bold text-field-green">+{points.toFixed(2)}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-200 space-y-4">
          <h4 className="text-green-800 font-bold flex items-center gap-2"><Check className="w-5 h-5" /> Bonificaciones</h4>
          <div>
            <label className="block text-xs font-bold text-green-700 mb-2 uppercase">Recogida sin dudas (Max 4): {formData['bon recogida']} pts</label>
            <input 
              type="range" min="0" max="4" step="1"
              value={formData['bon recogida']}
              onChange={e => setFormData({...formData, 'bon recogida': Number(e.target.value)})}
              className="w-full accent-field-green"
            />
          </div>
          <div className="text-sm text-green-700 opacity-80">
            <p>• Los puntos por tiempo se calculan automáticamente basado en el tiempo de vuelo.</p>
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-200 space-y-4">
          <h4 className="text-red-800 font-bold flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Penalizaciones</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-3 text-sm cursor-pointer p-1 hover:bg-red-100 rounded transition">
              <input type="checkbox" checked={formData.penSenueloEncarnado} onChange={e => setFormData({...formData, penSenueloEncarnado: e.target.checked})} className="accent-red-600"/>
              Señuelo encarnado (-4 pts)
            </label>
            <label className="flex items-center gap-3 text-sm cursor-pointer p-1 hover:bg-red-100 rounded transition">
              <input type="checkbox" checked={formData.penEnsenarSenuelo} onChange={e => setFormData({...formData, penEnsenarSenuelo: e.target.checked})} className="accent-red-600"/>
              Enseñar señuelo (-6 pts)
            </label>
            <label className="flex items-center gap-3 text-sm cursor-pointer p-1 hover:bg-red-100 rounded transition">
              <input type="checkbox" checked={formData.penSueltaObligada} onChange={e => setFormData({...formData, penSueltaObligada: e.target.checked})} className="accent-red-600"/>
              Suelta obligada 8 min (-10 pts)
            </label>
          </div>
          <div>
            <label className="block text-xs font-bold text-red-700 mb-2 uppercase">Valoración Juez Picado: -{formData.penPicado} pts</label>
            <input 
              type="range" min="0" max="5" step="1"
              value={formData.penPicado}
              onChange={e => setFormData({...formData, penPicado: Number(e.target.value)})}
              className="w-full accent-red-600"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 text-white p-6 rounded-2xl space-y-4">
        <h4 className="text-red-400 font-bold flex items-center gap-2 uppercase tracking-widest text-xs"><AlertTriangle className="w-4 h-4" /> Descalificación Directa</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <input type="checkbox" checked={formData.disqualifications.superar10min} onChange={e => setFormData({...formData, disqualifications: {...formData.disqualifications, superar10min: e.target.checked}})}/>
            Superar 10 min sin recogida
          </label>
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <input type="checkbox" checked={formData.disqualifications.ensenarVivos} onChange={e => setFormData({...formData, disqualifications: {...formData.disqualifications, ensenarVivos: e.target.checked}})}/>
            Enseñar señuelos vivos
          </label>
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <input type="checkbox" checked={formData.disqualifications.conductaAntideportiva} onChange={e => setFormData({...formData, disqualifications: {...formData.disqualifications, conductaAntideportiva: e.target.checked}})}/>
            Conducta antideportiva/falta respeto
          </label>
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <input type="checkbox" checked={formData.disqualifications.noComparecer} onChange={e => setFormData({...formData, disqualifications: {...formData.disqualifications, noComparecer: e.target.checked}})}/>
            No comparecer al turno
          </label>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t">
        <div className="text-center md:text-left">
          <p className="text-gray-500 uppercase text-xs font-bold tracking-widest">Puntuación Estimada</p>
          <p className={`text-5xl font-black ${isDisqualified ? 'text-red-500' : 'text-field-green'}`}>
            {isDisqualified ? 'DESC.' : formData.totalPoints.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={onCancel} className="flex-1 px-8 py-3 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-100 transition">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 px-12 py-3 bg-field-green text-white rounded-xl font-bold hover:bg-green-700 shadow-xl flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> Guardar Vuelo
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlightScoringForm;
