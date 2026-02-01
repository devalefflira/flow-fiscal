import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Box, User, Calendar, ChevronDown, 
  Play, MoreHorizontal, X 
} from 'lucide-react';

export default function EisenhowerMatrix() {
  const navigate = useNavigate();

  // Estados para controlar os Popups da Barra de Tarefa
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [selectedPriority, setSelectedPriority] = useState(1); // 1 a 4

  // Dados Mockados para visualizar a matriz preenchida
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Corrigir Bug Crítico no Login', priority: 1 },
    { id: 2, title: 'Planejar Sprint Q2', priority: 2 },
    { id: 3, title: 'Responder E-mail de Cliente', priority: 3 },
    { id: 4, title: 'Arquivar documentos antigos', priority: 4 },
  ]);

  // Função auxiliar para pegar a cor baseada na prioridade
  const getPriorityColor = (p) => {
    switch(p) {
      case 1: return 'bg-eisenhower-do text-eisenhower-do';
      case 2: return 'bg-eisenhower-schedule text-eisenhower-schedule';
      case 3: return 'bg-eisenhower-delegate text-eisenhower-delegate';
      case 4: return 'bg-eisenhower-delete text-eisenhower-delete';
      default: return 'bg-gray-500 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 font-sans flex flex-col">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Matriz de Eisenhower</h1>
        <button 
          onClick={() => navigate('/home')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      {/* --- BARRA DE ADICIONAR TAREFA (QUICK ADD) --- */}
      <div className="bg-surface rounded-xl p-2 mb-8 flex items-center gap-4 relative z-50 border border-white/5 shadow-lg">
        
        {/* Ícone Mais */}
        <div className="pl-3">
          <Plus className="text-gray-500 w-5 h-5" />
        </div>

        {/* Input */}
        <input 
          type="text"
          placeholder="Adicionar Tarefa"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          className="bg-transparent flex-1 text-white placeholder-gray-500 outline-none h-10"
        />

        {/* Ações (Ícones) */}
        <div className="flex items-center gap-1 pr-2">
          
          {/* 1. Categoria (Cubo) */}
          <button className="p-2 hover:bg-white/5 rounded-lg text-brand-cyan transition-colors">
            <Box className="w-5 h-5" />
          </button>

          {/* 2. Responsável (User) */}
          <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
            <User className="w-5 h-5" />
          </button>

          {/* 3. Calendário (Com Popover) */}
          <div className="relative">
            <button 
              onClick={() => { setShowCalendar(!showCalendar); setShowPriority(false); }}
              className={`p-2 rounded-lg transition-colors ${showCalendar ? 'text-primary bg-white/5' : 'text-gray-400 hover:text-white'}`}
            >
              <Calendar className="w-5 h-5" />
            </button>
            
            {/* POPOVER DO CALENDÁRIO (Simulação Visual) */}
            {showCalendar && (
              <div className="absolute top-12 right-0 bg-surface border border-white/10 rounded-xl p-4 shadow-2xl w-64 animate-fade-in-up">
                <div className="flex justify-between items-center text-white mb-4">
                  <span className="text-sm font-medium">fev 2026</span>
                  <div className="flex gap-2 text-gray-500">
                    <span>&lt;</span><span>&gt;</span>
                  </div>
                </div>
                {/* Grid dias mockado */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-4">
                  <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
                  {/* Dias vazios */}
                  <span></span><span></span>
                  {/* Dias 1-14 */}
                  <span className="text-primary font-bold bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center">1</span>
                  {[...Array(13)].map((_, i) => <span key={i} className="hover:text-white cursor-pointer py-1">{i+2}</span>)}
                </div>
                <div className="border-t border-white/10 pt-3">
                   <div className="bg-input rounded-lg p-2 text-center text-white text-xl font-bold tracking-widest">
                     00:00
                   </div>
                   <div className="flex justify-between mt-3">
                     <button className="text-xs text-gray-500 hover:text-white">Limpar</button>
                     <button 
                        onClick={() => setShowCalendar(false)}
                        className="bg-primary hover:bg-primary-hover text-white text-xs px-4 py-1 rounded-md"
                     >
                       OK
                     </button>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Prioridade (Com Popover) */}
          <div className="relative">
            <button 
              onClick={() => { setShowPriority(!showPriority); setShowCalendar(false); }}
              className={`p-2 rounded-lg transition-colors ${showPriority ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white'}`}
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            {/* POPOVER DE PRIORIDADE */}
            {showPriority && (
              <div className="absolute top-12 right-0 bg-surface border border-white/10 rounded-xl p-4 shadow-2xl flex flex-col gap-2 w-48 animate-fade-in-up">
                <span className="text-gray-500 text-xs font-medium mb-1">Prioridade</span>
                <div className="flex justify-between">
                  {[1, 2, 3, 4].map((p) => (
                    <button 
                      key={p}
                      onClick={() => { setSelectedPriority(p); setShowPriority(false); }}
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-background transition-transform hover:scale-110
                        ${p === 1 ? 'bg-eisenhower-do' : ''}
                        ${p === 2 ? 'bg-eisenhower-schedule' : ''}
                        ${p === 3 ? 'bg-eisenhower-delegate' : ''}
                        ${p === 4 ? 'bg-eisenhower-delete' : ''}
                        ${selectedPriority === p ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}
                      `}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botão INICIAR */}
          <button className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg ml-2 transition-transform active:scale-95 text-sm">
            INICIAR
          </button>
        </div>
      </div>

      {/* --- GRID DA MATRIZ (4 QUADRANTES) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        
        {/* Q1: FAZER AGORA (Vermelho) */}
        <Quadrant 
          priority={1} 
          title="Importante e Urgente (Fazer Agora)" 
          colorClass="bg-eisenhower-do"
          tasks={tasks.filter(t => t.priority === 1)}
        />

        {/* Q2: AGENDAR (Amarelo) */}
        <Quadrant 
          priority={2} 
          title="Importante, mas Não Urgente (Agendar/Planejar)" 
          colorClass="bg-eisenhower-schedule"
          tasks={tasks.filter(t => t.priority === 2)}
        />

        {/* Q3: DELEGAR (Ciano) */}
        <Quadrant 
          priority={3} 
          title="Urgente, mas Não Importante (Delegar)" 
          colorClass="bg-eisenhower-delegate"
          tasks={tasks.filter(t => t.priority === 3)}
        />

        {/* Q4: ELIMINAR (Verde) */}
        <Quadrant 
          priority={4} 
          title="Não Importante e Não Urgente (Eliminar)" 
          colorClass="bg-eisenhower-delete"
          tasks={tasks.filter(t => t.priority === 4)}
        />

      </div>
    </div>
  );
}

// Componente Interno de Quadrante
function Quadrant({ priority, title, colorClass, tasks }) {
  return (
    <div className="bg-surface rounded-xl border border-white/5 flex flex-col h-full min-h-[250px] overflow-hidden group hover:border-white/10 transition-colors">
      {/* Header do Quadrante */}
      <div className="p-4 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-background ${colorClass}`}>
          {priority}
        </div>
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>

      {/* Lista de Tarefas */}
      <div className="flex-1 p-4 pt-0 space-y-2">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <div key={task.id} className="bg-background/50 p-3 rounded-lg border border-white/5 flex justify-between items-center hover:bg-background transition-colors cursor-pointer group/item">
              <span className="text-gray-300 text-sm">{task.title}</span>
              <button className="text-gray-600 hover:text-white opacity-0 group-hover/item:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-lg">
            <span className="text-gray-600 text-xs">Arraste ou adicione tarefas</span>
          </div>
        )}
      </div>
    </div>
  );
}