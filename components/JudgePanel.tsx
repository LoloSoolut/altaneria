import React, { useState } from 'react';
import { AppState, Championship, FlightData } from '../types.ts';
import { supabase } from '../supabase.ts';
import { Plus, Trash2, Edit3, Gavel, Clock, Save, CloudOff, Cloud, RefreshCw } from 'lucide-react';
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
  const [syncing, setSyncing] = useState(false);

  const selectedChamp = state.championships.find(c => c.id === state.selectedChampionshipId);

  /**
   * Empuja las actualizaciones tanto al estado local como a Supabase de forma garantizada.
   */
  const pushUpdate = async (updatedChampionships: Championship[], idToSyncOverride?: string) => {
    setSyncing(true);
    
    // 1. Actualización inmediata de la interfaz
    onUpdateState({ championships: updatedChampionships });
    
    // 2. Respaldo en LocalStorage
    localStorage.setItem('altaneria_championships', JSON.stringify(updatedChampionships));

    // 3. Sincronización con la nube
    if (supabase) {
      const idToSync = idToSyncOverride || state.selectedChampionshipId;
      
      if (idToSync) {
        const target = updatedChampionships.find(c => c.id === idToSync);
        if (target) {
          try {
            const { error } = await supabase
              .from('championships')
              .upsert(target, { onConflict: 'id' });
            
            if (error) {
              console.error("❌ Error de Supabase al guardar:", error.message, error.details);
            } else {
              console.log("🚀 Sincronización exitosa con la base de datos.");
            }
          } catch (e) {
            console.error("❌ Excepción de red al sincronizar:", e);
          }
        }
      }
    }
    setSyncing(false);
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

    const updatedChamps = [champ, ...state.championships];
    // Sincronizamos inmediatamente pasando el ID del nuevo campeonato
    await pushUpdate(updatedChamps, champ.id);
    
    setIsCreating(false);
    setNewChamp({ name: '', date: '', location: '' });
    onUpdateState({ selectedChampionshipId: champ.id });
  };

  const deleteChamp = async (id: string) => {
    if (!confirm('¿Seguro que desea eliminar este campeonato permanentemente de la base de datos?')) return;
    
    const updatedChamps = state.championships.filter(c => c.id !== id);
    
    if (supabase) {
      const { error } = await supabase.from('championships').delete().eq('id', id);
      if (error) console.error("Error al borrar de Supabase:", error);
    }
    
    onUpdateState({ championships: updatedChamps });
    localStorage.setItem('altaneria_championships', JSON.stringify(updatedChamps));
    
    if (state.selectedChampionshipId === id) onUpdateState({ selectedChampionshipId: null });
  };

  const deleteParticipant = async (flightId: string) => {
    if (!selectedChamp || !confirm('¿Eliminar este vuelo del registro?')) return;
    const updatedParticipants = selectedChamp.participants.filter(f => f.id !== flightId);
    
    const updatedChamps = state.championships.map(c => 
      c.id === selectedChamp.id ? { ...c, participants: updatedParticipants } : c
    );
    
    await pushUpdate(updatedChamps);
  };

  const saveParticipant = async (data: FlightData, isUpdate: boolean) => {
    if (!selectedChamp) return;
    
    const updatedParticipants = isUpdate 
      ? selectedChamp.participants.map(p => p.id === data.id ? data : p)
      : [...selectedChamp.participants, data];

    const updatedChamps = state.championships.map(c => 
      c.id === selectedChamp.id ? { ...c, participants: updatedParticipants } : c
    );

    await pushUpdate(updatedChamps);
    setIsAddingParticipant(false);
    setEditingFlightId(null);
  };

  const togglePublic = async (id: string) => {
    // Marcamos todos como privados y solo el seleccionado como público
    const updatedChamps = state.championships.map(c => ({ 
      ...c, 
      isPublic: c.id === id 
    }));
    
    onUpdateState({ publicChampionshipId: id });
    await pushUpdate(updatedChamps, id);
    
    // Si hay Supabase, también actualizamos el estado de los que dejaron de ser públicos
    if (supabase) {
      for (const c of updatedChamps) {
        if (c.id !== id) {
          await supabase.from('championships').update({ isPublic: false }).eq('id', c.id);
        }
      }
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
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-field-green/10 rounded-xl flex items-center justify-center">
                <Gavel className="w-6 h-6 text-field-green" />
              </div>
              <div>
                <h2 className="text-xl font-black text-falcon-brown uppercase tracking-tight leading-none">Gestión Arbitral</h2>
                <div className="flex items-center gap-2 mt-1">
                  {syncing ? (
                    <span className="flex items-center gap-1 text-[9px] text-field-green font-black uppercase tracking-widest animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Guardando en Nube...
                    </span>
                  ) : supabase ? (
                    <span className="flex items-center gap-1 text-[9px] text-field-green font-black uppercase tracking-widest opacity-60">
                      <Cloud className="w-3 h-3" /> Sincronizado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] text-orange-500 font-black uppercase tracking-widest">
                      <CloudOff className="w-3 h-3" /> Solo Local
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => setIsCreating(true)} className="bg-field-green text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-widest hover:bg-green-800 transition-all shadow-lg shadow-green-900/20 active:scale-95">
              <Plus className="w-4 h-4" /> Nuevo Torneo
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateChamp} className="bg-white p-8 rounded-3xl shadow-2xl space-y-4 border-2 border-field-green/20 animate-in zoom-in-95 duration-300">
              <h4 className="font-black text-xs uppercase tracking-widest text-field-green mb-4 border-b pb-2">Configuración de Nueva Competición</h4>
              <input required placeholder="Nombre del Campeonato (ej: III Trofeo Altanería)" value={newChamp.name} onChange={e => setNewChamp({...newChamp, name: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-field-green font-medium" />
              <div className="flex gap-4">
                <input required type="date" value={newChamp.date} onChange={e => setNewChamp({...newChamp, date: e.target.value})} className="flex-1 px-4 py-3 border rounded-xl outline-none" />
                <input required placeholder="Localidad" value={newChamp.location} onChange={e => setNewChamp({...newChamp, location: e.target.value})} className="flex-1 px-4 py-3 border rounded-xl outline-none font-medium" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600 uppercase text-xs">Descartar</button>
                <button type="submit" className="bg-field-green text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest">Crear e Iniciar</button>
              </div>
            </form>
          )}

          {selectedChamp ? (
            <div className="bg-white rounded-[32px] shadow-xl p-8 border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4">
                <div>
                  <h3 className="text-2xl font-black text-field-green uppercase tracking-tight leading-none">{selectedChamp.name}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">
                    <span>{selectedChamp.location}</span>
                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                    <span>{selectedChamp.date}</span>
                  </div>
                </div>
                {!editingFlightId && !isAddingParticipant && (
                  <button onClick={() => setIsAddingParticipant(true)} className="bg-falcon-brown text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-widest hover:bg-opacity-90 transition-all active:scale-95 shadow-lg shadow-brown-900/20">
                    <Plus className="w-4 h-4" /> Registrar Vuelo
                  </button>
                )}
              </div>

              {isAddingParticipant ? (
                <div className="animate-in slide-in-from-top-4 duration-500 bg-gray-50/30 p-4 rounded-3xl border border-dashed border-gray-200">
                  <FlightScoringForm flight={emptyFlight()} onSave={(d) => saveParticipant(d, false)} onCancel={() => setIsAddingParticipant(false)} />
                </div>
              ) : editingFlightId ? (
                <div className="animate-in slide-in-from-top-4 duration-500 bg-gray-50/30 p-4 rounded-3xl border border-dashed border-gray-200">
                  <FlightScoringForm flight={selectedChamp.participants.find(f => f.id === editingFlightId)!} onSave={(d) => saveParticipant(d, true)} onCancel={() => setEditingFlightId(null)} />
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedChamp.participants.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100">
                      <p className="text-gray-400 font-medium italic">No hay vuelos registrados para esta competición.</p>
                      <button onClick={() => setIsAddingParticipant(true)} className="mt-4 text-field-green font-black uppercase text-[10px] tracking-widest hover:underline">Añadir primer participante</button>
                    </div>
                  ) : (
                    selectedChamp.participants.sort((a,b) => b.totalPoints - a.totalPoints).map((p, i) => (
                      <div key={p.id} className="group flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-lg hover:border-field-green/20 transition-all cursor-default">
                        <div className="flex items-center gap-5">
                          <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${i < 3 ? 'bg-field-green text-white shadow-md' : 'bg-gray-50 text-gray-300'}`}>
                            {i+1}
                          </span>
                          <div>
                            <p className="font-black text-gray-800 leading-none mb-1 group-hover:text-field-green transition-colors">{p.falconerName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">{p.falconName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <p className={`text-sm font-black ${p.totalPoints === 0 ? 'text-red-500' : 'text-field-green'}`}>
                              {p.totalPoints === 0 ? 'DESC.' : `${p.totalPoints.toFixed(2)} pts`}
                            </p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{p.alturaServicio}m techo oficial</p>
                          </div>
                          <div className="flex items-center gap-2 border-l pl-4 border-gray-100">
                            <button onClick={() => setEditingFlightId(p.id)} title="Editar puntuación" className="p-2.5 text-falcon-brown hover:bg-falcon-brown hover:text-white rounded-lg transition-all">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteParticipant(p.id)} title="Eliminar registro" className="p-2.5 text-red-200 hover:bg-red-500 hover:text-white rounded-lg transition-all">
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
            <div className="bg-white rounded-[40px] p-24 text-center border-2 border-dashed border-gray-200 shadow-inner flex flex-col items-center">
               <Gavel className="w-16 h-16 text-gray-100 mb-6" />
               <h3 className="text-xl font-black text-gray-300 uppercase tracking-widest">Seleccione una Competición</h3>
               <p className="text-gray-400 text-sm max-w-xs mt-2 font-medium">Use el panel lateral para elegir un torneo existente o cree uno nuevo arriba.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <TechnicalAssistant />
          <div className="bg-white p-8 rounded-[32px] shadow-lg border border-gray-100">
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] mb-6 text-gray-400 flex items-center gap-2 border-b pb-4">
              <Clock className="w-4 h-4" /> Historial Reciente
            </h3>
            <div className="space-y-4">
              {state.championships.length === 0 && <p className="text-center text-[10px] text-gray-300 italic uppercase">No hay torneos registrados</p>}
              {state.championships.map(champ => (
                <div 
                  key={champ.id} 
                  className={`group p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                    state.selectedChampionshipId === champ.id 
                      ? 'bg-falcon-brown border-falcon-brown text-white shadow-xl scale-[1.02]' 
                      : 'border-transparent bg-gray-50 hover:bg-white hover:border-falcon-brown/20'
                  }`} 
                  onClick={() => onUpdateState({ selectedChampionshipId: champ.id })}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-black text-xs uppercase block truncate group-hover:tracking-wider transition-all">
                        {champ.name}
                      </span>
                      <span className={`text-[9px] font-bold uppercase mt-1 block ${state.selectedChampionshipId === champ.id ? 'text-white/60' : 'text-gray-400'}`}>
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
                    className={`w-full text-[9px] py-2.5 rounded-xl border-2 uppercase font-black tracking-widest transition-all ${
                      champ.isPublic 
                        ? (state.selectedChampionshipId === champ.id ? 'bg-white text-field-green border-white' : 'bg-field-green text-white border-field-green shadow-md') 
                        : (state.selectedChampionshipId === champ.id ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-200 text-gray-400 hover:border-field-green hover:text-field-green')
                    }`}
                  >
                    {champ.isPublic ? "Emitiendo Resultados" : "Publicar Resultados"}
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