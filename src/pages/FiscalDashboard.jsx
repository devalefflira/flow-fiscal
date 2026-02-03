import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  ChevronLeft, BarChart2, PieChart as PieIcon, Calendar, 
  FileCheck, AlertTriangle, CheckCircle, Clock, AlertCircle, UploadCloud
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function FiscalDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fechamento'); // fechamento | obrigacoes | parcelamentos
  const [loading, setLoading] = useState(true);
  
  // Filtro
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
  const [selectedCompetence, setSelectedCompetence] = useState(getCurrentMonth());

  // Dados
  const [closingStats, setClosingStats] = useState({
      total: 0, pending: 0, importing: 0, analysis: 0, done: 0,
      autoImport: 0, manualImport: 0, errorsList: [] // Novos dados
  });
  const [regimeChart, setRegimeChart] = useState([]);

  // --- BUSCA DE DADOS ---
  const fetchData = async () => {
    setLoading(true);
    try {
        // 1. DADOS DE FECHAMENTO
        const { data: closings } = await supabase
            .from('fiscal_closings')
            .select(`*, clients(razao_social, regime)`)
            .eq('competence', `${selectedCompetence}-01`);
        
        if (closings) {
            // Contagem de Status
            const stats = {
                total: closings.length,
                pending: closings.filter(c => c.status === 'pending').length,
                importing: closings.filter(c => c.status === 'importing').length,
                analysis: closings.filter(c => c.status === 'analysis').length,
                done: closings.filter(c => c.status === 'done').length,
                // Novos Contadores
                autoImport: closings.filter(c => c.import_type === 'automatic').length,
                manualImport: closings.filter(c => c.import_type === 'manual').length,
                // Lista de Erros
                errorsList: closings.filter(c => c.import_type === 'manual')
            };
            setClosingStats(stats);

            // Gráfico por Regime
            const regimes = {};
            closings.forEach(c => {
                const r = c.clients?.regime || 'Outros';
                regimes[r] = (regimes[r] || 0) + 1;
            });
            setRegimeChart(Object.keys(regimes).map(k => ({ name: k, value: regimes[k] })));
        }

    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompetence]);

  // Componentes Visuais
  const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-surface p-6 rounded-2xl border border-white/5 shadow-lg flex items-center justify-between">
        <div>
            <p className="text-gray-400 text-xs font-bold uppercase mb-1">{label}</p>
            <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-white/5 ${color.replace('text-', 'text-opacity-80 ')}`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Visão Fiscal</h1>
              <p className="text-gray-500 text-sm">KPIs e Métricas Operacionais</p>
            </div>
        </div>

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

      {/* Navegação de Abas */}
      <div className="flex gap-2 mb-8 bg-surface/50 p-1 rounded-xl w-fit border border-white/5">
         <button onClick={() => setActiveTab('fechamento')} className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === 'fechamento' ? 'bg-brand-cyan text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Fechamento Mensal</button>
         <button onClick={() => setActiveTab('obrigacoes')} className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === 'obrigacoes' ? 'bg-brand-cyan text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Obrigações</button>
         <button onClick={() => setActiveTab('parcelamentos')} className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === 'parcelamentos' ? 'bg-brand-cyan text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Parcelamentos</button>
      </div>

      {/* Conteúdo */}
      <div className="animate-fade-in space-y-8">
          
          {/* === ABA FECHAMENTO === */}
          {activeTab === 'fechamento' && (
              <>
                {/* Métricas Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total de Clientes" value={closingStats.total} icon={FileCheck} color="text-white" />
                    <StatCard label="Pendentes" value={closingStats.pending} icon={Clock} color="text-gray-400" />
                    <StatCard label="Em Apuração" value={closingStats.analysis} icon={AlertTriangle} color="text-yellow-500" />
                    <StatCard label="Concluídos" value={closingStats.done} icon={CheckCircle} color="text-emerald-500" />
                </div>

                {/* Métricas de Importação */}
                <h3 className="text-white font-bold text-lg mt-8 mb-4 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-brand-cyan" /> Qualidade da Importação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard label="Importações Automáticas" value={closingStats.autoImport} icon={CheckCircle} color="text-blue-400" />
                    <StatCard label="Importações Manuais (Erros)" value={closingStats.manualImport} icon={AlertCircle} color="text-red-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                     {/* Gráfico Regime */}
                     <div className="bg-surface rounded-2xl p-6 border border-white/5">
                        <h3 className="text-white font-bold mb-6">Status por Regime</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={regimeChart} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {regimeChart.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />)}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                     </div>

                     {/* Tabela de Erros de Importação */}
                     <div className="lg:col-span-2 bg-surface rounded-2xl p-6 border border-white/5 flex flex-col h-[350px]">
                        <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Erros de Importação
                        </h3>
                        <div className="overflow-y-auto custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-surface">
                                    <tr className="text-xs text-gray-500 uppercase border-b border-white/10">
                                        <th className="pb-3 pl-2">Cliente</th>
                                        <th className="pb-3">Tipo</th>
                                        <th className="pb-3">Descrição do Erro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {closingStats.errorsList.map((item) => (
                                        <tr key={item.id} className="text-sm hover:bg-white/5">
                                            <td className="py-3 pl-2 font-bold text-gray-300">{item.clients?.razao_social}</td>
                                            <td className="py-3">
                                                <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs uppercase font-bold">Manual</span>
                                            </td>
                                            <td className="py-3 text-gray-400 italic max-w-xs truncate" title={item.import_error_details}>
                                                {item.import_error_details || 'Sem detalhes.'}
                                            </td>
                                        </tr>
                                    ))}
                                    {closingStats.errorsList.length === 0 && (
                                        <tr><td colSpan="3" className="py-8 text-center text-gray-500">Nenhum erro de importação registrado.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                     </div>
                </div>
              </>
          )}

          {/* Outras abas (Placeholder) */}
          {activeTab !== 'fechamento' && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <BarChart2 className="w-12 h-12 mb-4 opacity-50" />
                  <p>Métricas para {activeTab} em desenvolvimento.</p>
              </div>
          )}
      </div>
    </div>
  );
}