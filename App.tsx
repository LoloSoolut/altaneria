import React, { useState, useEffect } from 'react';
import { Championship, AppState } from './types.ts';
import JudgePanel from './components/JudgePanel.tsx';
import PublicView from './components/PublicView.tsx';
import { supabase } from './supabase.ts';
import { Trophy, Gavel, Users, ShieldCheck, Loader2, AlertCircle, Bird, Radio } from 'lucide-react';
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

  const fetchData = async () => {
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
        const publicChamp = championships.find(c => c.isPublic === true);
        
        setState(prev => ({
          championships,
          selectedChampionshipId: prev.selectedChampionshipId || (championships[0]?.id || null),
          publicChampionshipId: publicChamp?.id || null
        }));
        
        console.log("📡 Datos Sincronizados. Público ID:", publicChamp?.id || 'Ninguno');
      }
    } catch (e) {
      console.error("Error en fetchData:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Suscripción inteligente
    const channel = supabase?.channel('sync-v1.5.5')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'championships' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      if (channel) supabase?.removeChannel(channel);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Lolo') {
      setIsAuth(true);
      setView('judge');
    } else {
      alert('Clave incorrecta');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcf9]">
        <div className="text-center space-y-4">
          <Bird className="w-12 h-12 text-field-green animate-bounce mx-auto" />
          <p className="font-black text-xs uppercase tracking-widest text-gray-400">Sincronizando v{APP_VERSION}...</p>
        </div>
      </div>
    );
  }

  const activePublicChamp = state.championships.find(c => c.id === state.publicChampionshipId);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-field-green text-white py-8 shadow-2xl border-b-[6px] border-falcon-brown sticky top-0 z-50">
        <div className="container mx-auto px-6 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-white p-2 rounded-lg"><Trophy className="w-8 h-8 text-field-green" /></div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Competiciones de Altanería</h1>
          </div>
          <nav className="flex bg-black/10 p-1.5 rounded-2xl">
            <button onClick={() => setView('home')} className={`px-5 py-2.5 rounded-xl font-bold transition-all ${view === 'home' ? 'bg-white text-field-green shadow-lg' : 'hover:bg-white/5'}`}>Inicio</button>
            <button onClick={() => setView('public')} className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all relative ${view === 'public' ? 'bg-white text-field-green shadow-lg' : 'hover:bg-white/5'}`}>
              <Users className="w-4 h-4" /> Público
              {activePublicChamp && <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping border border-white"></span>}
            </button>
            <button onClick={() => setView('judge')} className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${view === 'judge' ? 'bg-white text-field-green shadow-lg' : 'hover:bg-white/5'}`}>
              <Gavel className="w-4 h-4" /> Jurado
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {view === 'home' && (
          <div className="max-w-4xl mx-auto space-y-12 text-center py-10">
            <div className="bg-white p-1 rounded-[40px] shadow-2xl overflow-hidden border-8 border-white group">
               <img src="https://halcones.es/wp-content/uploads/2026/01/slide_gyr_halcones-1.png" className="w-full h-[500px] object-cover rounded-[32px] group-hover:scale-105 transition-transform duration-1000" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-800 uppercase tracking-tighter">Pasión por la Altanería</h2>
            <div className="flex justify-center gap-4">
              <button onClick={() => setView('public')} className="bg-field-green text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-green-700 transition-all">Ver Resultados</button>
              <button onClick={() => setView('judge')} className="bg-falcon-brown text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:opacity-90 transition-all">Acceso Jurado</button>
            </div>
          </div>
        )}

        {view === 'judge' && !isAuth && (
          <div className="max-w-md mx-auto mt-20 bg-white p-10 rounded-[32px] shadow-2xl border border-gray-100">
            <h2 className="text-2xl font-black text-center mb-8 uppercase tracking-tighter">Acceso Autorizado</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 rounded-2xl border text-center text-xl" placeholder="Clave Juez" />
              <button type="submit" className="w-full bg-field-green text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg">Entrar</button>
            </form>
          </div>
        )}

        {view === 'judge' && isAuth && <JudgePanel state={state} onUpdateState={(ns) => setState(prev => ({...prev, ...ns}))} />}
        {view === 'public' && <PublicView state={state} />}
      </main>

      <footer className="py-10 text-center opacity-30 text-[9px] font-black uppercase tracking-widest">
        Sistema v{APP_VERSION} — © Soolut 2026
      </footer>
    </div>
  );
};

export default App;