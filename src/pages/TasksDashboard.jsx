import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Clock, CheckCircle, 
  MoreHorizontal, Calendar, Filter 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// --- SUB-COMPONENTES VISUAIS ---

// Componente para os Números Grandes (KPIs)
const StatCard = ({ value, label, sublabel, color = "text-primary" }) => (
  <div className="flex flex-col items-center justify-center p-6 border-r border-white/5 last:border-r-0">
    <span className={`text-4xl font-bold ${color} mb-2`}>{value}</span>
    <span className="text-gray-400 text-sm font-medium">{label}</span>
    {sublabel && <span className="text-xs text-gray-600 mt-1">{sublabel}</span>}
  </div>
);

// Componente do Gráfico de Rosca (Donut)
const DonutChart = () => {
  const data = [
    { name: 'Digisac', value: 40, color: '#3B82F6' },    // Azul
    { name: 'Ekanban', value: 15, color: '#10B981' },    // Verde
    { name: 'Fechamento', value: 10, color: '#F59E0B' }, // Amarelo
    { name: 'Obrigações', value: 15, color: '#8B5CF6' }, // Roxo
  ];

  return (
    <div className="h-64 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#202024', border: 'none', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legenda Manual */}
      <div className="flex justify-center gap-4 mt-2 flex-wrap">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-400">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function TasksDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // overview, tasks, focus

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      
      {/* --- HEADER --- */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Visão Tarefas/Foco</h1>
        
        {/* Navegação de Abas (Pílula) */}
        <div className="bg-surface rounded-full p-1 flex items-center">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-surfaceHover text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Visão geral
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'tasks' ? 'bg-surfaceHover text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Tarefa
          </button>
          <button 
            onClick={() => setActiveTab('focus')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'focus' ? 'bg-surfaceHover text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Foco
          </button>
        </div>

        <button 
          onClick={() => navigate('/home')}
          className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Voltar
        </button>
      </header>

      {/* --- TOP BAR (RESUMO) --- */}
      <div className="bg-surface rounded-xl p-4 mb-8 flex items-center justify-around border border-white/5">
        <div className="flex gap-2 text-sm font-bold text-white"><span>1000</span> <span className="text-gray-400 font-normal">Tarefas</span></div>
        <div className="flex gap-2 text-sm font-bold text-white"><span>500</span> <span className="text-gray-400 font-normal">Concluídas</span></div>
        <div className="flex gap-2 text-sm font-bold text-white"><span>8</span> <span className="text-gray-400 font-normal">Categorias</span></div>
        <div className="flex gap-2 text-sm font-bold text-white"><span>45</span> <span className="text-gray-400 font-normal">Dias</span></div>
      </div>

      {/* --- CONTEÚDO DINÂMICO --- */}
      
      {/* 1. ABA VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="bg-surface rounded-2xl p-8 border border-white/5 animate-fade-in-up">
          <h2 className="text-gray-400 text-sm mb-6">Visão geral</h2>
          <div className="grid grid-cols-3 gap-y-12">
            <StatCard value="50" label="Conclusão de Hoje" />
            <StatCard value="12" label="Pomo" />
            <StatCard value="7h25min" label="Foco de Hoje" />
            
            <StatCard value="500" label="Conclusão Total" />
            <StatCard value="64" label="Pomos totais" />
            <StatCard value="600h55min" label="Duração Total Foco" />
          </div>
        </div>
      )}

      {/* 2. ABA TAREFA */}
      {activeTab === 'tasks' && (
        <div className="animate-fade-in-up">
          {/* Filtros */}
          <div className="flex items-center gap-4 mb-6">
            <button className="bg-surface hover:bg-surfaceHover text-gray-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
              Diariamente <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
            <div className="bg-surface flex items-center rounded-lg px-2">
              <button className="p-2 text-gray-500 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-white px-2">Hoje</span>
              <button className="p-2 text-gray-500 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Esquerdo: KPIs Comparativos */}
            <div className="bg-surface rounded-2xl p-8 border border-white/5 flex items-center justify-around">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">50</div>
                <div className="text-gray-400 text-sm mb-2">Tarefas Concluídas</div>
                <div className="text-emerald-500 text-xs flex items-center justify-center gap-1">
                  6 mais que ontem <span className="text-xs">⬆</span>
                </div>
              </div>
              <div className="w-px h-16 bg-white/10"></div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">86%</div>
                <div className="text-gray-400 text-sm mb-2">Taxa de Realização</div>
                <div className="text-emerald-500 text-xs flex items-center justify-center gap-1">
                  22% a mais que ontem <span className="text-xs">⬆</span>
                </div>
              </div>
            </div>

            {/* Card Direito: Gráfico */}
            <div className="bg-surface rounded-2xl p-6 border border-white/5">
              <h3 className="text-white text-sm mb-4">Distribuição da taxa de conclusão</h3>
              <DonutChart />
            </div>
          </div>
        </div>
      )}

      {/* 3. ABA FOCO */}
      {activeTab === 'focus' && (
        <div className="animate-fade-in-up">
          {/* KPIs do Topo */}
          <div className="bg-surface rounded-2xl p-6 border border-white/5 mb-6 grid grid-cols-4 divide-x divide-white/5">
            <StatCard value="0" label="Pomo de hoje" sublabel="0 de ontem ⬆" color="text-primary" />
            <StatCard value="85" label="Pomos totais" />
            <StatCard value="0h0m" label="Foco de hoje" sublabel="0h0m de ontem ⬆" color="text-primary" />
            <StatCard value="224h56m" label="Duração Total Focada" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Área Esquerda (Timer/Conteúdo) - Placeholder conforme imagem */}
            <div className="lg:col-span-2 bg-surface rounded-2xl p-6 border border-white/5 min-h-[300px] flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
              <p className="text-gray-500">Área do Timer / Gráfico de Fluxo</p>
            </div>

            {/* Timeline à Direita */}
            <div className="bg-surface rounded-2xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold">Foco em registro.</h3>
                <div className="flex gap-2 text-gray-400">
                   <button className="hover:text-white">+</button>
                   <button className="hover:text-white"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
              </div>

              {/* Lista Timeline */}
              <div className="space-y-6 relative pl-2">
                {/* Linha vertical da timeline */}
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-white/10"></div>

                {/* Item 1 */}
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-surface border-2 border-primary flex items-center justify-center z-10">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">21:39 - 22:33</span>
                      <p className="text-white text-sm font-medium">Aula 1 - Hadoop</p>
                    </div>
                    <span className="text-xs text-gray-500">32m</span>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-surface border-2 border-primary flex items-center justify-center z-10">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">13:17 - 14:55</span>
                      <p className="text-white text-sm font-medium">Trabalhar na Planilha de Prospecção</p>
                    </div>
                    <span className="text-xs text-gray-500">1h37m</span>
                  </div>
                </div>

                 {/* Separador de Data */}
                 <div className="text-xs text-gray-500 font-bold mt-4 mb-2 pl-2">mar 23, 2023</div>

                 {/* Item 3 */}
                 <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-surface border-2 border-primary flex items-center justify-center z-10">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">10:38 - 12:05</span>
                      <p className="text-white text-sm font-medium">Preparar Comissão</p>
                    </div>
                    <span className="text-xs text-gray-500">1h26m</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}