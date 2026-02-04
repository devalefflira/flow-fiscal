import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  LayoutDashboard, CheckSquare, Infinity as InfinityIcon, 
  FileText, Users, Settings, LogOut, ChevronRight, 
  Bell, Search, Menu, X, ArrowUpRight, Activity, Calendar,
  Layers, CreditCard, FileCheck // Novos ícones para os cadastros
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState({ name: 'Usuário', email: '' });
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- EFEITO DE SAUDAÇÃO E DATA ---
  useEffect(() => {
    // Pega usuário do Supabase
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ 
            email: user.email,
            // Tenta pegar nome do metadata ou usa parte do email
            name: user.user_metadata?.full_name || user.email.split('@')[0] 
        });
      }
    };
    getUser();

    // Timer do relógio
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // --- ESTRUTURA DE NAVEGAÇÃO COMPLETA ---
  const menuItems = [
    { 
      category: 'Principal',
      items: [
        { label: 'Visão Geral', icon: LayoutDashboard, path: '/home', active: true },
        { label: 'Dashboard Tarefas', icon: Activity, path: '/dashboard/tarefas' },
        { label: 'Dashboard Fiscal', icon: Activity, path: '/dashboard/fiscal' },
      ]
    },
    {
      category: 'Operacional',
      items: [
        { label: 'Minhas Tarefas', icon: CheckSquare, path: '/tarefas/matriz' },
        { label: 'Fechamento Fiscal', icon: InfinityIcon, path: '/processos/fechamento' },
        { label: 'Obrigações', icon: FileCheck, path: '/processos/obrigacoes' },
        { label: 'Parcelamentos', icon: CreditCard, path: '/processos/parcelamentos' },
        { label: 'Relatórios', icon: FileText, path: '/processos/relatorios' },
      ]
    },
    {
      category: 'Cadastros',
      items: [
        { label: 'Clientes', icon: Users, path: '/cadastros/clientes' },
        { label: 'Equipe', icon: Users, path: '/cadastros/usuarios' },
        { label: 'Origens', icon: Layers, path: '/cadastros/categorias' },
        { label: 'Guias de Tributos', icon: FileText, path: '/cadastros/guias' },
        { label: 'Tipos de Obrigações', icon: FileCheck, path: '/cadastros/obrigacoes' },
        { label: 'Categorias de Tarefas', icon: Settings, path: '/cadastros/categorias-tarefas' },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] text-white font-sans overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className={`
          ${sidebarOpen ? 'w-64' : 'w-20'} 
          bg-surface/50 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300 relative z-20
        `}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-center border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-cyan rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(8,145,178,0.5)]">
              <InfinityIcon className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && <span className="font-bold text-lg tracking-wide animate-fade-in">FlowFiscal</span>}
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-6 space-y-8 custom-scrollbar">
          {menuItems.map((section, idx) => (
            <div key={idx} className="px-4">
              {sidebarOpen && (
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 px-2 animate-fade-in">
                  {section.category}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={() => navigate(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                      ${location.pathname === item.path 
                        ? 'bg-brand-cyan text-white shadow-lg shadow-cyan-900/20' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                    `}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-white' : 'text-gray-400 group-hover:text-brand-cyan transition-colors'}`} />
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                    {sidebarOpen && location.pathname === item.path && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* User / Logout */}
        <div className="p-4 border-t border-white/5 bg-black/10">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-cyan to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 transition-colors p-1" 
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Background Decorativo */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-cyan/10 via-background to-background pointer-events-none z-0"></div>

        {/* Header Superior */}
        <header className="h-20 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="hidden md:flex flex-col">
              <h2 className="text-xl font-bold text-white">Olá, {user.name} 👋</h2>
              <p className="text-xs text-gray-400">
                {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar cliente ou tarefa..." 
                className="bg-surface border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:border-brand-cyan outline-none w-64 transition-all"
              />
            </div>
            <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-gray-300" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
          </div>
        </header>

        {/* Conteúdo Scrollável */}
        <div className="flex-1 overflow-y-auto p-8 z-10 custom-scrollbar">
          
          {/* Métricas Rápidas (Mockup) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Tarefas Pendentes', val: '12', sub: '3 urgentes', icon: CheckSquare, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
              { label: 'Fechamentos', val: '85%', sub: '15 empresas restantes', icon: InfinityIcon, color: 'text-brand-cyan', bg: 'bg-brand-cyan/10' },
              { label: 'Obrigações', val: '5', sub: 'Vencem hoje', icon: FileText, color: 'text-red-400', bg: 'bg-red-400/10' },
              { label: 'Novos Clientes', val: '2', sub: 'Neste mês', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            ].map((stat, i) => (
              <div key={i} className="bg-surface border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-all group cursor-default">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-black/20 px-2 py-1 rounded-full group-hover:bg-white/10 transition-colors">Hoje</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stat.val}</h3>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-xs text-gray-600 mt-2">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Cards de Acesso Rápido */}
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-brand-cyan" /> Acesso Rápido
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Tarefas */}
            <div 
              onClick={() => navigate('/tarefas/matriz')}
              className="bg-gradient-to-br from-surface to-surface/50 border border-white/10 p-6 rounded-2xl cursor-pointer hover:border-brand-cyan/50 hover:shadow-lg hover:shadow-cyan-900/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-cyan/10 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-black/30 rounded-xl flex items-center justify-center mb-4 border border-white/5">
                  <CheckSquare className="w-6 h-6 text-brand-cyan" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Matriz de Tarefas</h4>
                <p className="text-sm text-gray-400 mb-4">Gerencie suas prioridades diárias usando a metodologia Eisenhower.</p>
                <span className="text-xs font-bold text-brand-cyan flex items-center gap-1 group-hover:gap-2 transition-all">
                  Acessar agora <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Card 2: Fechamento */}
            <div 
              onClick={() => navigate('/processos/fechamento')}
              className="bg-gradient-to-br from-surface to-surface/50 border border-white/10 p-6 rounded-2xl cursor-pointer hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-black/30 rounded-xl flex items-center justify-center mb-4 border border-white/5">
                  <InfinityIcon className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Fechamento Fiscal</h4>
                <p className="text-sm text-gray-400 mb-4">Pipeline completo de apuração mensal de impostos dos clientes.</p>
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Iniciar processo <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Card 3: Relatórios */}
            <div 
              onClick={() => navigate('/processos/relatorios')}
              className="bg-gradient-to-br from-surface to-surface/50 border border-white/10 p-6 rounded-2xl cursor-pointer hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-900/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-black/30 rounded-xl flex items-center justify-center mb-4 border border-white/5">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Relatórios Gerenciais</h4>
                <p className="text-sm text-gray-400 mb-4">Exporte PDFs diários de produtividade e status de fechamento.</p>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Gerar relatório <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}