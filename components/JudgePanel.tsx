
import React, { useState } from 'react';
import { AppState, Championship, FlightData } from '../types.ts';
import { supabase } from '../supabase.ts';
import { Plus, Trash2, Edit3, FileText, Info, Gavel, CheckCircle2 } from 'lucide-react';
import FlightScoringForm from './FlightScoringForm.tsx';
import TechnicalAssistant from './TechnicalAssistant.tsx';
import { CAPTURA_LABELS } from '../constants.ts';

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
      if (error) return alert('Error: ' + error.message);
    } else {
      updatePersistence([champ, ...state.championships]);
    }

    setIsCreating(false);
    setNewChamp({ name: '', date: '', location: '' });
    onUpdateState({ selectedChampionshipId: champ.id });
  };

  const deleteChamp = async (id: string) => {
    if (!confirm('¿Eliminar campeonato?')) return;
    if (supabase) {
      await supabase.from('championships').delete().eq('id', id);
    } else {
      updatePersistence(state.championships.filter(c => c.id !== id));
      if (state.selectedChampionshipId === id) onUpdateState({ selectedChampionshipId: null });
    }
  };

  const deleteParticipant = async (flightId: string) => {
    if (!selectedChamp || !confirm('¿Eliminar participante?')) return;
    const updatedParticipants = selectedChamp.participants.filter(f => f.id !== flightId);
    if (supabase) {
      await supabase.from('championships').update({ participants: updatedParticipants }).eq('id', selectedChamp.id);
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
      await supabase.from('championships').update({ participants: updatedParticipants }).eq('id', selectedChamp.id);
    } else {
      const updatedChamps = state.championships.map(c => c.id === selectedChamp.id ? { ...c, participants: updatedParticipants } : c);
      updatePersistence(updatedChamps);
    }
    setIsAddingParticipant(false);
    setEditingFlightId(null);
  };

  const togglePublic = async (id: string) => {
    if (supabase) {
      await supabase.from('championships').update({ isPublic: false }).neq('id', '0');
      await supabase.from('championships').update({ isPublic: true }).eq('id', id);
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
          <div className="bg-white p-6 rounded-2xl shadow-md flex justify-between items-center">
            <h2 className="text-xl font-bold text-falcon-brown">Gestión de Torneos</h2>
            <button onClick={() => setIsCreating(true)} className="bg-field-green text-white px-4 py-2 rounded-xl flex items-center gap-2">
              <Plus className="w-5 h-5" /> Nuevo Torneo
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateChamp} className="bg-white p-6 rounded-2xl shadow-xl space-y-4">
              <input required placeholder="Nombre" value={newChamp.name} onChange={e => setNewChamp({...newChamp, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
              <div className="flex gap-4">
                <input required type="date" value={newChamp.date} onChange={e => setNewChamp({...newChamp, date: e.target.value})} className="flex-1 px-4 py-2 border rounded-lg" />
                <input required placeholder="Lugar" value={newChamp.location} onChange={e => setNewChamp({...newChamp, location: e.target.value})} className="flex-1 px-4 py-2 border rounded-lg" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2">Cancelar</button>
                <button type="submit" className="bg-field-green text-white px-6 py-2 rounded-lg">Crear</button>
              </div>
            </form>
          )}

          {selectedChamp ? (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold text-field-green">{selectedChamp.name}</h3>
                {!editingFlightId && !isAddingParticipant && (
                  <button onClick={() => setIsAddingParticipant(true)} className="bg-falcon-brown text-white px-4 py-2 rounded-xl flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Añadir Cetrero
                  </button>
                )}
              </div>

              {isAddingParticipant ? (
                <FlightScoringForm flight={emptyFlight()} onSave={(d) => saveParticipant(d, false)} onCancel={() => setIsAddingParticipant(false)} />
              ) : editingFlightId ? (
                <FlightScoringForm flight={selectedChamp.participants.find(f => f.id === editingFlightId)!} onSave={(d) => saveParticipant(d, true)} onCancel={() => setEditingFlightId(null)} />
              ) : (
                <div className="space-y-2">
                  {selectedChamp.participants.sort((a,b) => b.totalPoints - a.totalPoints).map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-300">#{i+1}</span>
                        <div>
                          <p className="font-bold">{p.falconerName}</p>
                          <p className="text-xs text-gray-500">{p.falconName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-field-green">{p.totalPoints.toFixed(2)}</span>
                        <button onClick={() => setEditingFlightId(p.id)} className="p-2 text-falcon-brown"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteParticipant(p.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
               <Gavel className="w-12 h-12 mx-auto mb-2 text-gray-200" />
               <p className="text-gray-400">Selecciona un torneo a la derecha.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <TechnicalAssistant />
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-xs uppercase mb-4">Historial</h3>
            <div className="space-y-2">
              {state.championships.map(champ => (
                <div key={champ.id} className={`p-3 rounded-xl cursor-pointer border ${state.selectedChampionshipId === champ.id ? 'bg-falcon-brown text-white' : 'hover:border-falcon-brown'}`} onClick={() => onUpdateState({ selectedChampionshipId: champ.id })}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm truncate">{champ.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteChamp(champ.id); }}><Trash2 className="w-4 h-4 text-red-400"/></button>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); togglePublic(champ.id); }} className={`w-full text-[10px] py-1 rounded border uppercase font-bold ${champ.isPublic ? 'bg-green-500 text-white' : ''}`}>
                    {champ.isPublic ? "Público" : "Hacer Público"}
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
