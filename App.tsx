
import React, { useState, useEffect, useCallback } from 'react';
import { Championship, AppState } from './types.ts';
import JudgePanel from './components/JudgePanel.tsx';
import PublicView from './components/PublicView.tsx';
import TechnicalAssistant from './components/TechnicalAssistant.tsx';
import { supabase } from './supabase.ts';
import { Trophy, Gavel, Users, ShieldCheck, Bird, Radio, ChevronRight, Home, MessageSquare, Menu, X } from 'lucide-react';
import { APP_VERSION } from './constants.ts';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'judge' | 'public' | 'assistant'>(() => {
    const savedView = localStorage.getItem('altaneria_current_view');
    return (savedView as any) || 'home';
  });
  
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [state, setState] = useState<AppState>({
    championships: [],
    selectedChampionshipId: null,
    publicChampionshipId: null
  });

  useEffect(() => {
    localStorage.setItem('altaneria_current_view', view);
  }, [view]);

  const fetchData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: championships, error } = await supabase
        .from('championships')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && championships) {
        const publicChamps = championships.filter(c => c.isPublic === true);
        let correctedChampionships = [...championships];
        let finalPublicId: string | null = null;

        if (publicChamps.length > 1) {
          const winner = publicChamps.sort((a, b) => {
            const timeA = a.publishedAt || a.createdAt || 0;
            const timeB = b.publishedAt || b.createdAt || 0;
            return Number(timeB) - Number(timeA);
          })[0];
          
          finalPublicId = winner.id;
          correctedChampionships = championships.map(c => ({
            ...c,
            isPublic: c.id === winner.id
          }));

          await supabase.from('championships')
            .update({ isPublic: false })
            .neq('id', winner.id);
        } else {
          finalPublicId = publicChamps[0]?.id || null;
        }

        setState(prev => ({
          ...prev,
          championships: correctedChampionships,
          // CAMBIO: Priorizar el ID público si prev.selectedChampionshipId es null
          selectedChampionshipId: prev.selectedChampionshipId || finalPublicId || (correctedChampionships[0]?.id || null),
          publicChampionshipId: finalPublicId
        }));
      }
    } catch (e) {
      console.error("Error en fetchData:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase?.channel('sync-live-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'championships' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      if (channel) supabase?.removeChannel(channel);
    };
  }, [fetchData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Lolo') {
      setIsAuth(true);
      setView('judge');
    } else {
      alert('Clave incorrecta');
    }
  };

  const updateState = (newState: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcf9]">
        <div className="text-center space-y-4">
          <Bird className="w-12 h-12 text-field-green animate-bounce mx-auto" />
          <p className="font-black text-[10px] uppercase tracking-[0.3em] text-gray-400">Sincronizando Sistema v{APP_VERSION}</p>
        </div>
      </div>
    );
  }

  const activePublicChamp = state.championships.find(c => c.id === state.publicChampionshipId);

  const NavButton = ({ target, icon: Icon, label, badge }: { target: any, icon: any, label: string, badge?: boolean }) => (
    <button 
      onClick={() => { setView(target); setIsMobileMenuOpen(false); }} 
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all relative ${view === target ? 'bg-white text-field-green shadow-lg ring-1 ring-black/5' : 'text-white/80 hover:bg-white/10'}`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden lg:inline">{label}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcf9]">
      {/* Header Desktop & Mobile Wrapper */}
      <header className="bg-field-green text-white py-4 lg:py-6 shadow-xl border-b-[4px] border-falcon-brown sticky top-0 z-[100] transition-all">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
            <div className="bg-white p-2 rounded-xl shadow-md group-hover:rotate-3 transition-transform">
              <Trophy className="w-6 h-6 lg:w-8 lg:h-8 text-field-green" />
            </div>
            <div>
              <h1 className="text-sm lg:text-xl font-black uppercase tracking-tighter leading-none">Competiciones de Altanería</h1>
              <p className="text-[8px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1 hidden lg:block">Para Profesionales v{APP_VERSION}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex bg-black/10 p-1.5 rounded-2xl backdrop-blur-md gap-1">
            <NavButton target="home" icon={Home} label="Inicio" />
            <NavButton target="public" icon={Users} label="Público" badge={!!activePublicChamp} />
            <NavButton target="judge" icon={Gavel} label="Jurado" />
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 rounded-xl bg-white/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-field-green border-t border-white/10 p-4 space-y-2 animate-in slide-in-from-top-2 shadow-2xl">
            <button onClick={() => { setView('home'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 text-white font-black uppercase text-xs">
              <Home className="w-5 h-5" /> Inicio
            </button>
            <button onClick={() => { setView('public'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 text-white font-black uppercase text-xs relative">
              <Users className="w-5 h-5" /> Público {activePublicChamp && <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
            </button>
            <button onClick={() => { setView('judge'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 text-white font-black uppercase text-xs">
              <Gavel className="w-5 h-5" /> Jurado
            </button>
          </div>
        )}
      </header>

      <main className="flex-grow container mx-auto px-4 py-6 pb-24 lg:pb-8">
        {view === 'home' && (
          <div className="max-w-5xl mx-auto space-y-8 lg:space-y-16 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="relative group overflow-hidden rounded-[32px] lg:rounded-[48px] shadow-2xl bg-white border-4 lg:border-8 border-white">
              <div className="relative h-[450px] lg:h-[650px] overflow-hidden">
                <img 
                  src="https://halcones.es/wp-content/uploads/2026/01/slide_gyr_halcones-1.png" 
                  alt="Halcón Gerifalte" 
                  className="w-full h-full object-cover transition-transform duration-[5000ms] group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-6 lg:p-12">
                  <div className="flex flex-col gap-2 mb-4 lg:mb-6">
                    {activePublicChamp ? (
                      <div className="flex items-center gap-2 self-start bg-red-600 px-4 py-2 rounded-full shadow-lg">
                        <Radio className="w-3 h-3 text-white animate-pulse" />
                        <span className="text-white text-[9px] font-black uppercase tracking-widest">En Directo: {activePublicChamp.name}</span>
                      </div>
                    ) : (
                      <span className="text-field-green bg-white/95 backdrop-blur-sm self-start px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">
                        Élite de la Cetrería Profesional
                      </span>
                    )}
                  </div>
                  <h2 className="text-white text-3xl lg:text-7xl font-black mb-3 tracking-tighter uppercase leading-none max-w-2xl drop-shadow-lg">
                    Excelencia en Altanería
                  </h2>
                  <p className="text-white/70 text-sm lg:text-xl font-light max-w-xl italic border-l-2 lg:border-l-4 border-field-green pl-4 lg:pl-6 mb-6 lg:mb-8 leading-relaxed line-clamp-2 lg:line-clamp-none">
                    Rigurosidad técnica y pasión por el vuelo. El estándar profesional para el registro oficial de competiciones cetreras.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => setView('public')} className="bg-field-green text-white px-6 py-4 lg:px-8 lg:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-green-700 transition-all shadow-xl active:scale-95">
                      Ver Clasificación <Users className="w-4 h-4" />
                    </button>
                    <button onClick={() => setView('judge')} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-4 lg:px-8 lg:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-white/20 transition-all active:scale-95">
                      Acceso Jurado <ShieldCheck className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
              <div className="bg-white p-8 lg:p-12 rounded-[32px] lg:rounded-[48px] shadow-professional border border-gray-100 hover:border-field-green transition-all duration-500 cursor-pointer group relative overflow-hidden" onClick={() => setView('public')}>
                <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Trophy className="w-48 h-48 text-field-green" />
                </div>
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-field-green group-hover:text-white transition-all">
                  <Users className="w-8 h-8 text-field-green group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-gray-800 uppercase tracking-tighter">Resultados Públicos</h3>
                <p className="text-gray-500 text-sm lg:text-lg leading-relaxed mb-6">Acceso a la clasificación oficial en tiempo real y actas de vuelo detalladas.</p>
                <div className="flex items-center gap-2 text-field-green font-black uppercase text-[10px] tracking-widest group-hover:gap-4 transition-all">
                  Entrar ahora <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white p-8 lg:p-12 rounded-[32px] lg:rounded-[48px] shadow-professional border border-gray-100 hover:border-falcon-brown transition-all duration-500 cursor-pointer group relative overflow-hidden" onClick={() => setView('judge')}>
                <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Gavel className="w-48 h-48 text-falcon-brown" />
                </div>
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-falcon-brown group-hover:text-white transition-all">
                  <ShieldCheck className="w-8 h-8 text-falcon-brown group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-gray-800 uppercase tracking-tighter">Área de Jueces</h3>
                <p className="text-gray-500 text-sm lg:text-lg leading-relaxed mb-6">Portal restringido para el cuerpo arbitral. Gestión de puntuaciones técnicas.</p>
                <div className="flex items-center gap-2 text-falcon-brown font-black uppercase text-[10px] tracking-widest group-hover:gap-4 transition-all">
                  Acceso restringido <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'judge' && !isAuth && (
          <div className="max-w-md mx-auto mt-10 lg:mt-20 bg-white p-8 lg:p-12 rounded-[32px] shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-falcon-brown/10 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                <Gavel className="w-10 h-10 text-falcon-brown" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter text-gray-800">Acceso Arbitral</h2>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">Introduzca la clave profesional</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-6 py-5 rounded-2xl border-2 border-gray-100 focus:border-field-green outline-none text-center text-3xl tracking-widest font-black transition-all" 
                placeholder="••••" 
                autoFocus
              />
              <button type="submit" className="w-full bg-field-green text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:bg-green-800 transition-all active:scale-95">
                Verificar Credenciales
              </button>
            </form>
          </div>
        )}

        {view === 'judge' && isAuth && (
          <div className="space-y-8">
            <JudgePanel state={state} onUpdateState={updateState} />
            {/* Assistant Integrated into Judge Area */}
            <div className="max-w-4xl mx-auto">
              <TechnicalAssistant />
            </div>
          </div>
        )}
        
        {view === 'public' && <PublicView state={state} />}
        
        {view === 'assistant' && (
          <div className="max-w-3xl mx-auto py-6">
            <TechnicalAssistant />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex justify-around items-center z-[110] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-field-green scale-110' : 'text-gray-400'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">Inicio</span>
        </button>
        <button onClick={() => setView('public')} className={`flex flex-col items-center gap-1 transition-all relative ${view === 'public' ? 'text-field-green scale-110' : 'text-gray-400'}`}>
          <Users className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">Público</span>
          {activePublicChamp && <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
        </button>
        <button onClick={() => setView('judge')} className={`flex flex-col items-center gap-1 transition-all ${view === 'judge' ? 'text-field-green scale-110' : 'text-gray-400'}`}>
          <Gavel className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">Jurado</span>
        </button>
        <button onClick={() => setView('assistant')} className={`flex flex-col items-center gap-1 transition-all ${view === 'assistant' ? 'text-field-green scale-110' : 'text-gray-400'}`}>
          <MessageSquare className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">IA</span>
        </button>
      </div>

      <footer className="hidden lg:block bg-[#111] text-white/30 py-12 border-t border-white/5">
        <div className="container mx-auto px-6 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">
            COMPETICIONES DE ALTANERÍA PARA PROFESIONALES v{APP_VERSION}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest">
            © 2026 — Creado por <a href="https://soolut.com/" target="_blank" rel="noopener noreferrer" className="text-field-green">Soolut</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
