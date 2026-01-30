import React, { useState, useEffect, useCallback } from 'react';
import { Championship, AppState } from './types.ts';
import JudgePanel from './components/JudgePanel.tsx';
import PublicView from './components/PublicView.tsx';
import { supabase } from './supabase.ts';
import { Trophy, Gavel, Users, ShieldCheck, Loader2, AlertCircle, Bird, Radio, ChevronRight } from 'lucide-react';
import { APP_VERSION } from './constants.ts';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'judge' | 'public'>('home');
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState>({
    championships: [],
    selectedChampionshipId: null,
    publicChampionshipId: null
  });

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
        // Encontramos el campeonato que tenga isPublic = true
        // Si hay varios (error de concurrencia), cogemos el publicado más recientemente
        const publicChamps = championships.filter(c => c.isPublic === true);
        const latestPublic = publicChamps.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))[0];
        
        setState(prev => ({
          ...prev,
          championships,
          // Mantenemos la selección manual del juez si ya existe
          selectedChampionshipId: prev.selectedChampionshipId || (championships[0]?.id || null),
          publicChampionshipId: latestPublic?.id || null
        }));
        
        console.log("📡 Datos Sincronizados v1.5.7. Público:", latestPublic?.name || 'Ninguno');
      }
    } catch (e) {
      console.error("Error en fetchData:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase?.channel('sync-live-v1.5.7')
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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-field-green text-white py-8 shadow-2xl border-b-[6px] border-falcon-brown sticky top-0 z-50">
        <div className="container mx-auto px-6 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('home')}>
            <div className="bg-white p-2 rounded-lg shadow-inner group-hover:rotate-3 transition-transform">
              <Trophy className="w-8 h-8 text-field-green" />
            </div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-shadow-sm">Competiciones de Altanería</h1>
          </div>
          <nav className="flex bg-black/10 p-1.5 rounded-2xl backdrop-blur-md">
            <button onClick={() => setView('home')} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${view === 'home' ? 'bg-white text-field-green shadow-lg' : 'hover:bg-white/5'}`}>Inicio</button>
            <button onClick={() => setView('public')} className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all relative ${view === 'public' ? 'bg-white text-field-green shadow-lg' : 'hover:bg-white/5'}`}>
              <Users className="w-4 h-4" /> Público
              {activePublicChamp && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
                </span>
              )}
            </button>
            <button onClick={() => setView('judge')} className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${view === 'judge' ? 'bg-white text-field-green shadow-lg' : 'hover:bg-white/5'}`}>
              <Gavel className="w-4 h-4" /> Jurado
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {view === 'home' && (
          <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in duration-1000 py-10">
            {/* HERO SECTION */}
            <div className="relative group overflow-hidden rounded-[40px] shadow-2xl bg-white border-8 border-white">
              <div className="relative h-[650px] overflow-hidden">
                <img 
                  src="https://halcones.es/wp-content/uploads/2026/01/slide_gyr_halcones-1.png" 
                  alt="Halcón Gerifalte Oficial" 
                  className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-end p-12">
                  <div className="flex flex-col gap-2 mb-6">
                    {activePublicChamp ? (
                      <div className="flex items-center gap-3 self-start">
                        <span className="text-white bg-red-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-xl flex items-center gap-2">
                          <Radio className="w-3 h-3 animate-pulse" /> Competición en Directo: {activePublicChamp.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-field-green bg-white/95 backdrop-blur-sm self-start px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-xl">
                        Élite de la Cetrería Profesional
                      </span>
                    )}
                  </div>
                  <h2 className="text-white text-4xl md:text-7xl font-black mb-4 tracking-tighter uppercase drop-shadow-2xl max-w-2xl leading-none">
                    Excelencia en Altanería
                  </h2>
                  <p className="text-white/80 text-lg md:text-xl font-light max-w-2xl italic border-l-4 border-field-green pl-6 bg-black/40 p-6 rounded-r-3xl backdrop-blur-xl mb-8 leading-relaxed">
                    "Rigurosidad técnica y pasión por el vuelo. El estándar profesional para el registro oficial de competiciones cetreras."
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <button onClick={() => setView('public')} className="bg-field-green text-white px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 hover:bg-green-700 transition-all shadow-2xl shadow-green-900/40 active:scale-95 group">
                      Ver Clasificación <Users className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => setView('judge')} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 hover:bg-white/20 transition-all active:scale-95">
                      Acceso Jurado <ShieldCheck className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* FEATURES CARDS */}
            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-white p-12 rounded-[48px] shadow-professional border border-gray-100 hover:border-field-green transition-all duration-500 cursor-pointer group relative overflow-hidden" onClick={() => setView('public')}>
                <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Trophy className="w-64 h-64 text-field-green" />
                </div>
                {activePublicChamp && (
                  <div className="absolute top-8 right-8">
                    <span className="flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 shadow-lg shadow-red-200"></span>
                    </span>
                  </div>
                )}
                <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-field-green group-hover:text-white transition-all">
                  <Users className="w-10 h-10 text-field-green group-hover:text-white" />
                </div>
                <h3 className="text-3xl font-black mb-4 text-gray-800 uppercase tracking-tighter">Resultados Públicos</h3>
                <p className="text-gray-500 text-lg leading-relaxed mb-6">Acceso a la clasificación oficial en tiempo real, desgloses técnicos y actas de vuelo detalladas para el seguimiento del campeonato.</p>
                <div className="flex items-center gap-2 text-field-green font-black uppercase text-[10px] tracking-widest group-hover:gap-4 transition-all">
                  Entrar ahora <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white p-12 rounded-[48px] shadow-professional border border-gray-100 hover:border-falcon-brown transition-all duration-500 cursor-pointer group relative overflow-hidden" onClick={() => setView('judge')}>
                <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Gavel className="w-64 h-64 text-falcon-brown" />
                </div>
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-falcon-brown group-hover:text-white transition-all">
                  <ShieldCheck className="w-10 h-10 text-falcon-brown group-hover:text-white" />
                </div>
                <h3 className="text-3xl font-black mb-4 text-gray-800 uppercase tracking-tighter">Área de Jueces</h3>
                <p className="text-gray-500 text-lg leading-relaxed mb-6">Portal restringido para el cuerpo arbitral. Gestión de puntuaciones técnicas, penalizaciones por estética y descalificaciones directas.</p>
                <div className="flex items-center gap-2 text-falcon-brown font-black uppercase text-[10px] tracking-widest group-hover:gap-4 transition-all">
                  Acceso restringido <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'judge' && !isAuth && (
          <div className="max-w-md mx-auto mt-20 bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-falcon-brown/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Gavel className="w-10 h-10 text-falcon-brown" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-800">Acceso Arbitral</h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Introduzca la clave profesional</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-6 py-5 rounded-2xl border-2 border-gray-100 focus:border-field-green outline-none text-center text-2xl tracking-widest font-black transition-all" 
                placeholder="••••" 
                autoFocus
              />
              <button type="submit" className="w-full bg-field-green text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:bg-green-800 transition-all active:scale-95">
                Verificar Credenciales
              </button>
            </form>
          </div>
        )}

        {view === 'judge' && isAuth && <JudgePanel state={state} onUpdateState={updateState} />}
        {view === 'public' && <PublicView state={state} />}
      </main>

      <footer className="bg-[#111] text-white/30 py-12 border-t border-white/5">
        <div className="container mx-auto px-6 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">
            COMPETICIONES DE ALTANERÍA PARA PROFESIONALES v{APP_VERSION}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest">
            © 2026 Todos los derechos reservados — Creado por{' '}
            <a 
              href="https://soolut.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-field-green hover:text-white transition-colors"
            >
              Soolut
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;