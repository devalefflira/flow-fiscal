import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend 
} from 'recharts';
import { format, intervalToDuration, formatDuration, isToday, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, Calendar, Clock, CheckCircle, 
  AlertCircle, Play, List, Filter, Activity, X, Building
} from 'lucide-react';

// --- CORES DOS GRÁFICOS ---
const COLORS = ['#06b6d4', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#3b82f6'];

export default function TasksDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('geral'); // geral | categoria | cliente
  
  // Filtro de Competência
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
  const [selectedCompetence, setSelectedCompetence] = useState(getCurrentMonth());

  // Dados
  const [tasks, setTasks] = useState([]);
  const [taskCategories, setTaskCategories] = useState([]); // Para mapear Título -> Categoria
  const [executingModalOpen, setExecutingModalOpen] = useState(false);

  // --- BUSCA DE DADOS ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedCompetence.split('-');
      const startDate = startOfMonth(new Date(year, month - 1)).toISOString();
      const endDate = endOfMonth(new Date(year, month - 1)).toISOString();

      // 1. Busca todas as tarefas da competência
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select(`
          *,
          clients (id, razao_social),
          categories (id, name, color)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      // 2. Busca tarefas em execução independente da data
      const { data: doingData } = await supabase
        .from('tasks')
        .select(`*, clients(razao_social)`)
        .eq('status', 'doing');

      // Mescla os dados
      const allTasks = [...(tasksData || [])];
      doingData?.forEach(t => {
        if (!allTasks.find(at => at.id === t.id)) {
          allTasks.push(t);
        }
      });

      setTasks(allTasks);

      // 3. Busca padronização
      const { data: catsData } = await supabase.from('task_categories').select('*');
      setTaskCategories(catsData || []);

    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompetence]);

  // --- HELPER: CÁLCULO DE TEMPO LÍQUIDO ---
  const calculateNetTime = (task) => {
    if (!task.started_at) return 0;
    const end = task.completed_at ? new Date(task.completed_at).getTime() : new Date().getTime();
    const start = new Date(task.started_at).getTime();
    const totalPause = task.total_pause || 0;
    return Math.max(0, (end - start) - totalPause);
  };

  const formatMs = (ms) => {
    if (ms === 0) return '0min';
    const duration = intervalToDuration({ start: 0, end: ms });
    return formatDuration(duration, { locale: ptBR, format: ['hours', 'minutes'] }) || '0min';
  };

  // --- PROCESSAMENTO DE DADOS (MEMOIZED) ---
  const metrics = useMemo(() => {
    // Filtra tarefas que pertencem à competência selecionada
    const compDate = parseISO(selectedCompetence + '-01');
    const filteredByComp = tasks.filter(t => {
      const tDate = new Date(t.created_at);
      return tDate.getMonth() === compDate.getMonth() && tDate.getFullYear() === compDate.getFullYear();
    });

    const totalFiltered = filteredByComp.length;

    // 1. Métricas Gerais
    const total = totalFiltered;
    const done = filteredByComp.filter(t => t.status === 'done').length;
    const pending = filteredByComp.filter(t => t.status !== 'done').length;
    
    const totalTimeMs = filteredByComp.reduce((acc, t) => acc + calculateNetTime(t), 0);

    const doneToday = filteredByComp.filter(t => t.status === 'done' && isToday(new Date(t.completed_at))).length;
    const timeTodayMs = filteredByComp
      .filter(t => (t.status === 'done' && isToday(new Date(t.completed_at))) || (t.status === 'doing'))
      .reduce((acc, t) => acc + calculateNetTime(t), 0);

    const executingList = tasks.filter(t => t.status === 'doing' && !t.is_paused);
    
    // Gráfico Pizza Origem (Com formatação % e qtd)
    const originMap = {};
    filteredByComp.forEach(t => {
        const name = t.categories?.name || 'Sem Origem';
        originMap[name] = (originMap[name] || 0) + 1;
    });
    const originChartData = Object.keys(originMap).map(k => {
        const val = originMap[k];
        const pct = totalFiltered > 0 ? ((val / totalFiltered) * 100).toFixed(0) : 0;
        return { 
            name: `${k}: ${pct}% (${val})`, // Formatação solicitada
            value: val 
        };
    });

    // 2. Por Categoria (Task Categories)
    const categoryMap = {}; 
    const titleMap = {}; 
    
    filteredByComp.forEach(t => {
        const std = taskCategories.find(c => c.subcategoria_task === t.title);
        const catName = std ? std.categoria_task : 'Não Padronizado';
        
        categoryMap[catName] = (categoryMap[catName] || 0) + 1;

        if (t.status === 'done') {
            const titleName = t.title;
            titleMap[titleName] = (titleMap[titleName] || 0) + 1;
        }
    });

    // Gráfico Categoria (Com formatação % e qtd)
    const categoryChartData = Object.keys(categoryMap).map(k => {
        const val = categoryMap[k];
        const pct = totalFiltered > 0 ? ((val / totalFiltered) * 100).toFixed(0) : 0;
        return { 
            name: `${k}: ${pct}% (${val})`, // Formatação solicitada
            value: val 
        };
    });

    const titleTableData = Object.keys(titleMap).map(k => ({ title: k, count: titleMap[k] })).sort((a,b) => b.count - a.count);

    // 3. Por Cliente
    const clientData = {};
    filteredByComp.forEach(t => {
        if (!t.clients) return;
        const cName = t.clients.razao_social;
        if (!clientData[cName]) {
            clientData[cName] = { 
                name: cName, 
                total: 0, 
                byCat: {}, 
                byTitle: {}, 
                byOrigin: {} 
            };
        }
        
        clientData[cName].total++;
        
        const org = t.categories?.name || 'Geral';
        clientData[cName].byOrigin[org] = (clientData[cName].byOrigin[org] || 0) + 1;

        const std = taskCategories.find(c => c.subcategoria_task === t.title);
        const catName = std ? std.categoria_task : 'Outros';
        clientData[cName].byCat[catName] = (clientData[cName].byCat[catName] || 0) + 1;
        clientData[cName].byTitle[t.title] = (clientData[cName].byTitle[t.title] || 0) + 1;
    });

    const clientList = Object.values(clientData).sort((a,b) => b.total - a.total);

    return {
        total, done, pending, 
        totalTimeFormatted: formatMs(totalTimeMs),
        doneToday, 
        timeTodayFormatted: formatMs(timeTodayMs),
        executingList,
        originChartData,
        categoryChartData,
        titleTableData,
        clientList
    };

  }, [tasks, selectedCompetence, taskCategories]);


  // --- COMPONENTES VISUAIS ---
  const StatCard = ({ label, value, subtext, icon: Icon, color = "text-white", onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-surface p-6 rounded-2xl border border-white/5 shadow-lg flex items-center justify-between ${onClick ? 'cursor-pointer hover:border-brand-cyan/50 transition-colors' : ''}`}
    >
        <div>
            <p className="text-gray-400 text-xs font-bold uppercase mb-1">{label}</p>
            <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
            {subtext && <p className="text-gray-500 text-xs mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-white/5 ${color.replace('text-', 'text-opacity-80 ')}`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
  );

  const CustomPieChart = ({ data }) => (
    <div className="h-[300px] w-full flex justify-center items-center">
        {data.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={data}
                 cx="50%"
                 cy="50%"
                 innerRadius={60}
                 outerRadius={80}
                 paddingAngle={5}
                 dataKey="value"
               >
                 {data.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                 ))}
               </Pie>
               <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
               />
               <Legend verticalAlign="bottom" height={36} iconType="circle" />
             </PieChart>
           </ResponsiveContainer>
        ) : (
            <div className="text-gray-500 text-sm italic">Sem dados para exibir</div>
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard de Tarefas</h1>
              <p className="text-gray-500 text-sm">Métricas de produtividade e foco</p>
            </div>
        </div>

        {/* FILTRO COMPETÊNCIA */}
        <div className="bg-surface flex items-center rounded-xl p-2 pr-4 border border-white/5 shadow-sm">
            <div className="bg-white/5 p-2 rounded-lg mr-3">
                <Calendar className="w-5 h-5 text-brand-cyan" />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-gray-500">Competência</span>
                <input 
                    type="month" 
                    value={selectedCompetence}
                    onChange={(e) => setSelectedCompetence(e.target.value)}
                    className="bg-transparent text-white font-bold outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                />
            </div>
        </div>
      </div>

      {/* TABS DE NAVEGAÇÃO */}
      <div className="flex gap-2 mb-8 bg-surface/50 p-1 rounded-xl w-fit border border-white/5">
         {['geral', 'categoria', 'cliente'].map(tab => (
             <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all
                    ${activeTab === tab ? 'bg-brand-cyan text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}
                `}
             >
                 {tab === 'geral' ? 'Visão Geral' : tab === 'categoria' ? 'Por Categoria' : 'Por Cliente'}
             </button>
         ))}
      </div>

      {/* LOADING */}
      {loading ? (
          <div className="flex justify-center items-center h-64 text-gray-500 animate-pulse">Carregando métricas...</div>
      ) : (
          <div className="animate-fade-in space-y-8">
              
              {/* === ABA 1: VISÃO GERAL === */}
              {activeTab === 'geral' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={List} label="Total de Tarefas" value={metrics.total} color="text-white" />
                        <StatCard icon={CheckCircle} label="Concluídas" value={metrics.done} color="text-emerald-500" />
                        <StatCard icon={AlertCircle} label="Pendentes" value={metrics.pending} color="text-yellow-500" />
                        <StatCard icon={Clock} label="Tempo Total Gasto" value={metrics.totalTimeFormatted} color="text-purple-400" />
                        
                        <StatCard icon={CheckCircle} label="Concluídas Hoje" value={metrics.doneToday} color="text-emerald-400" />
                        <StatCard icon={Clock} label="Tempo Gasto Hoje" value={metrics.timeTodayFormatted} color="text-purple-300" />
                        
                        {/* Card Especial: Em Execução */}
                        <div className="md:col-span-2 bg-surface rounded-2xl border border-brand-cyan/20 p-6 flex justify-between items-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-brand-cyan/5 animate-pulse z-0"></div>
                            <div className="z-10">
                                <p className="text-brand-cyan text-xs font-bold uppercase mb-1 flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Em Tempo Real
                                </p>
                                <h3 className="text-2xl font-bold text-white mb-1">{metrics.executingList.length} Tarefas</h3>
                                <p className="text-gray-400 text-xs">Sendo executadas neste momento</p>
                            </div>
                            <button 
                                onClick={() => setExecutingModalOpen(true)}
                                className="z-10 bg-brand-cyan hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-transform active:scale-95"
                            >
                                Detalhar
                            </button>
                        </div>
                    </div>

                    {/* Gráfico Origem */}
                    <div className="bg-surface rounded-2xl p-6 border border-white/5 w-full md:w-1/2">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <Filter className="w-5 h-5 text-brand-cyan" /> Distribuição por Origem
                        </h3>
                        <CustomPieChart data={metrics.originChartData} />
                    </div>
                  </>
              )}

              {/* === ABA 2: POR CATEGORIA === */}
              {activeTab === 'categoria' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Gráfico */}
                      <div className="bg-surface rounded-2xl p-6 border border-white/5">
                          <h3 className="text-white font-bold mb-6">Tarefas por Categoria (Padronização)</h3>
                          <CustomPieChart data={metrics.categoryChartData} />
                      </div>

                      {/* Tabela */}
                      <div className="bg-surface rounded-2xl p-6 border border-white/5 flex flex-col h-[400px]">
                          <h3 className="text-white font-bold mb-4">Top Títulos Concluídos</h3>
                          <div className="overflow-y-auto custom-scrollbar flex-1">
                              <table className="w-full text-left">
                                  <thead className="sticky top-0 bg-surface">
                                      <tr className="text-xs text-gray-500 uppercase border-b border-white/10">
                                          <th className="pb-2">Título Padrão</th>
                                          <th className="pb-2 text-right">Qtd.</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                      {metrics.titleTableData.map((item, idx) => (
                                          <tr key={idx} className="text-sm hover:bg-white/5">
                                              <td className="py-3 text-gray-300">{item.title}</td>
                                              <td className="py-3 text-right text-brand-cyan font-bold">{item.count}</td>
                                          </tr>
                                      ))}
                                      {metrics.titleTableData.length === 0 && (
                                          <tr><td colSpan="2" className="py-8 text-center text-gray-500">Nenhuma tarefa concluída nesta competência.</td></tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              )}

              {/* === ABA 3: POR CLIENTE === */}
              {activeTab === 'cliente' && (
                  <div className="space-y-4">
                      {metrics.clientList.map((client, idx) => (
                          <div key={idx} className="bg-surface rounded-2xl border border-white/5 overflow-hidden">
                              {/* Cabeçalho do Cliente */}
                              <div className="p-4 bg-white/5 flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-brand-cyan/10 rounded-lg text-brand-cyan">
                                          <Building className="w-5 h-5" />
                                      </div>
                                      <div>
                                          <h3 className="text-white font-bold">{client.name}</h3>
                                          <p className="text-xs text-gray-500">Total de Tarefas: <strong className="text-gray-300">{client.total}</strong></p>
                                      </div>
                                  </div>
                              </div>

                              {/* Detalhes (Grid de 3 colunas) */}
                              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                  
                                  {/* Coluna 1: Por Categoria */}
                                  <div>
                                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 border-b border-white/10 pb-1">Por Categoria</h4>
                                      <ul className="space-y-1">
                                          {Object.entries(client.byCat).map(([cat, qtd]) => (
                                              <li key={cat} className="flex justify-between text-gray-400">
                                                  <span>{cat}</span> <span className="text-white font-medium">{qtd}</span>
                                              </li>
                                          ))}
                                      </ul>
                                  </div>

                                  {/* Coluna 2: Por Origem */}
                                  <div>
                                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 border-b border-white/10 pb-1">Por Origem</h4>
                                      <ul className="space-y-1">
                                          {Object.entries(client.byOrigin).map(([org, qtd]) => (
                                              <li key={org} className="flex justify-between text-gray-400">
                                                  <span>{org}</span> <span className="text-white font-medium">{qtd}</span>
                                              </li>
                                          ))}
                                      </ul>
                                  </div>

                                  {/* Coluna 3: Top Títulos */}
                                  <div>
                                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 border-b border-white/10 pb-1">Principais Títulos</h4>
                                      <ul className="space-y-1">
                                          {Object.entries(client.byTitle).slice(0, 5).map(([tit, qtd]) => (
                                              <li key={tit} className="flex justify-between text-gray-400">
                                                  <span className="truncate max-w-[150px]" title={tit}>{tit}</span> 
                                                  <span className="text-white font-medium">{qtd}</span>
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              </div>
                          </div>
                      ))}
                      {metrics.clientList.length === 0 && (
                          <div className="text-center py-12 text-gray-500">Nenhum dado encontrado para esta competência.</div>
                      )}
                  </div>
              )}

          </div>
      )}

      {/* MODAL: EM EXECUÇÃO */}
      {executingModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-surface rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-surface">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Activity className="w-5 h-5 text-brand-cyan" /> Em Execução Agora
                      </h2>
                      <button onClick={() => setExecutingModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
                  </div>
                  <div className="p-4 overflow-y-auto custom-scrollbar space-y-3">
                      {metrics.executingList.map(t => (
                          <div key={t.id} className="bg-black/20 p-3 rounded-lg border border-brand-cyan/20 flex flex-col gap-1 relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-cyan"></div>
                              <h3 className="text-white font-bold text-sm ml-2">{t.title}</h3>
                              {t.clients && <p className="text-xs text-gray-400 ml-2">{t.clients.razao_social}</p>}
                              <p className="text-xs text-brand-cyan ml-2 mt-1 font-mono">
                                  Iniciado às: {format(new Date(t.started_at), 'HH:mm')}
                              </p>
                          </div>
                      ))}
                      {metrics.executingList.length === 0 && (
                          <p className="text-center text-gray-500 py-4">Nenhuma tarefa sendo executada no momento.</p>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}