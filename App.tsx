
import React, { useState, useEffect } from 'react';
import { Championship, AppState } from './types.ts';
import JudgePanel from './components/JudgePanel.tsx';
import PublicView from './components/PublicView.tsx';
import { supabase } from './supabase.ts';
import { Trophy, Gavel, Users, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-field-green animate-spin mx-auto" />
          <p className="font-bold text-falcon-brown">Cargando sistema de Altanería...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!supabase && (
        <div className="bg-amber-100 text-amber-800 px-4 py-2 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Modo Local Activado.</span>
        </div>
      )}
      <header className="bg-field-green text-white py-6 shadow-xl border-b-4 border-falcon-brown sticky top-0 z-50">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-center md:text-left">
              COMPETICIONES DE ALTANERÍA PARA PROFESIONALES
            </h1>
          </div>
          <nav className="flex gap-2">
            <button onClick={() => setView('home')} className={`px-4 py-2 rounded-full transition ${view === 'home' ? 'bg-falcon-brown' : 'hover:bg-green-700'}`}>Inicio</button>
            <button onClick={() => setView('public')} className={`px-4 py-2 rounded-full flex items-center gap-2 transition ${view === 'public' ? 'bg-falcon-brown' : 'hover:bg-green-700'}`}>
              <Users className="w-4 h-4" /> Público
            </button>
            <button onClick={() => setView('judge')} className={`px-4 py-2 rounded-full flex items-center gap-2 transition ${view === 'judge' ? 'bg-falcon-brown' : 'hover:bg-green-700'}`}>
              <Gavel className="w-4 h-4" /> Juez
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {view === 'home' && (
          <div className="max-w-2xl mx-auto text-center mt-12">
            <div className="mb-8 relative">
              <img src="https://images.unsplash.com/photo-1611689225620-3e70248bc0f0?q=80&w=2000" alt="Altanería" className="rounded-2xl shadow-2xl mx-auto border-4 border-falcon-brown object-cover h-72 w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl flex items-end p-6">
                <p className="text-white text-xl font-bold italic">"La excelencia en el cielo, la precisión en la tierra."</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-falcon-brown mb-4">Panel de Control</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-field-green cursor-pointer hover:shadow-2xl transition group" onClick={() => setView('public')}>
                <Users className="w-12 h-12 text-field-green mx-auto mb-4 group-hover:scale-110" />
                <h3 className="text-xl font-bold mb-2">Vista Pública</h3>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-falcon-brown cursor-pointer hover:shadow-2xl transition group" onClick={() => setView('judge')}>
                <ShieldCheck className="w-12 h-12 text-falcon-brown mx-auto mb-4 group-hover:scale-110" />
                <h3 className="text-xl font-bold mb-2">Panel del Juez</h3>
              </div>
            </div>
          </div>
        )}

        {view === 'judge' && !isAuth && (
          <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-center text-falcon-brown">Acceso Juez</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-field-green outline-none" placeholder="Introduce 'Lolo'" />
              <button type="submit" className="w-full bg-field-green text-white py-3 rounded-lg font-bold hover:bg-green-700">Acceder</button>
            </form>
          </div>
        )}

        {view === 'judge' && isAuth && <JudgePanel state={state} onUpdateState={updateState} />}
        {view === 'public' && <PublicView state={state} />}
      </main>

      <footer className="bg-falcon-brown text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold opacity-90 tracking-wider uppercase">COMPETICIONES DE ALTANERÍA PARA PROFESIONALES</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
