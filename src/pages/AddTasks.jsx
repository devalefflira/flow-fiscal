import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Pause, Square, CheckSquare, Plus, Trash2, 
  Clock, Calendar, User, Tag, ChevronLeft, Save, CheckCircle 
} from 'lucide-react';

export default function AddTasks() {
  const navigate = useNavigate();

  // --- ESTADOS DO FORMULÁRIO ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState(1);
  const [client, setClient] = useState('');
  const [tags, setTags] = useState(''); // Separadas por vírgula
  
  // --- ESTADOS DO CHECKLIST ---
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [checklist, setChecklist] = useState([]); // [{id, text, done}]

  // --- ESTADOS DO TIMER ---
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // --- DADOS MOCKADOS (Listas Laterais) ---
  const tasksPending = [
    { id: 1, title: 'Revisar Balanço Trimestral', client: 'TechSolutions', priority: 1 },
    { id: 2, title: 'Enviar Guias DAS', client: 'Padaria Central', priority: 2 },
  ];
  const tasksCompleted = [
    { id: 3, title: 'Reunião de Alinhamento', client: 'Interno', priority: 3 },
  ];

  // --- LÓGICA DO TIMER ---
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!isTimerRunning && timerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- LÓGICA DO CHECKLIST ---
  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklist([...checklist, { id: Date.now(), text: newChecklistItem, done: false }]);
      setNewChecklistItem('');
    }
  };

  const toggleChecklistItem = (id) => {
    const updatedList = checklist.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    );
    setChecklist(updatedList);

    // Verifica se todos estão marcados para "Concluir" (Simulação)
    const allDone = updatedList.every(i => i.done);
    if (allDone && updatedList.length > 0) {
      // Aqui você poderia disparar uma animação de confete ou salvar automático
      console.log("Tarefa concluída via checklist!");
    }
  };

  const removeChecklistItem = (id) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  // Cálculo da Barra de Progresso
  const progress = checklist.length > 0 
    ? Math.round((checklist.filter(i => i.done).length / checklist.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background p-6 font-sans flex flex-col gap-6 overflow-hidden">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-white">Adicionar / Editar Tarefa</h1>
        </div>
        <div className="flex gap-3">
             <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                <Save className="w-5 h-5" /> Salvar Tarefa
             </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full flex-1">
        
        {/* --- COLUNA ESQUERDA: FORMULÁRIO PRINCIPAL (65%) --- */}
        <div className="flex-1 bg-surface rounded-2xl p-6 border border-white/5 flex flex-col gap-6 overflow-y-auto">
            
            {/* 1. Timer & Título */}
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                    <label className="text-gray-500 text-xs font-bold uppercase mb-1 block">Título da Tarefa</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Fechamento Fiscal Mensal - Cliente X"
                        className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-600 outline-none border-b border-white/10 focus:border-brand-cyan transition-colors py-2"
                    />
                </div>
                {/* Timer Card */}
                <div className="bg-background rounded-xl p-4 flex flex-col items-center border border-white/10 min-w-[180px]">
                    <span className="text-brand-cyan font-mono text-3xl font-bold tracking-widest mb-2">
                        {formatTime(timerSeconds)}
                    </span>
                    <div className="flex gap-2 w-full">
                        {!isTimerRunning ? (
                            <button 
                                onClick={() => setIsTimerRunning(true)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1 rounded flex justify-center items-center transition-colors"
                                title="Iniciar"
                            >
                                <Play className="w-4 h-4" fill="currentColor" />
                            </button>
                        ) : (
                            <button 
                                onClick={() => setIsTimerRunning(false)}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-1 rounded flex justify-center items-center transition-colors"
                                title="Pausar"
                            >
                                <Pause className="w-4 h-4" fill="currentColor" />
                            </button>
                        )}
                        <button 
                            onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 rounded flex justify-center items-center transition-colors"
                            title="Finalizar/Resetar"
                        >
                            <Square className="w-4 h-4" fill="currentColor" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Barra Rápida (Inputs em Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Data */}
                <div className="bg-background/50 p-3 rounded-lg border border-white/5 flex items-center gap-3">
                    <Calendar className="text-gray-400 w-5 h-5" />
                    <div className="flex-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase block">Data Limite</label>
                        <input 
                            type="date" 
                            className="bg-transparent text-sm text-white w-full outline-none [&::-webkit-calendar-picker-indicator]:invert"
                        />
                    </div>
                </div>

                {/* Cliente */}
                <div className="bg-background/50 p-3 rounded-lg border border-white/5 flex items-center gap-3">
                    <User className="text-gray-400 w-5 h-5" />
                    <div className="flex-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase block">Cliente Vinculado</label>
                        <select 
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
                            className="bg-transparent text-sm text-white w-full outline-none appearance-none"
                        >
                            <option value="" className="bg-surface text-gray-400">Selecionar...</option>
                            <option value="tech" className="bg-surface">TechSolutions</option>
                            <option value="padaria" className="bg-surface">Padaria Central</option>
                        </select>
                    </div>
                </div>

                {/* Prioridade */}
                <div className="bg-background/50 p-3 rounded-lg border border-white/5 flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-background
                        ${priority === 1 ? 'bg-eisenhower-do' : 
                          priority === 2 ? 'bg-eisenhower-schedule' : 
                          priority === 3 ? 'bg-eisenhower-delegate' : 'bg-eisenhower-delete'}
                    `}>
                        {priority}
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase block">Prioridade</label>
                        <select 
                            value={priority}
                            onChange={(e) => setPriority(Number(e.target.value))}
                            className="bg-transparent text-sm text-white w-full outline-none appearance-none cursor-pointer"
                        >
                            <option value={1} className="bg-surface text-eisenhower-do">1 - Fazer Agora</option>
                            <option value={2} className="bg-surface text-eisenhower-schedule">2 - Agendar</option>
                            <option value={3} className="bg-surface text-eisenhower-delegate">3 - Delegar</option>
                            <option value={4} className="bg-surface text-eisenhower-delete">4 - Eliminar</option>
                        </select>
                    </div>
                </div>

                 {/* Tags */}
                 <div className="bg-background/50 p-3 rounded-lg border border-white/5 flex items-center gap-3">
                    <Tag className="text-gray-400 w-5 h-5" />
                    <div className="flex-1">
                        <label className="text-[10px] text-gray-500 font-bold uppercase block">Tags</label>
                        <input 
                            type="text" 
                            placeholder="fiscal, urgente..."
                            className="bg-transparent text-sm text-white w-full outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* 3. Descrição Detalhada */}
            <div className="flex-1 flex flex-col min-h-[150px]">
                <label className="text-gray-500 text-xs font-bold uppercase mb-2">Descrição Detalhada</label>
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva todos os detalhes necessários para a execução desta tarefa..."
                    className="flex-1 bg-background/50 rounded-xl p-4 text-gray-300 resize-none outline-none border border-white/5 focus:border-brand-cyan transition-colors"
                ></textarea>
            </div>

            {/* 4. Checklists & Progresso */}
            <div className="mt-4">
                <div className="flex justify-between items-end mb-2">
                    <label className="text-gray-500 text-xs font-bold uppercase">Checklist de Execução</label>
                    <span className="text-xs text-brand-cyan font-bold">{progress}% Concluído</span>
                </div>
                
                {/* Barra de Progresso */}
                <div className="w-full h-2 bg-background rounded-full overflow-hidden mb-4">
                    <div 
                        className="h-full bg-brand-cyan transition-all duration-500 ease-out" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Lista de Itens */}
                <div className="space-y-2 mb-4">
                    {checklist.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 group">
                            <button onClick={() => toggleChecklistItem(item.id)} className="transition-transform active:scale-95">
                                {item.done ? (
                                    <CheckSquare className="text-brand-cyan w-5 h-5" />
                                ) : (
                                    <Square className="text-gray-600 w-5 h-5 group-hover:text-gray-400" />
                                )}
                            </button>
                            <span className={`flex-1 text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                {item.text}
                            </span>
                            <button onClick={() => removeChecklistItem(item.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Input Checklist */}
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                        placeholder="Adicionar item ao checklist..."
                        className="flex-1 bg-background text-sm text-white px-4 py-2 rounded-lg outline-none border border-white/5 focus:border-white/20"
                    />
                    <button 
                        onClick={addChecklistItem}
                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

        </div>

        {/* --- COLUNA DIREITA: LISTAS (35%) --- */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
            
            {/* Lista Pendentes */}
            <div className="flex-1 bg-surface rounded-2xl p-6 border border-white/5 flex flex-col">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Tarefas Pendentes
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {tasksPending.map(task => (
                        <div key={task.id} className="bg-background/40 p-3 rounded-xl border border-white/5 hover:border-brand-cyan/50 cursor-pointer transition-all hover:bg-background/60 group">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-sm text-gray-200 font-medium group-hover:text-white">{task.title}</span>
                                <div className={`w-2 h-2 rounded-full ${task.priority === 1 ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>{task.client}</span>
                                <Play className="w-3 h-3 text-gray-600 group-hover:text-brand-cyan" />
                            </div>
                        </div>
                    ))}
                     {/* Empty State visual */}
                     <div className="border border-dashed border-white/5 rounded-xl p-4 flex justify-center text-gray-600 text-xs">
                        + Arraste ou crie nova
                     </div>
                </div>
            </div>

            {/* Lista Concluídas */}
            <div className="flex-1 bg-surface rounded-2xl p-6 border border-white/5 flex flex-col">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Concluídas (Hoje)
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {tasksCompleted.map(task => (
                        <div key={task.id} className="bg-background/40 p-3 rounded-xl border border-white/5 opacity-60 hover:opacity-100 transition-opacity">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-sm text-gray-400 font-medium line-through">{task.title}</span>
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                            </div>
                            <span className="text-xs text-gray-600">{task.client}</span>
                        </div>
                    ))}
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}