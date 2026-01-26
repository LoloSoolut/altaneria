
import React, { useState } from 'react';
import { AppState, Championship, FlightData } from '../types.ts';
import { supabase } from '../supabase.ts';
// Fixed: Added Clock to the imported icons from lucide-react
import { Plus, Trash2, Edit3, Gavel, Clock } from 'lucide-react';
import FlightScoringForm from './FlightScoringForm.tsx';
import TechnicalAssistant from './TechnicalAssistant.tsx';

interface Props {
  state: AppState;
  onUpdateState: (newState: Partial<AppState>) => void;
}

const JudgePanel: React.FC<Props> = ({ state, onUpdateState }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [newChamp, setNewChamp] = useState({ name: '', date: '', location: '' });

  const selectedChamp = state.championships.find(c => c.id === state.selectedChampionshipId);

  const updatePersistence = (championships: Championship[]) => {
    // Si no hay Supabase, se guarda en LocalStorage
    if (!supabase) {
      localStorage.setItem('altaneria_championships', JSON.stringify(championships));
    }
    onUpdateState({ championships });
  };

  const handleCreateChamp = async (e: React.FormEvent) => {
    e.preventDefault();
    const champ: Championship = {
      id: crypto.randomUUID(),
      name: newChamp.name,
      date: newChamp.date,
      location: newChamp.location,
      participants: [],
      isPublic: false,
      createdAt: Date.now()
    };

    if (supabase) {
      const { error } = await supabase.from('championships').insert([champ]);
      if (error) return alert('Error al crear torneo: ' + error.message);
      // Recargar estados se maneja por la suscripción en App.tsx
    } else {
      updatePersistence([champ, ...state.championships]);
    }

    setIsCreating(false);
    setNewChamp({ name: '', date: '', location: '' });
    onUpdateState({ selectedChampionshipId: champ.id });
  };

  const deleteChamp = async (id: string) => {
    if (!confirm('¿Seguro que desea eliminar este campeonato permanentemente?')) return;
    if (supabase) {
      const { error } = await supabase.from('championships').delete().eq('id', id);
      if (error) alert('Error al eliminar: ' + error.message);
    } else {
      updatePersistence(state.championships.filter(c => c.id !== id));
      if (state.selectedChampionshipId === id) onUpdateState({ selectedChampionshipId: null });
    }
  };

  const deleteParticipant = async (flightId: string) => {
    if (!selectedChamp || !confirm('¿Eliminar participante del vuelo?')) return;
    const updatedParticipants = selectedChamp.participants.filter(f => f.id !== flightId);
    
    if (supabase) {
      const { error } = await supabase
        .from('championships')
        .update({ participants: updatedParticipants })
        .eq('id', selectedChamp.id);
      if (error) alert('Error al guardar cambios: ' + error.message);
    } else {
      const updatedChamps = state.championships.map(c => c.id === selectedChamp.id ? { ...c, participants: updatedParticipants } : c);
      updatePersistence(updatedChamps);
    }
  };

  const saveParticipant = async (data: FlightData, isUpdate: boolean) => {
    if (!selectedChamp) return;
    const updatedParticipants = isUpdate 
      ? selectedChamp.participants.map(p => p.id === data.id ? data : p)
      : [...selectedChamp.participants, data];

    if (supabase) {
      const { error } = await supabase
        .from('championships')
        .update({ participants: updatedParticipants })
        .eq('id', selectedChamp.id);
      
      if (error) {
        alert('Error al sincronizar con Supabase: ' + error.message);
      } else {
        console.log("🚀 Sincronización exitosa con la base de datos.");
      }
    } else {
      const updatedChamps = state.championships.map(c => c.id === selectedChamp.id ? { ...c, participants: updatedParticipants } : c);
      updatePersistence(updatedChamps);
    }
    setIsAddingParticipant(false);
    setEditingFlightId(null);
  };

  const togglePublic = async (id: string) => {
    if (supabase) {
      // Desactivar otros públicos primero (lógica simple de un solo campeonato público a la vez)
      await supabase.from('championships').update({ isPublic: false }).neq('id', '0');
      const { error } = await supabase.from('championships').update({ isPublic: true }).eq('id', id);
      if (error) alert(error.message);
    } else {
      const updatedChamps = state.championships.map(c => ({ ...c, isPublic: c.id === id }));
      updatePersistence(updatedChamps);
      onUpdateState({ publicChampionshipId: id });
    }
  };

  const emptyFlight = (): FlightData => ({
    id: crypto.randomUUID(), falconName: '', falconerName: '', tiempoCortesia: 0, tiempoVuelo: 0, velocidadPicado: 0,
    alturaServicio: 0, distanciaServicio: 0, capturaType: null, 'bon recogida': 0, penPicado: 0,
    penSenueloEncarnado: false, penEnsenarSenuelo: false, penSueltaObligada: false,
    disqualifications: { superar10min: false, ensenarVivos: false, conductaAntideportiva: false, noComparecer: false },
    totalPoints: 0
  });

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md flex justify-between items-center border border-gray-100">
            <div>
              <h2 className="text-xl font-black text-falcon-brown uppercase tracking-tight">Gestión de Torneos</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Panel de Control Arbitral</p>
            </div>
            <button onClick={() => setIsCreating(true)} className="bg-field-green text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-widest hover:bg-green-800 transition-all shadow-lg">
              <Plus className="w-4 h-4" /> Nuevo Campeonato
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateChamp} className="bg-white p-8 rounded-3xl shadow-2xl space-y-4 border-2 border-field-green/20 animate-in zoom-in-95 duration-300">
              <h4 className="font-black text-xs uppercase tracking-widest text-field-green mb-4">Configuración del Torneo</h4>
              <input required placeholder="Nombre del Campeonato (ej: Trofeo Aceca)" value={newChamp.name} onChange={e => setNewChamp({...newChamp, name: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-field-green" />
              <div className="flex gap-4">
                <input required type="date" value={newChamp.date} onChange={e => setNewChamp({...newChamp, date: e.target.value})} className="flex-1 px-4 py-3 border rounded-xl outline-none" />
                <input required placeholder="Localización" value={newChamp.location} onChange={e => setNewChamp({...newChamp, location: e.target.value})} className="flex-1 px-4 py-3 border rounded-xl outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600">Descartar</button>
                <button type="submit" className="bg-field-green text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest">Confirmar Torneo</button>
              </div>
            </form>
          )}

          {selectedChamp ? (
            <div className="bg-white rounded-[32px] shadow-xl p-8 border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4">
                <div>
                  <h3 className="text-2xl font-black text-field-green uppercase tracking-tight leading-none">{selectedChamp.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{selectedChamp.location} — {selectedChamp.date}</p>
                </div>
                {!editingFlightId && !isAddingParticipant && (
                  <button onClick={() => setIsAddingParticipant(true)} className="bg-falcon-brown text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform">
                    <Plus className="w-4 h-4" /> Añadir Participante
                  </button>
                )}
              </div>

              {isAddingParticipant ? (
                <div className="animate-in slide-in-from-top-4 duration-500">
                  <FlightScoringForm flight={emptyFlight()} onSave={(d) => saveParticipant(d, false)} onCancel={() => setIsAddingParticipant(false)} />
                </div>
              ) : editingFlightId ? (
                <div className="animate-in slide-in-from-top-4 duration-500">
                  <FlightScoringForm flight={selectedChamp.participants.find(f => f.id === editingFlightId)!} onSave={(d) => saveParticipant(d, true)} onCancel={() => setEditingFlightId(null)} />
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedChamp.participants.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100">
                      <p className="text-gray-400 font-medium">No hay participantes registrados en este torneo.</p>
                    </div>
                  ) : (
                    selectedChamp.participants.sort((a,b) => b.totalPoints - a.totalPoints).map((p, i) => (
                      <div key={p.id} className="group flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-green-50/30 hover:border-field-green/20 transition-all">
                        <div className="flex items-center gap-5">
                          <span className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-300 group-hover:text-field-green group-hover:bg-white transition-colors">
                            {i+1}
                          </span>
                          <div>
                            <p className="font-black text-gray-800 leading-none mb-1">{p.falconerName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{p.falconName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs font-black text-field-green">{p.totalPoints.toFixed(2)} pts</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{p.alturaServicio}m techo</p>
                          </div>
                          <div className="flex items-center gap-2 border-l pl-4">
                            <button onClick={() => setEditingFlightId(p.id)} className="p-2.5 text-falcon-brown hover:bg-falcon-brown hover:text-white rounded-lg transition-all">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteParticipant(p.id)} className="p-2.5 text-red-300 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[40px] p-24 text-center border-2 border-dashed border-gray-200 shadow-inner">
               <Gavel className="w-16 h-16 mx-auto mb-4 text-gray-100" />
               <h3 className="text-xl font-bold text-gray-300 uppercase tracking-widest">Sin Torneo Seleccionado</h3>
               <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2">Seleccione un campeonato del historial lateral o cree uno nuevo para comenzar la evaluación técnica.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <TechnicalAssistant />
          <div className="bg-white p-8 rounded-[32px] shadow-lg border border-gray-100">
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] mb-6 text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Historial de Torneos
            </h3>
            <div className="space-y-3">
              {state.championships.length === 0 && <p className="text-center text-xs text-gray-300 italic">No hay registros previos.</p>}
              {state.championships.map(champ => (
                <div 
                  key={champ.id} 
                  className={`group p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                    state.selectedChampionshipId === champ.id 
                      ? 'bg-falcon-brown border-falcon-brown text-white shadow-lg shadow-falcon-brown/20' 
                      : 'border-transparent bg-gray-50 hover:bg-white hover:border-falcon-brown/20'
                  }`} 
                  onClick={() => onUpdateState({ selectedChampionshipId: champ.id })}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-black text-sm uppercase block truncate group-hover:tracking-wider transition-all">
                        {champ.name}
                      </span>
                      <span className={`text-[9px] font-bold uppercase ${state.selectedChampionshipId === champ.id ? 'text-white/60' : 'text-gray-400'}`}>
                        {champ.date}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteChamp(champ.id); }}
                      className={`p-1.5 rounded-lg transition-colors ${state.selectedChampionshipId === champ.id ? 'hover:bg-white/10 text-white' : 'text-red-300 hover:text-red-500 hover:bg-red-50'}`}
                    >
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePublic(champ.id); }} 
                    className={`w-full text-[9px] py-2 rounded-xl border-2 uppercase font-black tracking-widest transition-all ${
                      champ.isPublic 
                        ? (state.selectedChampionshipId === champ.id ? 'bg-white text-field-green border-white' : 'bg-field-green text-white border-field-green') 
                        : (state.selectedChampionshipId === champ.id ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-200 text-gray-400 hover:border-field-green hover:text-field-green')
                    }`}
                  >
                    {champ.isPublic ? "Emitiendo en Directo" : "Activar Transmisión"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgePanel;
