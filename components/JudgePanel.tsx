
import React, { useState } from 'react';
import { AppState, Championship, FlightData } from '../types';
import { supabase } from '../supabase';
import { Plus, Trash2, Edit3, FileText, Info, Users, Gavel, CheckCircle2 } from 'lucide-react';
import FlightScoringForm from './FlightScoringForm';
import TechnicalAssistant from './TechnicalAssistant';
import { SCORING, CAPTURA_LABELS } from '../constants';

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
      if (error) return alert('Error guardando en Supabase: ' + error.message);
    } else {
      updatePersistence([champ, ...state.championships]);
    }

    setIsCreating(false);
    setNewChamp({ name: '', date: '', location: '' });
    onUpdateState({ selectedChampionshipId: champ.id });
  };

  const deleteChamp = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este campeonato?')) return;
    
    if (supabase) {
      const { error } = await supabase.from('championships').delete().eq('id', id);
      if (error) alert('Error eliminando: ' + error.message);
    } else {
      updatePersistence(state.championships.filter(c => c.id !== id));
      if (state.selectedChampionshipId === id) onUpdateState({ selectedChampionshipId: null });
    }
  };

  const deleteParticipant = async (flightId: string) => {
    if (!selectedChamp || !confirm('¿Eliminar participante?')) return;
    const updatedParticipants = selectedChamp.participants.filter(f => f.id !== flightId);
    
    if (supabase) {
      await supabase
        .from('championships')
        .update({ participants: updatedParticipants })
        .eq('id', selectedChamp.id);
    } else {
      const updatedChamps = state.championships.map(c => 
        c.id === selectedChamp.id ? { ...c, participants: updatedParticipants } : c
      );
      updatePersistence(updatedChamps);
    }
  };

  const saveParticipant = async (data: FlightData, isUpdate: boolean) => {
    if (!selectedChamp) return;
    
    let updatedParticipants;
    if (isUpdate) {
      updatedParticipants = selectedChamp.participants.map(p => p.id === data.id ? data : p);
    } else {
      updatedParticipants = [...selectedChamp.participants, data];
    }

    if (supabase) {
      const { error } = await supabase
        .from('championships')
        .update({ participants: updatedParticipants })
        .eq('id', selectedChamp.id);
      if (error) alert('Error en Supabase');
    } else {
      const updatedChamps = state.championships.map(c => 
        c.id === selectedChamp.id ? { ...c, participants: updatedParticipants } : c
      );
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
      const updatedChamps = state.championships.map(c => ({
        ...c,
        isPublic: c.id === id
      }));
      updatePersistence(updatedChamps);
      onUpdateState({ publicChampionshipId: id });
    }
  };

  const exportPDF = (champ: Championship) => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(22);
    doc.setTextColor(27, 94, 32);
    doc.text(champ.name.toUpperCase(), 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(93, 64, 55);
    doc.text(`UBICACIÓN: ${champ.location} | FECHA: ${champ.date}`, 14, 30);
    doc.setDrawColor(93, 64, 55);
    doc.line(14, 32, 280, 32);

    const tableData = champ.participants
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((p, i) => [i + 1, p.falconerName, p.falconName, `${Math.floor(p.tiempoVuelo/60)}m ${p.tiempoVuelo%60}s`, `${p.alturaServicio}m`, p.totalPoints.toFixed(2)]);

    (doc as any).autoTable({
      startY: 40,
      head: [['Pos', 'Cetrero', 'Halcón', 'T.Vuelo', 'Altura', 'TOTAL']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [27, 94, 32] }
    });
    doc.save(`${champ.name}.pdf`);
  };

  const emptyFlight = (id: string = crypto.randomUUID()): FlightData => ({
    id, falconName: '', falconerName: '', tiempoCortesia: 0, tiempoVuelo: 0, velocidadPicado: 0,
    alturaServicio: 0, distanciaServicio: 0, capturaType: null, 'bon recogida': 0, penPicado: 0,
    penSenueloEncarnado: false, penEnsenarSenuelo: false, penSueltaObligada: false,
    disqualifications: { superar10min: false, ensenarVivos: false, conductaAntideportiva: false, noComparecer: false },
    totalPoints: 0
  });

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-falcon-brown">Organizador de Torneos</h2>
              <p className="text-gray-500 text-sm">Gestiona los campeonatos de altanería profesional.</p>
            </div>
            <button onClick={() => setIsCreating(true)} className="bg-field-green text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-green-700 transition shadow-lg font-semibold active:scale-95">
              <Plus className="w-5 h-5" /> Nuevo Torneo
            </button>
          </div>

          {isCreating && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-field-green animate-in fade-in slide-in-from-top-4">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-falcon-brown"><Edit3 className="w-5 h-5" /> Configuración Oficial</h3>
              <form onSubmit={handleCreateChamp} className="grid md:grid-cols-3 gap-4">
                <input required placeholder="Nombre del campeonato" value={newChamp.name} onChange={e => setNewChamp({...newChamp, name: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-field-green outline-none" />
                <input required type="date" value={newChamp.date} onChange={e => setNewChamp({...newChamp, date: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-field-green outline-none" />
                <input required placeholder="Lugar de celebración" value={newChamp.location} onChange={e => setNewChamp({...newChamp, location: e.target.value})} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-field-green outline-none" />
                <div className="md:col-span-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2 text-gray-500">Cerrar</button>
                  <button type="submit" className="bg-field-green text-white px-8 py-2 rounded-lg font-bold hover:bg-green-800 shadow-md">Publicar Torneo</button>
                </div>
              </form>
            </div>
          )}

          {selectedChamp ? (
            <div className="bg-white rounded-2xl shadow-xl p-6 min-h-[500px] border border-gray-100">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-2xl font-bold text-field-green">{selectedChamp.name}</h3>
                  <p className="text-gray-500 italic text-sm">{selectedChamp.location}, {selectedChamp.date}</p>
                </div>
                <div className="flex gap-2">
                  {!editingFlightId && !isAddingParticipant && (
                    <button onClick={() => setIsAddingParticipant(true)} className="bg-falcon-brown text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 shadow-md font-bold transition active:scale-95">
                      <Plus className="w-4 h-4" /> Añadir Participante
                    </button>
                  )}
                </div>
              </div>

              {isAddingParticipant ? (
                <FlightScoringForm flight={emptyFlight()} onSave={(d) => saveParticipant(d, false)} onCancel={() => setIsAddingParticipant(false)} />
              ) : editingFlightId ? (
                <FlightScoringForm flight={selectedChamp.participants.find(f => f.id === editingFlightId)!} onSave={(d) => saveParticipant(d, true)} onCancel={() => setEditingFlightId(null)} />
              ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                    <thead>
                      <tr className="text-sm font-bold text-gray-400 border-b">
                        <th className="px-4 py-3 uppercase tracking-tighter">Halcón</th>
                        <th className="px-4 py-3 uppercase tracking-tighter text-center">Puntos</th>
                        <th className="px-4 py-3 text-right uppercase tracking-tighter">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedChamp.participants.sort((a,b) => b.totalPoints - a.totalPoints).map((p, i) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition group">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-gray-300">#{i+1}</span>
                              <div>
                                <p className="font-bold text-gray-800">{p.falconName || "Sin nombre"}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">{p.falconerName || "Sin cetrero"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="font-black text-field-green text-xl">{p.totalPoints.toFixed(2)}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => setEditingFlightId(p.id)} className="p-2 text-falcon-brown hover:bg-gray-100 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => deleteParticipant(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                   </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-20 text-center border-4 border-dashed border-gray-100">
               <Gavel className="w-16 h-16 mx-auto mb-4 text-gray-200" />
               <p className="text-gray-400 font-medium">Selecciona un campeonato del historial para empezar a gestionar.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <TechnicalAssistant />
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 uppercase tracking-widest text-xs mb-4"><Info className="w-4 h-4" /> Histórico {supabase ? 'en Supabase' : 'Local'}</h3>
            <div className="space-y-3">
              {state.championships.map(champ => (
                <div key={champ.id} className={`p-4 rounded-xl cursor-pointer transition flex flex-col gap-2 border ${state.selectedChampionshipId === champ.id ? 'bg-falcon-brown text-white shadow-lg' : 'bg-gray-50 border-gray-200 hover:border-falcon-brown'}`} onClick={() => onUpdateState({ selectedChampionshipId: champ.id })}>
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm line-clamp-1">{champ.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteChamp(champ.id); }} className="text-red-400 hover:text-red-200"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={(e) => { e.stopPropagation(); togglePublic(champ.id); }} className={`flex-1 text-[10px] py-1 rounded border uppercase font-bold ${champ.isPublic ? 'bg-green-500 border-green-500 text-white' : 'border-gray-400'}`}>
                      {champ.isPublic ? <span className="flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3"/> Público</span> : "Hacer Público"}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); exportPDF(champ); }} className="p-1.5 bg-white text-falcon-brown rounded shadow-sm hover:scale-110 transition"><FileText className="w-4 h-4" /></button>
                  </div>
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
