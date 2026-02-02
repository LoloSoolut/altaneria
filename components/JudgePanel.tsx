
import React, { useState, useEffect } from 'react';
import { AppState, Championship, FlightData } from '../types.ts';
import { supabase } from '../supabase.ts';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Gavel, 
  Clock, 
  Cloud, 
  RefreshCw, 
  FileDown, 
  ScrollText, 
  Bird,
  Eye,
  EyeOff,
  ChevronRight,
  List,
  X
} from 'lucide-react';

import FlightScoringForm from './FlightScoringForm.tsx';
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
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const selectedChamp = state.championships.find(c => c.id === state.selectedChampionshipId);

  useEffect(() => {
    setEditingFlightId(null);
    setIsAddingParticipant(false);
    setIsCreating(false);
  }, [state.selectedChampionshipId]);

  const syncChampionship = async (champ: Championship) => {
    if (!supabase) return;
    setSyncing(true);
    setLastError(null);
    try {
      const { error } = await supabase
        .from('championships')
        .upsert({
          id: champ.id,
          name: champ.name,
          date: champ.date,
          location: champ.location,
          participants: champ.participants,
          isPublic: champ.isPublic,
          createdAt: champ.createdAt,
          publishedAt: champ.publishedAt
        }, { onConflict: 'id' });

      if (error) throw error;
    } catch (e: any) {
      setLastError(e.message);
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
    await syncChampionship(champ);
    setIsCreating(false);
    setNewChamp({ name: '', date: '', location: '' });
  };

  const togglePublic = async (id: string) => {
    if (!supabase) return;
    setSyncing(true);
    
    try {
      const targetChamp = state.championships.find(c => c.id === id);
      if (!targetChamp) return;

      const newPublicStatus = !targetChamp.isPublic;
      const now = Date.now();

      await supabase.from('championships').update({ isPublic: false }).neq('id', 'dummy-id');

      if (newPublicStatus) {
        const { error } = await supabase
          .from('championships')
          .update({ 
            isPublic: true, 
            publishedAt: now 
          })
          .eq('id', id);
        
        if (error) throw error;
      }

      const updatedChamps = state.championships.map(c => ({
        ...c,
        isPublic: c.id === id ? newPublicStatus : false,
        publishedAt: c.id === id && newPublicStatus ? now : c.publishedAt
      }));

      onUpdateState({ 
        championships: updatedChamps, 
        publicChampionshipId: newPublicStatus ? id : null 
      });

    } catch (e: any) {
      console.error("Error al publicar:", e.message);
      setLastError("Error de red al publicar");
    } finally {
      setSyncing(false);
    }
  };

  const saveParticipant = async (data: FlightData, isUpdate: boolean) => {
    if (!selectedChamp) return;
    const updatedParticipants = isUpdate 
      ? selectedChamp.participants.map(p => p.id === data.id ? data : p)
      : [...selectedChamp.participants, data];
    
    const updatedChamp = { ...selectedChamp, participants: updatedParticipants };
    onUpdateState({ championships: state.championships.map(c => c.id === selectedChamp.id ? updatedChamp : c) });
    await syncChampionship(updatedChamp);
    
    setIsAddingParticipant(false);
    setEditingFlightId(null);
  };

  const deleteChamp = async (id: string) => {
    if (!confirm('¿Eliminar evento permanentemente?')) return;
    const updatedChamps = state.championships.filter(c => c.id !== id);
    onUpdateState({ 
      championships: updatedChamps,
      selectedChampionshipId: state.selectedChampionshipId === id ? (updatedChamps[0]?.id || null) : state.selectedChampionshipId 
    });
    if (supabase) await supabase.from('championships').delete().eq('id', id);
  };

  const deleteParticipant = async (pid: string) => {
    if (!selectedChamp || !confirm('¿Eliminar registro de vuelo?')) return;
    const updatedParticipants = selectedChamp.participants.filter(p => p.id !== pid);
    const updatedChamp = { ...selectedChamp, participants: updatedParticipants };
    onUpdateState({ championships: state.championships.map(c => c.id === selectedChamp.id ? updatedChamp : c) });
    await syncChampionship(updatedChamp);
  };

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
    doc.text('ACTA OFICIAL DE RESULTADOS TÉCNICOS', 15, 31);
    
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(18);
    doc.text(selectedChamp.name, 15, 55);
    doc.setFontSize(10);
    doc.text(`Ubicación: ${selectedChamp.location} | Fecha: ${selectedChamp.date}`, 15, 62);

    const sortedParticipants = [...selectedChamp.participants].sort((a, b) => b.totalPoints - a.totalPoints);
    const tableData = sortedParticipants.map((p, i) => {
      const turnBonus = SCORING.calculateTimeBonus(p.tiempoVuelo);
      return [
        i + 1, p.falconerName, p.falconName, `${p.alturaServicio}m`,
        `${Math.floor(p.tiempoVuelo / 60)}m ${p.tiempoVuelo % 60}s`,
        `${p.velocidadPicado}km/h`, `${p.distanciaServicio}m`,
        turnBonus, p.totalPoints.toFixed(2)
      ];
    });

    // @ts-ignore
    doc.autoTable({
      startY: 75,
      head: [['Pos', 'Cetrero', 'Halcón', 'Altura', 'T.Rem', 'Picado', 'Dist.', 'Bono', 'TOTAL']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor }
    });
    doc.save(`Acta_${selectedChamp.name}.pdf`);
  };

  const ChampionshipList = () => (
    <div className="space-y-4 pr-3 overflow-y-auto custom-scrollbar max-h-[55vh] lg:max-h-[500px] pb-8">
      {state.championships.length === 0 && (
        <p className="text-center py-10 text-gray-400 font-bold uppercase text-[10px]">No hay campeonatos registrados</p>
      )}
      {state.championships.map(champ => (
        <div 
          key={champ.id} 
          className={`p-5 rounded-[24px] cursor-pointer border-2 transition-all duration-300 ${state.selectedChampionshipId === champ.id ? 'bg-falcon-brown border-falcon-brown text-white shadow-xl scale-[1.02]' : 'bg-gray-50 border-transparent hover:border-gray-200'}`} 
          onClick={() => { onUpdateState({ selectedChampionshipId: champ.id }); setIsHistoryModalOpen(false); }}
        >
          <div className="flex justify-between items-start mb-3 gap-2">
            <div className="min-w-0">
              <span className="font-black text-xs uppercase block tracking-tight leading-tight truncate">{champ.name}</span>
              <span className={`text-[8px] uppercase font-black block mt-1 ${state.selectedChampionshipId === champ.id ? 'text-white/60' : 'text-gray-400'}`}>{champ.location} — {champ.date}</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); deleteChamp(champ.id); }} 
              className={`p-2 rounded-xl transition-all shrink-0 ${state.selectedChampionshipId === champ.id ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'text-red-200 hover:text-red-500'}`}
            >
              <Trash2 className="w-4 h-4"/>
            </button>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); togglePublic(champ.id); }} 
            disabled={syncing}
            className={`w-full text-[8px] py-3 rounded-xl border-2 uppercase font-black tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
              champ.isPublic 
                ? 'bg-field-green text-white border-field-green shadow-md' 
                : (state.selectedChampionshipId === champ.id ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-200 text-gray-400 hover:border-field-green hover:text-field-green')
            } ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : champ.isPublic ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {champ.isPublic ? "Publicado" : "Hacer Público"}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Sync Status Bar */}
      <div className={`mx-auto max-w-5xl px-5 py-2.5 rounded-full flex items-center justify-between transition-all shadow-sm ${!supabase ? 'bg-orange-50 text-orange-600' : lastError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-field-green border border-green-100'}`}>
        <div className="flex items-center gap-2">
          {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Cloud className="w-3 h-3" />}
          <p className="text-[9px] font-black uppercase tracking-widest leading-none">{lastError ? lastError : syncing ? 'Sincronizando...' : 'Conectado'}</p>
        </div>
        <span className="text-[8px] font-black opacity-30 uppercase tracking-[0.2em]">v{APP_VERSION}</span>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 px-2">
        
        {/* Main Content Area */}
        <div className="flex-grow space-y-6">
          
          {/* Header Card */}
          <div className="bg-white p-6 lg:p-10 rounded-[32px] lg:rounded-[40px] shadow-professional flex flex-col md:flex-row justify-between items-center border border-gray-100 gap-6">
            <div className="flex items-center gap-4 lg:gap-6 w-full md:w-auto">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-field-green/10 rounded-2xl flex items-center justify-center shrink-0">
                <Gavel className="w-6 h-6 lg:w-8 lg:h-8 text-field-green" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl lg:text-3xl font-black text-gray-800 uppercase tracking-tighter leading-none truncate">Control Técnico</h2>
                <div className="flex items-center gap-2 mt-2">
                  <button 
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="flex lg:hidden items-center gap-1.5 px-4 py-2 bg-falcon-brown text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-falcon-brown/20 active:scale-95 transition-all"
                  >
                    <List className="w-3.5 h-3.5" /> Ver Eventos ({state.championships.length})
                  </button>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest hidden sm:block italic">Arbitraje Profesional</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {selectedChamp && (
                <button onClick={exportToPDF} className="flex-1 md:flex-none bg-orange-600 text-white px-5 py-3 lg:py-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all shadow-lg active:scale-95">
                  <FileDown className="w-4 h-4" /> <span className="hidden sm:inline">Exportar Acta</span>
                </button>
              )}
              <button onClick={() => setIsCreating(true)} className="flex-1 md:flex-none bg-field-green text-white px-5 py-3 lg:py-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all shadow-lg active:scale-95">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo Evento</span>
              </button>
            </div>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateChamp} className="bg-white p-8 lg:p-10 rounded-[32px] lg:rounded-[48px] shadow-2xl space-y-6 border-4 border-field-green/10 animate-in zoom-in-95">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Nombre del Campeonato</label>
                  <input required placeholder="Ej: Trofeo Altanería de León..." value={newChamp.name} onChange={e => setNewChamp({...newChamp, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-field-green outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Fecha</label>
                  <input required type="date" value={newChamp.date} onChange={e => setNewChamp({...newChamp, date: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-field-green outline-none font-bold" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Localización / Campo de Vuelo</label>
                <input required placeholder="Ubicación exacta..." value={newChamp.location} onChange={e => setNewChamp({...newChamp, location: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-field-green outline-none font-bold" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-4 font-black text-gray-400 text-[10px] uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="bg-field-green text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Crear y Guardar</button>
              </div>
            </form>
          )}

          {selectedChamp ? (
            <div className="bg-white rounded-[32px] lg:rounded-[48px] shadow-xl p-6 lg:p-10 border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-100 pb-8 gap-6">
                <div className="min-w-0">
                  <h3 className="text-2xl lg:text-4xl font-black text-field-green uppercase tracking-tighter leading-none truncate">{selectedChamp.name}</h3>
                  <p className="text-[9px] text-gray-400 font-black mt-3 uppercase tracking-widest italic">{selectedChamp.location} — {selectedChamp.date}</p>
                </div>
                {!editingFlightId && !isAddingParticipant && (
                  <button onClick={() => setIsAddingParticipant(true)} className="w-full md:w-auto bg-falcon-brown text-white px-8 py-4 lg:py-6 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                    <Plus className="w-5 h-5" /> Registrar Vuelo
                  </button>
                )}
              </div>

              {isAddingParticipant ? (
                <FlightScoringForm flight={{id: crypto.randomUUID(), falconName: '', falconerName: '', tiempoCortesia: 0, tiempoVuelo: 0, duracionTotalVuelo: 0, velocidadPicado: 0, alturaServicio: 0, distanciaServicio: 0, capturaType: null, 'bon recogida': 0, penPicado: 0, penSenueloEncarnado: false, penEnsenarSenuelo: false, penSueltaObligada: false, disqualifications: { superar10min: false, ensenarVivos: false, conductaAntideportiva: false, noComparecer: false }, totalPoints: 0}} onSave={(d) => saveParticipant(d, false)} onCancel={() => setIsAddingParticipant(false)} />
              ) : editingFlightId ? (
                <FlightScoringForm flight={selectedChamp.participants.find(f => f.id === editingFlightId)!} onSave={(d) => saveParticipant(d, true)} onCancel={() => setEditingFlightId(null)} />
              ) : (
                <div className="space-y-3">
                  {selectedChamp.participants.length === 0 ? (
                    <div className="py-20 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                       <Bird className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                       <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Aún no hay vuelos registrados</p>
                    </div>
                  ) : (
                    selectedChamp.participants.sort((a,b) => b.totalPoints - a.totalPoints).map((p, i) => (
                      <div key={p.id} className="flex flex-col sm:flex-row items-center justify-between p-6 border-2 border-gray-50 rounded-[24px] hover:bg-green-50/20 transition-all hover:border-field-green/20 group">
                        <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
                          <span className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center font-black text-base lg:text-xl shrink-0 ${i < 3 ? 'bg-field-green text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>{i+1}</span>
                          <div className="min-w-0">
                            <p className="font-black text-lg lg:text-2xl text-gray-800 leading-tight uppercase truncate">{p.falconerName}</p>
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1 truncate">{p.falconName}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-6 lg:gap-8 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                          <div className="text-right shrink-0">
                            <p className={`text-2xl lg:text-3xl font-black leading-none ${p.totalPoints === 0 ? 'text-red-500' : 'text-field-green'}`}>{p.totalPoints.toFixed(2)}</p>
                            <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest mt-1">{p.alturaServicio}m techo</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => setEditingFlightId(p.id)} className="p-4 bg-gray-50 rounded-xl text-gray-400 hover:bg-field-green hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => deleteParticipant(p.id)} className="p-4 bg-gray-50 rounded-xl text-red-200 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-12 lg:p-20 text-center border-2 border-dashed border-gray-200 shadow-inner flex flex-col items-center justify-center space-y-6">
               <ScrollText className="w-16 h-16 text-gray-200 animate-bounce" />
               <div className="space-y-2">
                 <h3 className="text-xl font-black uppercase text-gray-600">Ningún Evento Seleccionado</h3>
                 <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Selecciona un campeonato del historial lateral para comenzar el arbitraje técnico.</p>
               </div>
               <div className="flex flex-col sm:flex-row gap-3">
                 <button onClick={() => setIsHistoryModalOpen(true)} className="lg:hidden bg-falcon-brown text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Ver Historial Completo</button>
                 <button onClick={() => setIsCreating(true)} className="bg-field-green text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Crear Nuevo Evento</button>
               </div>
            </div>
          )}
        </div>

        {/* Sidebar History (Desktop) */}
        <aside className="hidden lg:block w-80 shrink-0 space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-professional border border-gray-100 sticky top-32">
            <h3 className="font-black text-[10px] uppercase tracking-widest mb-6 text-gray-400 flex items-center justify-between border-b pb-4">
              <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Historial de Eventos</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">{state.championships.length}</span>
            </h3>
            <ChampionshipList />
          </div>
        </aside>

        {/* Mobile History Modal */}
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-300">
            <div className="bg-white w-full rounded-t-[32px] p-6 pb-10 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6 overflow-hidden">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest text-gray-800">Seleccionar Evento</h3>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Historial total de competiciones</p>
                </div>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-3 bg-gray-100 rounded-2xl text-gray-500 active:scale-90 transition-all"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="flex-grow overflow-hidden flex flex-col">
                 <ChampionshipList />
              </div>

              <button 
                onClick={() => { setIsCreating(true); setIsHistoryModalOpen(false); }}
                className="mt-4 w-full py-5 bg-field-green text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all shrink-0"
              >
                Crear Nuevo Campeonato
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JudgePanel;
