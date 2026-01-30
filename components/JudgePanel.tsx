import React, { useState } from 'react';
import { AppState, Championship, FlightData } from '../types.ts';
import { supabase } from '../supabase.ts';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Gavel, 
  Clock, 
  CloudOff, 
  Cloud, 
  RefreshCw, 
  FileDown, 
  ScrollText, 
  Bird,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

// Corrección de rutas: Aseguramos el uso de rutas relativas locales
import FlightScoringForm from './FlightScoringForm.tsx';
// Fix: Import APP_VERSION from constants
import { SCORING, APP_VERSION } from '../constants.ts';

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
    
    const primaryColor = [27, 94, 32]; 
    
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 297, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPETICIONES DE ALTANERÍA PARA PROFESIONALES', 15, 22);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('ACTA OFICIAL DE RESULTADOS TÉCNICOS Y CLASIFICACIÓN', 15, 31);
    
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(selectedChamp.name, 15, 55);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ubicación: ${selectedChamp.location} | Fecha: ${selectedChamp.date}`, 15, 62);
    doc.text(`Generado el ${new Date().toLocaleString()}`, 15, 67);

    const sortedParticipants = [...selectedChamp.participants].sort((a, b) => b.totalPoints - a.totalPoints);
    const tableData = sortedParticipants.map((p, i) => {
      const turnBonus = SCORING.calculateTimeBonus(p.tiempoVuelo);
      const penTotal = (p.penSenueloEncarnado ? 4 : 0) + 
                       (p.penEnsenarSenuelo ? 6 : 0) + 
                       (p.penSueltaObligada ? 10 : 0) + 
                       (p.penPicado || 0);

      const totalDuration = p.duracionTotalVuelo ? `${Math.floor(p.duracionTotalVuelo / 60)}m ${p.duracionTotalVuelo % 60}s` : '-';

      return [
        i + 1,
        p.falconerName,
        p.falconName,
        `${p.alturaServicio}m`,
        `${Math.floor(p.tiempoVuelo / 60)}m ${p.tiempoVuelo % 60}s`,
        totalDuration,
        `${p.tiempoCortesia}s`,
        `${p.velocidadPicado}km/h`,
        `${p.distanciaServicio}m`,
        p['bon recogida'],
        turnBonus,
        penTotal > 0 ? `-${penTotal}` : '0',
        { content: p.totalPoints.toFixed(2), styles: { fontStyle: 'bold', textColor: primaryColor, fontSize: 11 } }
      ];
    });

    // @ts-ignore
    doc.autoTable({
      startY: 75,
      head: [['Pos', 'Cetrero', 'Halcón', 'Alt(m)', 'T.Rem', 'T.Tot', 'T.Cort(s)', 'Picado', 'Dist(m)', 'B.Rec', 'B.Tie', 'Pen', 'TOTAL']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 8, halign: 'center', valign: 'middle' },
      styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
      columnStyles: {
        1: { halign: 'left', cellWidth: 35 },
        2: { halign: 'left', cellWidth: 30 },
        12: { cellWidth: 20, fillColor: [245, 245, 245] }
      }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Este documento constituye el registro oficial de la competición. Cualquier alteración anula su validez.', 15, 200);
      doc.text(`Acta Oficial v${APP_VERSION} | Página ${i} de ${pageCount}`, 250, 200);
    }

    doc.save(`${selectedChamp.name}.PDF`);
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
          createdAt: championship.createdAt,
          publishedAt: championship.publishedAt
        }, { onConflict: 'id' });

      if (error) setLastError(error.message);
    } catch (e) {
      setLastError("Error de sincronización de red");
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
    if (!confirm('¿Seguro que desea eliminar permanentemente este campeonato y sus registros?')) return;
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
    if (!selectedChamp || !confirm('¿Eliminar registro de vuelo de forma permanente?')) return;
    const updatedParticipants = selectedChamp.participants.filter(p => p.id !== participantId);
    const updatedChamp = { ...selectedChamp, participants: updatedParticipants };
    const updatedChamps = state.championships.map(c => c.id === selectedChamp.id ? updatedChamp : c);
    onUpdateState({ championships: updatedChamps });
    localStorage.setItem('altaneria_championships', JSON.stringify(updatedChamps));
    await syncWithSupabase(updatedChamp);
  };

  const togglePublic = async (id: string) => {
    const isCurrentlyPublic = state.publicChampionshipId === id;
    const newPublicId = isCurrentlyPublic ? null : id;
    const publicationTime = newPublicId ? Date.now() : undefined;
    
    const updatedChamps = state.championships.map(c => ({ 
      ...c, 
      isPublic: c.id === newPublicId,
      publishedAt: c.id === newPublicId ? publicationTime : c.publishedAt
    }));

    onUpdateState({ championships: updatedChamps, publicChampionshipId: newPublicId });
    localStorage.setItem('altaneria_championships', JSON.stringify(updatedChamps));

    if (supabase) {
      setSyncing(true);
      try {
        // Primero desactivamos todos los demás para asegurar que solo uno es público
        await supabase.from('championships').update({ isPublic: false }).neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (newPublicId) {
          // Activamos el seleccionado y grabamos la hora de publicación exacta
          await supabase.from('championships').update({ 
            isPublic: true, 
            publishedAt: publicationTime 
          }).eq('id', newPublicId);
        }
      } catch (e) {
        setLastError("Error actualizando visibilidad en la nube");
      } finally {
        setSyncing(false);
      }
    }
  };

  const emptyFlight = (): FlightData => ({
    id: crypto.randomUUID(), falconName: '', falconerName: '', tiempoCortesia: 0, tiempoVuelo: 0, duracionTotalVuelo: 0, velocidadPicado: 0,
    alturaServicio: 0, distanciaServicio: 0, capturaType: null, 'bon recogida': 0, penPicado: 0,
    penSenueloEncarnado: false, penEnsenarSenuelo: false, penSueltaObligada: false,
    disqualifications: { superar10min: false, ensenarVivos: false, conductaAntideportiva: false, noComparecer: false },
    totalPoints: 0
  });

  return (
    <div className="space-y-6 px-1">
      <div className={`px-5 py-3 rounded-2xl flex items-center justify-between transition-all ${!supabase ? 'bg-orange-50 border border-orange-100 text-orange-600' : lastError ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-green-50 border border-green-100 text-field-green'}`}>
        <div className="flex items-center gap-3">
          {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : supabase ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
          <div className="hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Conexión</p>
            <p className="text-xs font-bold mt-1">{!supabase ? "Modo Local" : lastError ? "Error Red" : "Nube Activa"}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          <div className="bg-white p-5 md:p-8 rounded-[32px] shadow-professional flex flex-col sm:flex-row justify-between items-center border border-gray-100 gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="hidden sm:flex w-14 h-14 bg-field-green/10 rounded-2xl items-center justify-center">
                <Gavel className="w-7 h-7 text-field-green" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-falcon-brown uppercase tracking-tight leading-none">Cuerpo Arbitral</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">v{APP_VERSION}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {selectedChamp && (
                <button onClick={exportToPDF} className="bg-yellow-600 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-yellow-700 transition-all shadow-lg active:scale-95">
                  <FileDown className="w-4 h-4" /> PDF Acta
                </button>
              )}
              <button onClick={() => setIsCreating(true)} className="bg-field-green text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all shadow-lg active:scale-95">
                <Plus className="w-4 h-4" /> Nuevo Evento
              </button>
            </div>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateChamp} className="bg-white p-6 md:p-8 rounded-[40px] shadow-2xl space-y-5 border-4 border-field-green/10 animate-in zoom-in-95 duration-300">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-gray-400 ml-1">Nombre Competición</label>
                <input required placeholder="Ej: Trofeo de Altanería..." value={newChamp.name} onChange={e => setNewChamp({...newChamp, name: e.target.value})} className="w-full px-5 py-4 border rounded-2xl outline-none focus:ring-4 focus:ring-field-green/10 focus:border-field-green transition-all" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-gray-400 ml-1">Fecha</label>
                  <input required type="date" value={newChamp.date} onChange={e => setNewChamp({...newChamp, date: e.target.value})} className="w-full px-5 py-4 border rounded-2xl outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-gray-400 ml-1">Localización</label>
                  <input required placeholder="Ciudad, Provincia..." value={newChamp.location} onChange={e => setNewChamp({...newChamp, location: e.target.value})} className="w-full px-5 py-4 border rounded-2xl outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-4 font-black text-gray-400 hover:text-gray-600 uppercase text-[10px] tracking-widest">Descartar</button>
                <button type="submit" className="bg-field-green text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Crear Campeonato</button>
              </div>
            </form>
          )}

          {selectedChamp ? (
            <div className="bg-white rounded-[40px] shadow-xl p-6 md:p-10 border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b pb-8 gap-6">
                <div>
                  <h3 className="text-3xl font-black text-field-green uppercase tracking-tight leading-none">{selectedChamp.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest italic">{selectedChamp.location} — {selectedChamp.date}</p>
                </div>
                {!editingFlightId && !isAddingParticipant && (
                  <button onClick={() => setIsAddingParticipant(true)} className="w-full md:w-auto bg-falcon-brown text-white px-8 py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-falcon-brown/20">
                    <Plus className="w-5 h-5" /> Registrar Vuelo
                  </button>
                )}
              </div>

              {isAddingParticipant ? (
                <div className="animate-in slide-in-from-top-6 duration-500">
                  <FlightScoringForm flight={emptyFlight()} onSave={(d) => saveParticipant(d, false)} onCancel={() => setIsAddingParticipant(false)} />
                </div>
              ) : editingFlightId ? (
                <div className="animate-in slide-in-from-top-6 duration-500">
                  <FlightScoringForm flight={selectedChamp.participants.find(f => f.id === editingFlightId)!} onSave={(d) => saveParticipant(d, true)} onCancel={() => setEditingFlightId(null)} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {selectedChamp.participants.length === 0 ? (
                    <div className="text-center py-24 bg-gray-50 rounded-[40px] border-4 border-dashed border-gray-200">
                      <Bird className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Esperando registros técnicos...</p>
                    </div>
                  ) : (
                    selectedChamp.participants.sort((a,b) => b.totalPoints - a.totalPoints).map((p, i) => (
                      <div key={p.id} className="group flex flex-col sm:flex-row items-center justify-between p-6 border-2 border-gray-50 rounded-3xl hover:bg-green-50/40 transition-all hover:border-field-green/10">
                        <div className="flex items-center gap-6 w-full sm:w-auto mb-4 sm:mb-0">
                          <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-colors shadow-sm ${i < 3 ? 'bg-field-green text-white' : 'bg-gray-100 text-gray-300'}`}>
                            {i+1}
                          </span>
                          <div>
                            <p className="font-black text-xl text-gray-800 leading-none mb-1 group-hover:text-field-green transition-colors">{p.falconerName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">{p.falconName}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                          <div className="text-left sm:text-right">
                            <p className="text-2xl font-black text-field-green">{p.totalPoints === 0 ? 'DESC.' : p.totalPoints.toFixed(2)}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{p.alturaServicio}m techo</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setEditingFlightId(p.id)} className="p-4 text-falcon-brown bg-gray-100 hover:bg-falcon-brown hover:text-white rounded-2xl transition-all shadow-sm" title="Editar">
                              <Edit3 className="w-5 h-5" />
                            </button>
                            <button onClick={() => deleteParticipant(p.id)} className="p-4 text-red-300 bg-gray-100 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm" title="Eliminar">
                              <Trash2 className="w-5 h-5" />
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
            <div className="bg-white rounded-[40px] p-24 text-center border-4 border-dashed border-gray-100 shadow-inner flex flex-col items-center justify-center animate-in fade-in duration-1000">
               <ScrollText className="w-20 h-20 text-gray-100 mb-8" />
               <h3 className="text-2xl font-black text-gray-300 uppercase tracking-[0.3em]">Selección de Competición</h3>
               <p className="text-gray-400 text-sm mt-3 max-w-sm font-medium">Elija un campeonato del historial técnico para gestionar las actas de vuelo y clasificaciones.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-8 order-1 lg:order-2">
          <div className="bg-white p-8 rounded-[40px] shadow-professional border border-gray-100 sticky top-32">
            <h3 className="font-black text-[11px] uppercase tracking-[0.3em] mb-8 text-gray-400 flex items-center gap-3 border-b pb-5">
              <Clock className="w-5 h-5" /> Historial de Eventos
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {state.championships.length === 0 && (
                <p className="text-center text-gray-300 text-[10px] font-black uppercase py-10">Historial Vacío</p>
              )}
              {state.championships.map(champ => {
                const isCurrentlyPublic = state.publicChampionshipId === champ.id;
                const isSelected = state.selectedChampionshipId === champ.id;
                return (
                  <div key={champ.id} className={`group p-5 rounded-3xl cursor-pointer border-2 transition-all duration-300 ${isSelected ? 'bg-falcon-brown border-falcon-brown text-white shadow-2xl scale-[1.02]' : 'border-transparent bg-gray-50 hover:bg-white hover:border-falcon-brown/20'}`} onClick={() => onUpdateState({ selectedChampionshipId: champ.id })}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-sm uppercase block truncate tracking-tight">{champ.name}</span>
                        <p className={`text-[9px] font-bold uppercase mt-1 opacity-60 ${isSelected ? 'text-white' : 'text-gray-400'}`}>{champ.date}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteChamp(champ.id); }} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white opacity-40 hover:opacity-100' : 'text-red-200 hover:text-red-500 hover:bg-red-50'}`}><Trash2 className="w-4 h-4"/></button>
                    </div>
                    
                    {/* Indicador de Publicación Grabada */}
                    {champ.publishedAt && (
                      <div className={`mb-3 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-field-green/60'}`}>
                        <CheckCircle2 className="w-2.5 h-2.5" /> 
                        Pub: {new Date(champ.publishedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    )}

                    <button 
                      onClick={(e) => { e.stopPropagation(); togglePublic(champ.id); }} 
                      className={`w-full text-[9px] py-3.5 rounded-2xl border-2 uppercase font-black tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                        isCurrentlyPublic 
                          ? (isSelected ? 'bg-white text-field-green border-white shadow-xl' : 'bg-field-green text-white border-field-green shadow-xl') 
                          : (isSelected ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-200 text-gray-400 hover:border-field-green hover:text-field-green')
                      }`}
                    >
                      {isCurrentlyPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {isCurrentlyPublic ? "Ocultar Público" : "Activar Público"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgePanel;