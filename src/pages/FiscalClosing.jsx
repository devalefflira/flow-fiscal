import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Filter, Search, Calendar, 
  MoreHorizontal, CheckSquare, Square, 
  AlertCircle, Clock, CheckCircle
} from 'lucide-react';

export default function FiscalClosing() {
  const navigate = useNavigate();

  // --- ESTADOS DE FILTROS ---
  const [competence, setCompetence] = useState('2026-01');
  const [filterRegime, setFilterRegime] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // --- ESTADOS DO KANBAN ---
  // Dados Mockados dos Clientes/Processos
  const [tasks, setTasks] = useState([
    { 
      id: '1', 
      clientCode: '001', 
      clientName: 'TechSolutions Ltda', 
      cnpj: '12.345.678/0001-90', 
      regime: 'Lucro Presumido', 
      status: 'pending', // pending, progress, done
      priority: null, 
      startDate: null,
      endDate: null,
      checklist: [
        { id: 'c1', text: 'Conferência de Saídas', done: false },
        { id: 'c2', text: 'Conferência de Entradas', done: false },
        { id: 'c3', text: 'Apuração dos Impostos', done: false },
        { id: 'c4', text: 'Envio das Guias', done: false },
      ]
    },
    { 
      id: '2', 
      clientCode: '045', 
      clientName: 'Padaria Central', 
      cnpj: '98.765.432/0001-10', 
      regime: 'Simples Nacional', 
      status: 'pending',
      priority: null,
      startDate: null,
      endDate: null,
      checklist: [
        { id: 'c1', text: 'Conferência de Saídas', done: false },
        { id: 'c2', text: 'Conferência de Entradas', done: false },
        { id: 'c3', text: 'Apuração dos Impostos', done: false },
        { id: 'c4', text: 'Envio das Guias', done: false },
      ]
    },
    { 
      id: '3', 
      clientCode: '088', 
      clientName: 'Indústria Metalúrgica', 
      cnpj: '45.123.789/0001-55', 
      regime: 'Lucro Real', 
      status: 'progress',
      priority: 1, // Já veio com prioridade pois está em andamento
      startDate: '2026-02-01',
      endDate: null,
      checklist: [
        { id: 'c1', text: 'Conferência de Saídas', done: true },
        { id: 'c2', text: 'Conferência de Entradas', done: true },
        { id: 'c3', text: 'Apuração dos Impostos', done: false },
        { id: 'c4', text: 'Envio das Guias', done: false },
      ]
    }
  ]);

  // Estado para controlar o Modal de Prioridade
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null); // Item sendo arrastado
  const [tempTargetStatus, setTempTargetStatus] = useState(null); // Para onde ele ia quando foi interrompido

  // --- LÓGICA DE DRAG AND DROP (Nativo HTML5) ---

  const handleDragStart = (e, task) => {
    setDraggedItem(task);
    e.dataTransfer.effectAllowed = 'move';
    // Pequeno delay para visual
    setTimeout(() => e.target.classList.add('opacity-50'), 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
    // Não limpa o draggedItem aqui se abriu o modal, pois precisamos dele lá
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessário para permitir o Drop
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    // LÓGICA DE TRANSIÇÃO
    
    // 1. De Pendente -> Em Andamento (Exige Prioridade)
    if (draggedItem.status === 'pending' && targetStatus === 'progress') {
      if (!draggedItem.priority) {
        // Interrompe e pede prioridade
        setTempTargetStatus(targetStatus);
        setShowPriorityModal(true);
        return; 
      }
    }

    moveTask(draggedItem, targetStatus);
    setDraggedItem(null);
  };

  const moveTask = (task, newStatus, priorityValue = null) => {
    const now = new Date().toISOString().split('T')[0]; // Data atual YYYY-MM-DD

    const updatedTasks = tasks.map(t => {
      if (t.id === task.id) {
        let updates = { status: newStatus };

        // Regra: Registra Data Inicial ao entrar em 'progress'
        if (newStatus === 'progress' && t.status === 'pending') {
          updates.startDate = now;
          if (priorityValue) updates.priority = priorityValue;
        }

        // Regra: Registra Data Final ao entrar em 'done'
        if (newStatus === 'done') {
          updates.endDate = now;
        }

        // Se voltar para pendente (opcional), limpa datas? Por enquanto mantemos o histórico.
        
        return { ...t, ...updates };
      }
      return t;
    });

    setTasks(updatedTasks);
  };

  // --- LÓGICA DO CHECKLIST ---
  const toggleChecklist = (taskId, itemId) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const newChecklist = t.checklist.map(c => 
          c.id === itemId ? { ...c, done: !c.done } : c
        );
        return { ...t, checklist: newChecklist };
      }
      return t;
    }));
  };

  // Cálculo de Progresso
  const getProgress = (checklist) => {
    const total = checklist.length;
    const done = checklist.filter(c => c.done).length;
    return Math.round((done / total) * 100);
  };

  // Cores de Prioridade
  const getPriorityColor = (p) => {
    switch(p) {
      case 1: return 'bg-red-500 text-white';
      case 2: return 'bg-yellow-500 text-black';
      case 3: return 'bg-cyan-500 text-white';
      case 4: return 'bg-emerald-500 text-white';
      default: return 'bg-gray-600 text-gray-300';
    }
  };

  // --- COMPONENTE DE COLUNA ---
  const KanbanColumn = ({ title, status, colorBorder }) => {
    // Filtra tarefas da coluna + Filtros globais
    const columnTasks = tasks.filter(t => {
      const matchesStatus = t.status === status;
      const matchesRegime = filterRegime === 'Todos' || t.regime === filterRegime;
      const matchesSearch = t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.clientCode.includes(searchTerm);
      return matchesStatus && matchesRegime && matchesSearch;
    });

    return (
      <div 
        className="flex-1 min-w-[320px] bg-surface/50 rounded-xl flex flex-col h-full border border-white/5"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        {/* Cabeçalho da Coluna */}
        <div className={`p-4 border-b-4 ${colorBorder} bg-surface rounded-t-xl flex justify-between items-center`}>
          <h3 className="font-bold text-white uppercase tracking-wider text-sm">{title}</h3>
          <span className="bg-white/10 text-xs px-2 py-1 rounded-full text-gray-300">{columnTasks.length}</span>
        </div>

        {/* Área de Cards */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
          {columnTasks.map(task => (
            <div 
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task)}
              onDragEnd={handleDragEnd}
              className="bg-surface rounded-lg p-4 border border-white/5 hover:border-brand-cyan/50 cursor-grab active:cursor-grabbing shadow-lg group transition-all"
            >
              {/* Header do Card */}
              <div className="flex justify-between items-start mb-3">
                <div>
                   <span className="text-xs font-mono text-brand-cyan bg-brand-cyan/10 px-1 rounded">#{task.clientCode}</span>
                   <h4 className="font-bold text-white mt-1">{task.clientName}</h4>
                   <span className="text-[10px] text-gray-500 block">{task.cnpj}</span>
                </div>
                {/* Badge de Prioridade (Se existir) */}
                {task.priority && (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getPriorityColor(task.priority)}`} title="Prioridade">
                    {task.priority}
                  </div>
                )}
              </div>

              {/* Informações Extras */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded border border-white/5">
                  {task.regime}
                </span>
                {task.startDate && (
                   <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
                     <Clock className="w-3 h-3" /> Iniciado: {task.startDate.split('-').reverse().slice(0,2).join('/')}
                   </span>
                )}
                {task.endDate && (
                   <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-1 rounded border border-blue-500/20 flex items-center gap-1">
                     <CheckCircle className="w-3 h-3" /> Fim: {task.endDate.split('-').reverse().slice(0,2).join('/')}
                   </span>
                )}
              </div>

              {/* Checklist Visual */}
              <div className="bg-background/50 rounded-lg p-2">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Checklist</span>
                    <span className="text-[10px] text-brand-cyan font-bold">{getProgress(task.checklist)}%</span>
                 </div>
                 
                 {/* Barra de Progresso */}
                 <div className="w-full h-1.5 bg-gray-700 rounded-full mb-3 overflow-hidden">
                    <div 
                      className="h-full bg-brand-cyan transition-all duration-300" 
                      style={{ width: `${getProgress(task.checklist)}%` }}
                    />
                 </div>

                 {/* Itens do Checklist */}
                 <div className="space-y-1">
                    {task.checklist.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => toggleChecklist(task.id, item.id)}
                        className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                      >
                         {item.done ? 
                           <CheckSquare className="w-3 h-3 text-brand-cyan" /> : 
                           <Square className="w-3 h-3 text-gray-600" />
                         }
                         <span className={`text-xs ${item.done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                           {item.text}
                         </span>
                      </div>
                    ))}
                 </div>
              </div>

            </div>
          ))}
          {columnTasks.length === 0 && (
             <div className="h-20 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center text-gray-600 text-xs">
               Solte aqui
             </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-background p-6 font-sans flex flex-col overflow-hidden">
      
      {/* --- HEADER & FILTROS --- */}
      <div className="flex flex-col gap-4 mb-6">
        
        {/* Topo: Título e Voltar */}
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-white">Fechamento Fiscal</h1>
            </div>
            {/* Competência (Filtro Principal) */}
            <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-lg border border-white/10">
                <Calendar className="text-brand-cyan w-5 h-5" />
                <input 
                  type="month" 
                  value={competence}
                  onChange={(e) => setCompetence(e.target.value)}
                  className="bg-transparent text-white outline-none font-bold uppercase cursor-pointer"
                />
            </div>
        </div>

        {/* Barra de Filtros Secundários */}
        <div className="flex flex-wrap gap-4 bg-surface p-3 rounded-xl border border-white/5 items-center">
            
            <div className="flex items-center gap-2 px-3 border-r border-white/10">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400 font-medium">Filtros:</span>
            </div>

            {/* Regime */}
            <select 
                value={filterRegime} 
                onChange={(e) => setFilterRegime(e.target.value)}
                className="bg-background text-sm text-white px-3 py-2 rounded-lg border border-white/10 outline-none focus:border-brand-cyan"
            >
                <option value="Todos">Todos os Regimes</option>
                <option value="Simples Nacional">Simples Nacional</option>
                <option value="Lucro Presumido">Lucro Presumido</option>
                <option value="Lucro Real">Lucro Real</option>
            </select>

            {/* Busca */}
            <div className="flex-1 flex items-center gap-2 bg-background px-3 py-2 rounded-lg border border-white/10 focus-within:border-brand-cyan transition-colors">
                <Search className="w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar cliente por nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent text-sm text-white w-full outline-none placeholder-gray-600"
                />
            </div>
        </div>
      </div>

      {/* --- KANBAN BOARD --- */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        
        <KanbanColumn 
          title="Pendente" 
          status="pending" 
          colorBorder="border-red-500" 
        />
        
        <KanbanColumn 
          title="Em Andamento" 
          status="progress" 
          colorBorder="border-yellow-500" 
        />
        
        <KanbanColumn 
          title="Concluído" 
          status="done" 
          colorBorder="border-emerald-500" 
        />

      </div>

      {/* --- MODAL DE PRIORIDADE (Eisenhower) --- */}
      {showPriorityModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
           <div className="bg-surface p-8 rounded-2xl w-[500px] border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 mb-4 text-yellow-500">
                  <AlertCircle className="w-8 h-8" />
                  <h2 className="text-xl font-bold text-white">Definir Prioridade</h2>
              </div>
              
              <p className="text-gray-300 mb-6">
                Para iniciar o fechamento de <strong>{draggedItem?.clientName}</strong>, você precisa definir a prioridade baseada na Matriz de Eisenhower.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                  <button 
                    onClick={() => { moveTask(draggedItem, tempTargetStatus, 1); setShowPriorityModal(false); }}
                    className="p-4 bg-surface hover:bg-white/5 border border-red-500/30 hover:border-red-500 rounded-xl flex flex-col items-center gap-2 transition-all group"
                  >
                      <div className="w-8 h-8 rounded-full bg-red-500 text-white font-bold flex items-center justify-center">1</div>
                      <span className="text-sm font-bold text-gray-300 group-hover:text-white">Urgente & Importante</span>
                  </button>

                  <button 
                    onClick={() => { moveTask(draggedItem, tempTargetStatus, 2); setShowPriorityModal(false); }}
                    className="p-4 bg-surface hover:bg-white/5 border border-yellow-500/30 hover:border-yellow-500 rounded-xl flex flex-col items-center gap-2 transition-all group"
                  >
                      <div className="w-8 h-8 rounded-full bg-yellow-500 text-black font-bold flex items-center justify-center">2</div>
                      <span className="text-sm font-bold text-gray-300 group-hover:text-white">Importante, Não Urgente</span>
                  </button>
                  
                  <button 
                    onClick={() => { moveTask(draggedItem, tempTargetStatus, 3); setShowPriorityModal(false); }}
                    className="p-4 bg-surface hover:bg-white/5 border border-cyan-500/30 hover:border-cyan-500 rounded-xl flex flex-col items-center gap-2 transition-all group"
                  >
                      <div className="w-8 h-8 rounded-full bg-cyan-500 text-white font-bold flex items-center justify-center">3</div>
                      <span className="text-sm font-bold text-gray-300 group-hover:text-white">Urgente, Não Importante</span>
                  </button>

                  <button 
                    onClick={() => { moveTask(draggedItem, tempTargetStatus, 4); setShowPriorityModal(false); }}
                    className="p-4 bg-surface hover:bg-white/5 border border-emerald-500/30 hover:border-emerald-500 rounded-xl flex flex-col items-center gap-2 transition-all group"
                  >
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center">4</div>
                      <span className="text-sm font-bold text-gray-300 group-hover:text-white">Nem Urgente, Nem Importante</span>
                  </button>
              </div>

              <button 
                onClick={() => { setShowPriorityModal(false); setDraggedItem(null); }}
                className="w-full py-3 text-gray-500 hover:text-white transition-colors"
              >
                Cancelar
              </button>
           </div>
        </div>
      )}

    </div>
  );
}