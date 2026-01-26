import React, { useState, useEffect } from 'react';
import { Championship, AppState } from './types.ts';
import JudgePanel from './components/JudgePanel.tsx';
import PublicView from './components/PublicView.tsx';
import { supabase } from './supabase.ts';
import { Trophy, Gavel, Users, ShieldCheck, Loader2, AlertCircle, Bird } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcf9]">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <Bird className="w-16 h-16 text-field-green animate-pulse" />
            <Loader2 className="w-20 h-20 text-falcon-brown animate-spin absolute -top-2 -left-2 opacity-20" />
          </div>
          <p className="font-serif text-xl text-falcon-brown tracking-widest uppercase">Iniciando Sistema Profesional...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!supabase && (
        <div className="bg-falcon-brown text-white/80 px-4 py-1.5 text-[10px] flex items-center justify-center gap-2 uppercase tracking-tighter">
          <AlertCircle className="w-3 h-3" />
          <span>Ejecutando en modo de respaldo local (Desconectado de Supabase)</span>
        </div>
      )}
      <header className="bg-field-green text-white py-8 shadow-2xl border-b-[6px] border-falcon-brown sticky top-0 z-50">
        <div className="container mx-auto px-6 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-white p-2 rounded-lg shadow-inner">
              <Trophy className="w-10 h-10 text-field-green" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-none">
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
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="relative group overflow-hidden rounded-[32px] shadow-professional">
              <img src="https://images.unsplash.com/photo-1611689225620-3e70248bc0f0?q=80&w=2000" alt="Altanería" className="w-full h-[450px] object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-field-green/90 via-field-green/40 to-transparent flex flex-col justify-end p-12">
                <h2 className="text-white text-4xl md:text-5xl font-bold mb-4">La Excelencia en el Vuelo</h2>
                <p className="text-white/90 text-lg font-light max-w-xl italic">"Donde la precisión del juez se encuentra con la majestuosidad del halcón en el cielo profesional."</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-3xl shadow-professional border border-gray-100 hover:border-field-green transition-all duration-500 cursor-pointer group" onClick={() => setView('public')}>
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-field-green" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">Galería de Resultados</h3>
                <p className="text-gray-500 leading-relaxed">Acceso a clasificaciones en tiempo real, detalles de picados y alturas para el público general.</p>
              </div>
              <div className="bg-white p-10 rounded-3xl shadow-professional border border-gray-100 hover:border-falcon-brown transition-all duration-500 cursor-pointer group" onClick={() => setView('judge')}>
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-8 h-8 text-falcon-brown" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">Acceso Arbitral</h3>
                <p className="text-gray-500 leading-relaxed">Sistema restringido para el cuerpo de jueces. Gestión de inscripciones y evaluación técnica oficial.</p>
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
              <h2 className="text-2xl font-bold text-gray-800">Identificación de Juez</h2>
              <p className="text-gray-400 text-sm mt-1">Por favor, introduzca su credencial de acceso.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Contraseña de Seguridad</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-field-green/10 focus:border-field-green outline-none transition-all text-center text-lg tracking-widest" 
                  placeholder="••••" 
                />
              </div>
              <button type="submit" className="w-full bg-field-green text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-green-800 transition-all shadow-lg hover:shadow-field-green/20">
                Verificar Acceso
              </button>
            </form>
          </div>
        )}

        {view === 'judge' && isAuth && <JudgePanel state={state} onUpdateState={updateState} />}
        {view === 'public' && <PublicView state={state} />}
      </main>

      <footer className="bg-[#1a1a1a] text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/10 pb-12 mb-12">
            <div className="flex items-center gap-3">
              <Bird className="w-8 h-8 text-field-green" />
              <span className="text-xl font-bold tracking-tighter">ALTANERÍA PRO</span>
            </div>
            <p className="text-sm text-gray-400 font-light text-center md:text-right max-w-sm">
              Plataforma oficial para la gestión técnica de campeonatos de altanería. Regulado según normativas internacionales.
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black opacity-40 tracking-[0.5em] uppercase">COMPETICIONES DE ALTANERÍA PARA PROFESIONALES © 2024</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;