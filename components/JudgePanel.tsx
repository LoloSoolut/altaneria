
import React, { useState } from 'react';
import { AppState, Championship, FlightData } from '../types.ts';
import { supabase } from '../supabase.ts';
import { Plus, Trash2, Edit3, Gavel, Clock, Save, CloudOff, Cloud, RefreshCw, AlertTriangle, Database, FileDown, ScrollText } from 'lucide-react';
import FlightScoringForm from './FlightScoringForm.tsx';
import TechnicalAssistant from './TechnicalAssistant.tsx';
import { SCORING } from '../constants.ts';

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
  const [lastError, setLastError] = useState<string | null>(null);

  const selectedChamp = state.championships.find(c => c.id === state.selectedChampionshipId);

  const exportToPDF = () => {
    if (!selectedChamp) return;
    
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Estilos de PDF
    const primaryColor = [27, 94, 32]; // Field Green
    const secondaryColor = [93, 64, 55]; // Falcon Brown
    
    // Encabezado
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPETICIONES DE ALTANERÍA PARA PROFESIONALES', 15, 20);
    
    // Metadatos del Campeonato
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.text(`Campeonato: ${selectedChamp.name}`, 15, 45);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ubicación: ${selectedChamp.location} | Fecha: ${selectedChamp.date}`, 15, 52);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleString()}`, 15, 57);

    // Tabla de Clasificación
    const sortedParticipants = [...selectedChamp.participants].sort((a, b) => b.totalPoints - a.totalPoints);
    const tableData = sortedParticipants.map((p, i) => {
      const turnBonus = SCORING.calculateTimeBonus(p.tiempoVuelo);
      const penTotal = (p.penSenueloEncarnado ? 4 : 0) + 
                       (p.penEnsenarSenuelo ? 6 : 0) + 
                       (p.penSueltaObligada ? 10 : 0) + 
                       (p.penPicado || 0);

      return [
        i + 1,
        p.falconerName,
        p.falconName,
        `${p.alturaServicio}m`,
        `${Math.floor(p.tiempoVuelo / 60)}m ${p.tiempoVuelo % 60}s`,
        `${p.tiempoCortesia}s`,
        `${p.velocidadPicado}km/h`,
        `${p.distanciaServicio}m`,
        p['bon recogida'],
        turnBonus,
        penTotal > 0 ? `-${penTotal}` : '0',
        { content: p.totalPoints.toFixed(2), styles: { fontStyle: 'bold', textColor: primaryColor } }
      ];
    });

    // @ts-ignore
    doc.autoTable({
      startY: 65,
      head: [['Pos', 'Cetrero', 'Halcón', 'Alt.', 'Tiempo', 'Cort.', 'Picado', 'Dist.', 'B.Rec', 'B.Tie', 'Pen', 'TOTAL']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10 },
        11: { cellWidth: 20, halign: 'center' }
      }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Documento Oficial de Arbitraje - Sistema Altanería Pro v1.2', 15, 200);
      doc.text(`Página ${i} de ${pageCount}`, 270, 200);
    }

    doc.save(`${selectedChamp.name.replace(/\s+/g, '_')}_Clasificacion.pdf`);
  };

  const syncWithSupabase = async (championship: Championship) => {
    if (!supabase) return;
    setSyncing(true);
    setLastError(null);
    try {
      const { error } = await supabase
        .from('championships')
        .upsert({
          id: championship.id,
          name: championship.name,
          date: championship.date,
          location: championship.location,
          participants: championship.participants,
          isPublic: championship.isPublic,
          createdAt: championship.createdAt
        }, { onConflict: 'id' });

      if (error) setLastError(error.message);
    } catch (e) {
      setLastError("Error de red");
    } finally {
      setSyncing(false);
    }
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
    onUpdateState({ championships: updatedChamps, selectedChampionshipId: champ.id });
    localStorage.setItem('altaneria_championships', JSON.stringify(updatedChamps));
    await syncWithSupabase(champ);
    setIsCreating(false);
    setNewChamp({ name: '', date: '', location: '' });
  };

  const deleteChamp = async (id: string) => {
    if (!confirm('¿Seguro que desea eliminar este campeonato?')) return;
    const updatedChamps = state.championships.filter(c => c.id !== id);
    onUpdateState({ championships: updatedChamps });
    localStorage.setItem('altaneria_championships', JSON.stringify(updatedChamps));
    if (supabase) await supabase.from('championships').delete().eq('id', id);
    if (state.selectedChampionshipId === id) onUpdateState({ selectedChampionshipId: null });
  };

  const saveParticipant = async (data: FlightData, isUpdate: boolean) => {
    if (!selectedChamp) return;
    const updatedParticipants = isUpdate 
      ? selectedChamp.participants.map(p => p.id === data.id ? data : p)
      : [...selectedChamp.participants, data];
    const updatedChamp = { ...selectedChamp, participants: updatedParticipants };
    const updatedChamps = state.championships.map(c => c.id === selectedChamp.id ? updatedChamp : c);
    onUpdateState({ championships: updatedChamps });
    localStorage.setItem('altaneria_championships', JSON.stringify(updatedChamps));
    await syncWithSupabase(updatedChamp);
    setIsAddingParticipant(false);
    setEditingFlightId(null);
  };

  const deleteParticipant = async (participantId: string) => {
    if (!selectedChamp || !confirm('¿Eliminar registro?')) return;
    const updatedParticipants = selectedChamp.participants.filter(p => p.id !== participantId);
    const updatedChamp = { ...selectedChamp, participants: updatedParticipants };
    const updatedChamps = state.championships.map(c => c.id === selectedChamp.id ? updatedChamp : c);
    onUpdateState({ championships: updatedChamps });
    localStorage.setItem('altaneria_championships', JSON.stringify(updatedChamps));
    await syncWithSupabase(updatedChamp);
  };

  const togglePublic = async (id: string) => {
    const updatedChamps = state.championships.map(c => ({ ...c, isPublic: c.id === id }));
    const target = updatedChamps.find(c => c.id === id);
    onUpdateState({ championships: updatedChamps, publicChampionshipId: id });
    localStorage.setItem('altaneria_championships', JSON.stringify(updatedChamps));
    if (target) {
      await syncWithSupabase(target);
      if (supabase) await supabase.from('championships').update({ isPublic: false }).neq('id', id);
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
      <div className={`px-5 py-3 rounded-2xl flex items-center justify-between transition-all ${!supabase ? 'bg-orange-50 border border-orange-100 text-orange-600' : lastError ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-green-50 border border-green-100 text-field-green'}`}>
        <div className="flex items-center gap-3">
          {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : supabase ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Estado de la Base de Datos</p>
            <p className="text-xs font-bold mt-1">{!supabase ? "Modo Local" : lastError ? `Error: ${lastError}` : "Sincronizado"}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-center border border-gray-100 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-field-green/10 rounded-xl flex items-center justify-center">
                <Gavel className="w-6 h-6 text-field-green" />
              </div>
              <div>
                <h2 className="text-xl font-black text-falcon-brown uppercase tracking-tight">Panel del Jurado</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Gestión Técnica Profesional</p>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedChamp && (
                <button onClick={exportToPDF} className="bg-yellow-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-yellow-700 transition-all shadow-lg active:scale-95">
                  <FileDown className="w-4 h-4" /> PDF Clasificación
                </button>
              )}
              <button onClick={() => setIsCreating(true)} className="bg-field-green text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all shadow-lg active:scale-95">
                <Plus className="w-4 h-4" /> Nuevo Torneo
              </button>
            </div>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateChamp} className="bg-white p-8 rounded-3xl shadow-2xl space-y-4 border-2 border-field-green/20 animate-in zoom-in-95 duration-300">
              <input required placeholder="Nombre del Campeonato" value={newChamp.name} onChange={e => setNewChamp({...newChamp, name: e.target.value})} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-field-green" />
              <div className="flex gap-4">
                <input required type="date" value={newChamp.date} onChange={e => setNewChamp({...newChamp, date: e.target.value})} className="flex-1 px-4 py-3 border rounded-xl outline-none" />
                <input required placeholder="Localidad" value={newChamp.location} onChange={e => setNewChamp({...newChamp, location: e.target.value})} className="flex-1 px-4 py-3 border rounded-xl outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600 uppercase text-xs">Cancelar</button>
                <button type="submit" className="bg-field-green text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest">Confirmar</button>
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
                  <button onClick={() => setIsAddingParticipant(true)} className="bg-falcon-brown text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all">
                    <Plus className="w-4 h-4" /> Añadir Vuelo
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
                      <p className="text-gray-400 font-medium italic">No hay registros en este torneo.</p>
                    </div>
                  ) : (
                    selectedChamp.participants.sort((a,b) => b.totalPoints - a.totalPoints).map((p, i) => (
                      <div key={p.id} className="group flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-green-50/30 transition-all">
                        <div className="flex items-center gap-5">
                          <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${i < 3 ? 'bg-field-green text-white' : 'bg-gray-50 text-gray-300'}`}>
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
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{p.alturaServicio}m techo</p>
                          </div>
                          <div className="flex items-center gap-2 border-l pl-4">
                            <button onClick={() => setEditingFlightId(p.id)} className="p-2.5 text-falcon-brown hover:bg-falcon-brown hover:text-white rounded-lg transition-all">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteParticipant(p.id)} className="p-2.5 text-red-200 hover:bg-red-500 hover:text-white rounded-lg transition-all">
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
               <ScrollText className="w-16 h-16 text-gray-100 mb-6" />
               <h3 className="text-xl font-black text-gray-300 uppercase tracking-widest">Seleccione un Torneo</h3>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <TechnicalAssistant />
          <div className="bg-white p-8 rounded-[32px] shadow-lg border border-gray-100">
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] mb-6 text-gray-400 flex items-center gap-2 border-b pb-4">
              <Clock className="w-4 h-4" /> Torneos Recientes
            </h3>
            <div className="space-y-3">
              {state.championships.map(champ => (
                <div key={champ.id} className={`group p-4 rounded-2xl cursor-pointer border-2 transition-all ${state.selectedChampionshipId === champ.id ? 'bg-falcon-brown border-falcon-brown text-white shadow-xl' : 'border-transparent bg-gray-50 hover:bg-white hover:border-falcon-brown/20'}`} onClick={() => onUpdateState({ selectedChampionshipId: champ.id })}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0"><span className="font-black text-xs uppercase block truncate">{champ.name}</span></div>
                    <button onClick={(e) => { e.stopPropagation(); deleteChamp(champ.id); }} className={`p-1.5 rounded-lg transition-colors ${state.selectedChampionshipId === champ.id ? 'hover:bg-white/10 text-white' : 'text-red-300 hover:text-red-500 hover:bg-red-50'}`}><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); togglePublic(champ.id); }} className={`w-full text-[9px] py-2.5 rounded-xl border-2 uppercase font-black tracking-widest transition-all ${champ.isPublic ? (state.selectedChampionshipId === champ.id ? 'bg-white text-field-green border-white' : 'bg-field-green text-white border-field-green shadow-md') : (state.selectedChampionshipId === champ.id ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-200 text-gray-400 hover:border-field-green hover:text-field-green')}`}>
                    {champ.isPublic ? "Resultados Públicos" : "Publicar Resultados"}
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
