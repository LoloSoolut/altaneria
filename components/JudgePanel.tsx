import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

import FlightScoringForm from './FlightScoringForm.tsx';
import TechnicalAssistant from './TechnicalAssistant.tsx';
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

  // CRITICAL FIX: Resetear vistas internas al cambiar de campeonato seleccionado
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
    const updatedChamps = state.championships.map(c => {
      if (c.id === id) {
        const willBePublic = !c.isPublic;
        return { 
          ...c, 
          isPublic: willBePublic, 
          publishedAt: willBePublic ? Date.now() : c.publishedAt 
        };
      }
      return { ...c, isPublic: false };
    });

    const activePublicChamp = updatedChamps.find(c => c.isPublic);
    onUpdateState({ championships: updatedChamps, publicChampionshipId: activePublicChamp?.id || null });

    if (supabase) {
      setSyncing(true);
      try {
        await supabase.from('championships').update({ isPublic: false }).neq('id', 'temp-id');
        if (activePublicChamp) await syncChampionship(activePublicChamp);
      } catch (e) {
        setLastError("Error de publicación");
      } finally {
        setSyncing(false);
      }
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

  return (
    <div className="space-y-6 px-1">
      <div className={`px-5 py-3 rounded-2xl flex items-center justify-between transition-all ${!supabase ? 'bg-orange-50 text-orange-600' : lastError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-field-green'}`}>
        <div className="flex items-center gap-3">
          {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
          <p className="text-[10px] font-black uppercase tracking-widest">{lastError ? 'Error de Sincronización' : 'Base de Datos en Tiempo Real Activa'}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black opacity-30">PRO SYSTEM v{APP_VERSION}</span>
        </div>
      </div>

      <div className="flex flex-col xl:grid xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-6 order-2 xl:order-1">
          <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-professional flex flex-col sm:flex-row justify-between items-center border border-gray-100 gap-8 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-field-green/10 rounded-[24px] flex items-center justify-center">
                <Gavel className="w-8 h-8 text-field-green" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter leading-none">Control de Vuelos</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2 italic">Gabinete Arbitral Oficial</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              {selectedChamp && (
                <button onClick={exportToPDF} className="flex-1 sm:flex-none bg-orange-600 text-white px-8 py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all shadow-xl active:scale-95">
                  <FileDown className="w-4 h-4" /> Exportar Acta
                </button>
              )}
              <button onClick={() => setIsCreating(true)} className="flex-1 sm:flex-none bg-field-green text-white px-8 py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all shadow-xl active:scale-95">
                <Plus className="w-4 h-4" /> Nueva Competición
              </button>
            </div>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateChamp} className="bg-white p-10 rounded-[48px] shadow-2xl space-y-6 border-4 border-field-green/10 animate-in zoom-in-95">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Nombre de la Competición</label>
                  <input required placeholder="Trofeo Altanería..." value={newChamp.name} onChange={e => setNewChamp({...newChamp, name: e.target.value})} className="w-full px-6 py-5 border-2 border-gray-50 rounded-2xl focus:border-field-green outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Fecha</label>
                  <input required type="date" value={newChamp.date} onChange={e => setNewChamp({...newChamp, date: e.target.value})} className="w-full px-6 py-5 border-2 border-gray-50 rounded-2xl focus:border-field-green outline-none font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Localización / Campo de Vuelo</label>
                <input required placeholder="Municipio, Provincia..." value={newChamp.location} onChange={e => setNewChamp({...newChamp, location: e.target.value})} className="w-full px-6 py-5 border-2 border-gray-50 rounded-2xl focus:border-field-green outline-none font-bold" />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsCreating(false)} className="px-8 py-5 font-black text-gray-400 text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
                <button type="submit" className="bg-field-green text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Inicializar Evento</button>
              </div>
            </form>
          )}

          {selectedChamp ? (
            <div className="bg-white rounded-[48px] shadow-xl p-6 md:p-12 border border-gray-100 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b pb-10 gap-8">
                <div>
                  <h3 className="text-4xl font-black text-field-green uppercase tracking-tighter leading-none">{selectedChamp.name}</h3>
                  <p className="text-[10px] text-gray-400 font-black mt-3 uppercase tracking-[0.3em] italic">{selectedChamp.location} — {selectedChamp.date}</p>
                </div>
                {!editingFlightId && !isAddingParticipant && (
                  <button onClick={() => setIsAddingParticipant(true)} className="w-full md:w-auto bg-falcon-brown text-white px-10 py-6 rounded-2xl flex items-center justify-center gap-4 font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-falcon-brown/30 active:scale-95 transition-all">
                    <Plus className="w-6 h-6" /> Registrar Nuevo Vuelo
                  </button>
                )}
              </div>

              {isAddingParticipant ? (
                <div className="animate-in slide-in-from-bottom-6 duration-500">
                  <FlightScoringForm flight={{id: crypto.randomUUID(), falconName: '', falconerName: '', tiempoCortesia: 0, tiempoVuelo: 0, duracionTotalVuelo: 0, velocidadPicado: 0, alturaServicio: 0, distanciaServicio: 0, capturaType: null, 'bon recogida': 0, penPicado: 0, penSenueloEncarnado: false, penEnsenarSenuelo: false, penSueltaObligada: false, disqualifications: { superar10min: false, ensenarVivos: false, conductaAntideportiva: false, noComparecer: false }, totalPoints: 0}} onSave={(d) => saveParticipant(d, false)} onCancel={() => setIsAddingParticipant(false)} />
                </div>
              ) : editingFlightId ? (
                <div className="animate-in slide-in-from-bottom-6 duration-500">
                  <FlightScoringForm flight={selectedChamp.participants.find(f => f.id === editingFlightId)!} onSave={(d) => saveParticipant(d, true)} onCancel={() => setEditingFlightId(null)} />
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedChamp.participants.length === 0 ? (
                    <div className="py-24 text-center bg-gray-50 rounded-[40px] border-4 border-dashed border-gray-100">
                       <Bird className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                       <p className="text-gray-400 font-black uppercase text-xs tracking-[0.3em]">Bolsa de Vuelos Vacía</p>
                    </div>
                  ) : (
                    selectedChamp.participants.sort((a,b) => b.totalPoints - a.totalPoints).map((p, i) => (
                      <div key={p.id} className="flex flex-col sm:flex-row items-center justify-between p-8 border-2 border-gray-50 rounded-[32px] hover:bg-green-50/30 transition-all hover:border-field-green/10 group">
                        <div className="flex items-center gap-8 w-full sm:w-auto mb-6 sm:mb-0">
                          <span className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${i < 3 ? 'bg-field-green text-white' : 'bg-gray-100 text-gray-400'}`}>{i+1}</span>
                          <div>
                            <p className="font-black text-2xl text-gray-800 leading-none group-hover:text-field-green transition-colors uppercase tracking-tight">{p.falconerName}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">{p.falconName}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-10 w-full sm:w-auto border-t sm:border-t-0 pt-6 sm:pt-0">
                          <div className="text-right">
                            <p className={`text-3xl font-black ${p.totalPoints === 0 ? 'text-red-500' : 'text-field-green'}`}>{p.totalPoints.toFixed(2)}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{p.alturaServicio}m techo</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setEditingFlightId(p.id)} className="p-5 bg-gray-50 rounded-2xl text-gray-400 hover:bg-field-green hover:text-white transition-all shadow-sm"><Edit3 className="w-5 h-5" /></button>
                            <button onClick={() => deleteParticipant(p.id)} className="p-5 bg-gray-50 rounded-2xl text-red-200 hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[48px] p-24 text-center border-4 border-dashed border-gray-100 shadow-inner flex flex-col items-center justify-center">
               <ScrollText className="w-20 h-20 text-gray-100 mb-8 animate-pulse" />
               <p className="text-gray-400 font-black uppercase text-sm tracking-[0.4em]">Seleccione un evento del historial</p>
            </div>
          )}
        </div>

        <div className="xl:col-span-1 space-y-8 order-1 xl:order-2">
          {/* Historial de Campeonatos */}
          <div className="bg-white p-8 rounded-[40px] shadow-professional border border-gray-100 sticky top-32">
            <h3 className="font-black text-[11px] uppercase tracking-[0.3em] mb-8 text-gray-400 flex items-center gap-3 border-b pb-6">
              <Clock className="w-5 h-5" /> Historial Técnico
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
              {state.championships.map(champ => (
                <div key={champ.id} className={`p-6 rounded-[32px] cursor-pointer border-2 transition-all duration-300 ${state.selectedChampionshipId === champ.id ? 'bg-falcon-brown border-falcon-brown text-white shadow-2xl scale-[1.02]' : 'bg-gray-50 border-transparent hover:border-gray-200'}`} onClick={() => onUpdateState({ selectedChampionshipId: champ.id })}>
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <span className="font-black text-xs uppercase block truncate tracking-tight">{champ.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteChamp(champ.id); }} className={`p-2 rounded-xl transition-all ${state.selectedChampionshipId === champ.id ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'text-red-200 hover:text-red-500 hover:bg-red-50'}`}><Trash2 className="w-4 h-4"/></button>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePublic(champ.id); }} 
                    className={`w-full text-[9px] py-4 rounded-2xl border-2 uppercase font-black tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                      champ.isPublic 
                        ? 'bg-field-green text-white border-field-green shadow-lg' 
                        : (state.selectedChampionshipId === champ.id ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-200 text-gray-400 hover:border-field-green hover:text-field-green')
                    }`}
                  >
                    {champ.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {champ.isPublic ? "Publicado" : "Hacer Público"}
                  </button>
                </div>
              ))}
            </div>

            {/* INTEGRACIÓN DEL ASISTENTE TÉCNICO IA */}
            <div className="mt-8 border-t pt-8">
              <TechnicalAssistant />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgePanel;