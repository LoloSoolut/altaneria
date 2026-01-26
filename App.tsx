
import React, { useState, useEffect } from 'react';
import { Championship, AppState } from './types.ts';
import JudgePanel from './components/JudgePanel.tsx';
import PublicView from './components/PublicView.tsx';
import { supabase } from './supabase.ts';
import { Trophy, Gavel, Users, ShieldCheck, Loader2, AlertCircle, Bird } from 'lucide-react';

// v1.3.2 - Descalificaciones específicas y portada profesional
const APP_VERSION = "1.3.2"; 

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

  useEffect(() => {
    // Limpieza de caché obligatoria para sincronizar nuevos motivos de descalificación
    const savedVersion = localStorage.getItem('altaneria_app_version');
    if (savedVersion !== APP_VERSION) {
      console.warn(`SISTEMA ACTUALIZADO A v${APP_VERSION}. Sincronizando reglamento técnico...`);
      localStorage.clear();
      localStorage.setItem('altaneria_app_version', APP_VERSION);
    }

    const fetchData = async () => {
      setLoading(true);
      
      if (!supabase) {
        const saved = localStorage.getItem('altaneria_championships');
        const championships = saved ? JSON.parse(saved) : [];
        const publicChamp = championships.find((c: any) => c.isPublic);
        
        setState({
          championships,
          selectedChampionshipId: championships[0]?.id || null,
          publicChampionshipId: publicChamp?.id || null
        });
        setLoading(false);
        return;
      }

      try {
        const { data: championships, error } = await supabase
          .from('championships')
          .select('*')
          .order('createdAt', { ascending: false });

        if (!error && championships) {
          const publicChamp = championships.find(c => c.isPublic);
          setState({
            championships,
            selectedChampionshipId: championships[0]?.id || null,
            publicChampionshipId: publicChamp?.id || null
          });
        }
      } catch (e) {
        console.error("Error fetching from Supabase:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (supabase) {
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'championships' },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Lolo') {
      setIsAuth(true);
      setView('judge');
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const updateState = (newState: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcf9]">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <Bird className="w-16 h-16 text-field-green animate-pulse" />
            <Loader2 className="w-20 h-20 text-falcon-brown animate-spin absolute -top-2 -left-2 opacity-20" />
          </div>
          <p className="font-serif text-xl text-falcon-brown tracking-widest uppercase italic">Iniciando v{APP_VERSION} Profesional...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!supabase && (
        <div className="bg-red-900 text-white px-4 py-1.5 text-[10px] flex items-center justify-center gap-2 uppercase font-black tracking-widest">
          <AlertCircle className="w-3 h-3" />
          <span>SISTEMA EN MODO LOCAL (Los datos no se sincronizarán con otros dispositivos)</span>
        </div>
      )}
      <header className="bg-field-green text-white py-8 shadow-2xl border-b-[6px] border-falcon-brown sticky top-0 z-50">
        <div className="container mx-auto px-6 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-white p-2 rounded-lg shadow-inner transition-all group-hover:rotate-3">
              <Trophy className="w-10 h-10 text-field-green" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-none uppercase">
                COMPETICIONES DE ALTANERÍA
              </h1>
              <p className="text-[10px] uppercase tracking-[0.3em] font-light mt-1 opacity-70">Para Profesionales de la Cetrería</p>
            </div>
          </div>
          <nav className="flex bg-black/10 p-1.5 rounded-2xl backdrop-blur-md">
            <button onClick={() => setView('home')} className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${view === 'home' ? 'bg-white text-field-green shadow-lg' : 'hover:bg-white/10'}`}>Inicio</button>
            <button onClick={() => setView('public')} className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 ${view === 'public' ? 'bg-white text-field-green shadow-lg' : 'hover:bg-white/10'}`}>
              <Users className="w-4 h-4" /> Público
            </button>
            <button onClick={() => setView('judge')} className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 ${view === 'judge' ? 'bg-white text-field-green shadow-lg' : 'hover:bg-white/10'}`}>
              <Gavel className="w-4 h-4" /> Jurado
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12">
        {view === 'home' && (
          <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in duration-1000">
            <div className="relative group overflow-hidden rounded-[40px] shadow-2xl bg-white border-8 border-white">
              <div className="relative h-[650px] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=2000" 
                  alt="Halcón Gerifalte Profesional" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-12">
                  <h2 className="text-white text-4xl md:text-7xl font-black mb-4 tracking-tighter uppercase drop-shadow-2xl">La Altanería Profesional</h2>
                  <p className="text-white/90 text-xl font-light max-w-2xl italic border-l-4 border-field-green pl-6 bg-black/50 p-6 rounded-r-3xl backdrop-blur-xl">
                    "Gestión técnica avanzada donde el rigor del jurado garantiza la justicia deportiva para cada halconero."
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-white p-12 rounded-[40px] shadow-professional border border-gray-100 hover:border-field-green transition-all duration-500 cursor-pointer group" onClick={() => setView('public')}>
                <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Users className="w-10 h-10 text-field-green" />
                </div>
                <h3 className="text-3xl font-black mb-4 text-gray-800 uppercase tracking-tighter">Resultados Públicos</h3>
                <p className="text-gray-500 text-lg leading-relaxed">Acceso a la clasificación oficial en tiempo real, desgloses técnicos y actas de vuelo para el seguimiento de la competición.</p>
              </div>
              <div className="bg-white p-12 rounded-[40px] shadow-professional border border-gray-100 hover:border-falcon-brown transition-all duration-500 cursor-pointer group" onClick={() => setView('judge')}>
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-10 h-10 text-falcon-brown" />
                </div>
                <h3 className="text-3xl font-black mb-4 text-gray-800 uppercase tracking-tighter">Área de Jueces</h3>
                <p className="text-gray-500 text-lg leading-relaxed">Portal restringido para el cuerpo arbitral. Gestión de puntuaciones, penalizaciones y descalificaciones directas reglamentarias.</p>
              </div>
            </div>
          </div>
        )}

        {view === 'judge' && !isAuth && (
          <div className="max-w-md mx-auto mt-12 bg-white p-10 rounded-[32px] shadow-professional border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-falcon-brown/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gavel className="w-8 h-8 text-falcon-brown" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Acceso Autorizado</h2>
              <p className="text-gray-400 text-sm mt-1">Introduzca la clave profesional de Juez.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Clave de Seguridad</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-field-green/10 focus:border-field-green outline-none transition-all text-center text-lg tracking-widest" 
                  placeholder="••••" 
                />
              </div>
              <button type="submit" className="w-full bg-field-green text-white py-5 rounded-xl font-black uppercase tracking-widest hover:bg-green-800 transition-all shadow-lg hover:shadow-field-green/20 active:scale-95">
                Verificar Credenciales
              </button>
            </form>
          </div>
        )}

        {view === 'judge' && isAuth && <JudgePanel state={state} onUpdateState={updateState} />}
        {view === 'public' && <PublicView state={state} />}
      </main>

      <footer className="bg-[#1a1a1a] text-white py-12 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/10 pb-12 mb-12">
            <div className="flex items-center gap-3">
              <Bird className="w-10 h-10 text-field-green" />
              <span className="text-2xl font-black tracking-tighter">ALTANERÍA PRO</span>
            </div>
            <p className="text-sm text-gray-500 font-light text-center md:text-right max-w-sm">
              v{APP_VERSION} - Plataforma técnica oficial para la gestión de alta competición de cetrería.
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black opacity-30 tracking-[0.5em] uppercase italic">COMPETICIONES DE ALTANERÍA PARA PROFESIONALES © 2024</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
