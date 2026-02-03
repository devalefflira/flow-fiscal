import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { format, intervalToDuration, formatDuration } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { 
  ChevronLeft, Plus, CheckCircle, Trash2, Edit2, 
  Square, CheckSquare, X, Calendar, Building, Tag, Clock,
  Play, Pause // Novos ícones
} from 'lucide-react';

export default function EisenhowerMatrix() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]); // Origem
  const [taskStandards, setTaskStandards] = useState([]); // Padronização
  const [loading, setLoading] = useState(true);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); 
  const [checklistInput, setChecklistInput] = useState('');
  const [selectedTaskCategory, setSelectedTaskCategory] = useState('');

  // Form State Inicial
  const initialForm = {
    title: '',
    description: '',
    priority: 'Média',
    quadrant: 2,
    client_id: '',
    category_id: '',
    due_date: '',
    checklist: []
  };
  const [formData, setFormData] = useState(initialForm);

  // --- BUSCAR DADOS ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`*, clients(id, razao_social), categories(id, name, color)`)
        .order('created_at', { ascending: false });
      if (tasksData) setTasks(tasksData);

      const { data: clientsData } = await supabase.from('clients').select('id, razao_social').order('razao_social');
      if (clientsData) setClients(clientsData);

      const { data: catData } = await supabase.from('categories').select('id, name, color').order('name');
      if (catData) setCategories(catData);

      const { data: stdData } = await supabase.from('task_categories').select('*').order('categoria_task');
      if (stdData) setTaskStandards(stdData);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- HELPERS DE DADOS ---
  const uniqueTaskCategories = [...new Set(taskStandards.map(item => item.categoria_task))];
  const filteredTitles = taskStandards.filter(item => item.categoria_task === selectedTaskCategory);

  // --- AÇÕES DO MODAL ---
  const openModal = (task = null) => {
    if (task) {
      setCurrentTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'Média',
        quadrant: task.quadrant || 2,
        client_id: task.client_id || '',
        category_id: task.category_id || '',
        due_date: task.due_date || '',
        checklist: task.checklist || []
      });
      const match = taskStandards.find(s => s.subcategoria_task === task.title);
      setSelectedTaskCategory(match ? match.categoria_task : '');
    } else {
      setCurrentTask(null);
      setFormData(initialForm);
      setSelectedTaskCategory('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return alert('O título é obrigatório');

    const payload = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      quadrant: parseInt(formData.quadrant),
      client_id: formData.client_id || null,
      category_id: formData.category_id || null,
      due_date: formData.due_date || null,
      checklist: formData.checklist
    };

    if (currentTask) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', currentTask.id);
      if (error) alert('Erro ao atualizar: ' + error.message);
    } else {
      const { error } = await supabase.from('tasks').insert([{ ...payload, status: 'todo' }]);
      if (error) alert('Erro ao criar: ' + error.message);
    }

    setIsModalOpen(false);
    fetchData();
  };

  // --- AÇÕES DO CRONÔMETRO (NOVA LÓGICA) ---
  
  const handlePlay = async (task) => {
    const now = new Date().toISOString();
    const updates = {};

    if (!task.started_at) {
        // Primeiro Início
        updates.started_at = now;
        updates.status = 'doing';
    } else if (task.is_paused && task.last_paused_at) {
        // Retomando de Pausa (Calcula tempo que ficou pausado)
        const pauseDuration = new Date(now).getTime() - new Date(task.last_paused_at).getTime();
        updates.total_pause = (task.total_pause || 0) + pauseDuration;
        updates.is_paused = false;
        updates.last_paused_at = null;
    }

    // Atualização Otimista
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t));
    await supabase.from('tasks').update(updates).eq('id', task.id);
  };

  const handlePause = async (task) => {
    const now = new Date().toISOString();
    const updates = {
        is_paused: true,
        last_paused_at: now
    };

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t));
    await supabase.from('tasks').update(updates).eq('id', task.id);
  };

  const completeTask = async (task) => {
    const allChecked = task.checklist ? task.checklist.every(item => item.done) : true;
    if (!allChecked) return alert("Complete o checklist antes de finalizar!");

    if (window.confirm('Concluir esta tarefa?')) {
      const now = new Date().toISOString();
      const updates = {
          status: 'done',
          completed_at: now,
          is_paused: false 
      };

      // Se estava pausado ao concluir, adicionamos o tempo final de pausa
      if (task.is_paused && task.last_paused_at) {
          const finalPause = new Date(now).getTime() - new Date(task.last_paused_at).getTime();
          updates.total_pause = (task.total_pause || 0) + finalPause;
      }

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t));
      await supabase.from('tasks').update(updates).eq('id', task.id);
    }
  };

  // --- OUTRAS AÇÕES ---
  const toggleChecklistItem = async (task, itemIndex) => {
    const newChecklist = [...task.checklist];
    newChecklist[itemIndex].done = !newChecklist[itemIndex].done;
    setTasks(tasks.map(t => t.id === task.id ? { ...t, checklist: newChecklist } : t));
    await supabase.from('tasks').update({ checklist: newChecklist }).eq('id', task.id);
  };

  const deleteTask = async (id) => {
    if (window.confirm('Excluir permanentemente?')) {
      await supabase.from('tasks').delete().eq('id', id);
      fetchData();
    }
  };

  // --- RENDERIZADORES ---
  const getProgress = (checklist) => {
    if (!checklist || checklist.length === 0) return 0;
    const doneCount = checklist.filter(i => i.done).length;
    return Math.round((doneCount / checklist.length) * 100);
  };

  // Formata duração em milissegundos para string legível
  const formatTimeSpent = (startStr, endStr, totalPauseMs = 0) => {
     if (!startStr || !endStr) return '-';
     const start = new Date(startStr).getTime();
     const end = new Date(endStr).getTime();
     
     // Tempo Líquido = (Fim - Início) - Pausas
     const netDurationMs = (end - start) - totalPauseMs;
     
     if (netDurationMs <= 0) return '0 min';

     const duration = intervalToDuration({ start: 0, end: netDurationMs });
     return formatDuration(duration, { 
        locale: ptBR, 
        format: ['days', 'hours', 'minutes'], 
        delimiter: ', ' 
     }) || 'Menos de 1 min';
  };

  const TaskCard = ({ task }) => {
    const progress = getProgress(task.checklist);
    const isReady = progress === 100 || (!task.checklist || task.checklist.length === 0);
    const hasStarted = !!task.started_at;

    return (
      <div className={`
        bg-surface p-4 rounded-xl border shadow-sm group transition-all flex flex-col h-full relative
        ${task.is_paused ? 'border-yellow-500/30' : hasStarted ? 'border-brand-cyan/30' : 'border-white/5'}
      `}>
        {/* Header do Card */}
        <div className="flex justify-between items-start mb-2">
           <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${task.categories?.color || 'bg-gray-700'} text-white`}>
             {task.categories?.name || 'Geral'}
           </span>
           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openModal(task)} className="p-1 hover:text-brand-cyan"><Edit2 className="w-3 h-3" /></button>
              <button onClick={() => deleteTask(task.id)} className="p-1 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
           </div>
        </div>

        <h3 className="text-white font-bold text-sm mb-1">{task.title}</h3>
        {task.clients && (
           <p className="text-xs text-gray-400 mb-2 truncate flex items-center gap-1">
             <Building className="w-3 h-3" /> {task.clients.razao_social}
           </p>
        )}
        
        {/* Controles de Execução */}
        <div className="mb-3">
            {!hasStarted ? (
                // Botão Iniciar (Primeira vez)
                <button 
                    onClick={() => handlePlay(task)}
                    className="w-full bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/20 py-1.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-colors"
                >
                    <Play className="w-3 h-3 fill-current" /> Iniciar Execução
                </button>
            ) : (
                // Controles Play/Pause
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                    <div className="flex-1 text-[10px]">
                        <span className="text-gray-400 block">Início: {format(new Date(task.started_at), 'dd/MM HH:mm')}</span>
                        {task.is_paused ? (
                            <span className="text-yellow-500 font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> Pausado</span>
                        ) : (
                            <span className="text-brand-cyan font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> Em execução...</span>
                        )}
                    </div>
                    {task.is_paused ? (
                         <button onClick={() => handlePlay(task)} className="p-2 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30" title="Retomar">
                             <Play className="w-4 h-4 fill-current" />
                         </button>
                    ) : (
                         <button onClick={() => handlePause(task)} className="p-2 bg-yellow-500/20 text-yellow-500 rounded hover:bg-yellow-500/30" title="Pausar">
                             <Pause className="w-4 h-4 fill-current" />
                         </button>
                    )}
                </div>
            )}
        </div>

        {/* Checklist */}
        <div className="mt-auto space-y-2">
          {task.checklist?.length > 0 && (
             <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mb-2">
                <div className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-brand-cyan'}`} style={{ width: `${progress}%` }}></div>
             </div>
          )}

          <div className="space-y-1">
             {task.checklist?.slice(0, 3).map((item, idx) => (
                <div key={idx} onClick={() => toggleChecklistItem(task, idx)} className="flex items-start gap-2 cursor-pointer group/item">
                   {item.done ? <CheckSquare className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" /> : <Square className="w-3 h-3 text-gray-500 group-hover/item:text-brand-cyan mt-0.5 shrink-0" />}
                   <span className={`text-xs ${item.done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{item.text}</span>
                </div>
             ))}
             {task.checklist?.length > 3 && <span className="text-[10px] text-gray-500 italic">+ {task.checklist.length - 3} itens...</span>}
          </div>

          <button 
            onClick={() => completeTask(task)} 
            disabled={!isReady || !!task.completed_at} 
            className={`w-full mt-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all 
                ${isReady && !task.completed_at 
                    ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 cursor-pointer' 
                    : 'bg-gray-700/20 text-gray-600 cursor-not-allowed'
                }`}
          >
             <CheckCircle className="w-3 h-3" /> {task.completed_at ? 'Concluída' : 'Concluir'}
          </button>
        </div>
      </div>
    );
  };

  const q1 = tasks.filter(t => t.quadrant === 1 && t.status !== 'done');
  const q2 = tasks.filter(t => t.quadrant === 2 && t.status !== 'done');
  const q3 = tasks.filter(t => t.quadrant === 3 && t.status !== 'done');
  const q4 = tasks.filter(t => t.quadrant === 4 && t.status !== 'done');
  const finished = tasks.filter(t => t.status === 'done');

  return (
    <div className="min-h-screen bg-background p-8 font-sans flex flex-col">
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
         <div className="flex items-center gap-4">
             <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors"><ChevronLeft className="w-6 h-6" /></button>
             <div>
               <h1 className="text-2xl font-bold text-white">Matriz de Eisenhower</h1>
               <p className="text-gray-500 text-sm">Priorize com inteligência</p>
             </div>
         </div>
         <button onClick={() => openModal()} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg active:scale-95">
            <Plus className="w-5 h-5" /> Nova Tarefa
         </button>
       </div>

       {/* Matriz */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mb-8">
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex flex-col">
             <h2 className="text-red-500 font-bold mb-4 flex justify-between"><span>1. Fazer Agora</span> <span className="text-xs bg-red-500/10 px-2 py-0.5 rounded">{q1.length}</span></h2>
             <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">{q1.map(t => <TaskCard key={t.id} task={t} />)}</div>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex flex-col">
             <h2 className="text-blue-500 font-bold mb-4 flex justify-between"><span>2. Agendar</span> <span className="text-xs bg-blue-500/10 px-2 py-0.5 rounded">{q2.length}</span></h2>
             <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">{q2.map(t => <TaskCard key={t.id} task={t} />)}</div>
          </div>
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex flex-col">
             <h2 className="text-yellow-500 font-bold mb-4 flex justify-between"><span>3. Delegar</span> <span className="text-xs bg-yellow-500/10 px-2 py-0.5 rounded">{q3.length}</span></h2>
             <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">{q3.map(t => <TaskCard key={t.id} task={t} />)}</div>
          </div>
          <div className="bg-gray-500/5 border border-gray-500/20 rounded-2xl p-4 flex flex-col">
             <h2 className="text-gray-500 font-bold mb-4 flex justify-between"><span>4. Eliminar</span> <span className="text-xs bg-gray-500/10 px-2 py-0.5 rounded">{q4.length}</span></h2>
             <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">{q4.map(t => <TaskCard key={t.id} task={t} />)}</div>
          </div>
       </div>

       {/* Finalizadas */}
       <div className="bg-surface border border-white/5 rounded-2xl p-6 mt-6">
          <h2 className="text-emerald-500 font-bold mb-4 flex items-center gap-2">
             <CheckCircle className="w-5 h-5" /> Finalizadas Recentemente
          </h2>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-white/10 text-xs font-bold text-gray-500 uppercase">
                      <th className="p-3 whitespace-nowrap">Início</th>
                      <th className="p-3 whitespace-nowrap">Fim</th>
                      <th className="p-3 whitespace-nowrap text-brand-cyan">Tempo Gasto</th>
                      <th className="p-3 w-1/4">Título</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3 w-1/3">Descrição</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {finished.map(t => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors text-sm group">
                         <td className="p-3 text-gray-400 whitespace-nowrap">{t.started_at ? format(new Date(t.started_at), 'dd/MM/yy HH:mm') : '-'}</td>
                         <td className="p-3 text-emerald-500 font-medium whitespace-nowrap">{t.completed_at ? format(new Date(t.completed_at), 'dd/MM/yy HH:mm') : '-'}</td>
                         <td className="p-3 text-brand-cyan font-bold whitespace-nowrap">
                             {formatTimeSpent(t.started_at, t.completed_at, t.total_pause)}
                         </td>
                         <td className="p-3 text-white font-bold">{t.title}</td>
                         <td className="p-3 text-gray-300 whitespace-nowrap">{t.clients?.razao_social || <span className="text-gray-600 italic text-xs">Geral</span>}</td>
                         <td className="p-3 text-gray-500 truncate max-w-xs" title={t.description}>{t.description || '-'}</td>
                      </tr>
                   ))}
                   {finished.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-500 italic">Nenhuma tarefa finalizada encontrada.</td></tr>}
                </tbody>
             </table>
          </div>
       </div>

       {/* MODAL (Unificado) */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-surface rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-4 border-b border-white/10 flex justify-between items-center bg-surface">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      {currentTask ? <Edit2 className="w-4 h-4 text-brand-cyan"/> : <Plus className="w-4 h-4 text-brand-cyan"/>}
                      {currentTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
               </div>
               
               <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                  {/* Categoria e Título */}
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Categoria da Tarefa</label>
                        <select 
                            value={selectedTaskCategory} 
                            onChange={(e) => {
                                setSelectedTaskCategory(e.target.value);
                                setFormData({...formData, title: ''});
                            }} 
                            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"
                        >
                            <option value="">Selecione...</option>
                            {uniqueTaskCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Título (Padrão)</label>
                        <select 
                            value={formData.title} 
                            onChange={(e) => setFormData({...formData, title: e.target.value})} 
                            disabled={!selectedTaskCategory}
                            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan disabled:opacity-50"
                        >
                            <option value="">Selecione o Título...</option>
                            {filteredTitles.map(item => (
                                <option key={item.id} value={item.subcategoria_task}>{item.subcategoria_task}</option>
                            ))}
                        </select>
                      </div>
                  </div>
                  
                  {/* Cliente e Origem */}
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Cliente</label>
                        <select value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan">
                            <option value="">Geral (Sem cliente)</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Origem</label>
                        <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan">
                            <option value="">Selecione...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                  </div>

                  {/* Prioridade e Quadrante */}
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Prioridade</label>
                        <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan">
                            <option>Baixa</option>
                            <option>Média</option>
                            <option>Alta</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Quadrante</label>
                        <select value={formData.quadrant} onChange={(e) => setFormData({...formData, quadrant: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan">
                            <option value="1">1. Fazer Agora</option>
                            <option value="2">2. Agendar</option>
                            <option value="3">3. Delegar</option>
                            <option value="4">4. Eliminar</option>
                        </select>
                      </div>
                  </div>

                  {/* Data e Descrição */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Prazo</label>
                    <input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan [&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Descrição</label>
                    <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none resize-none" />
                  </div>

                  {/* Checklist */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                     <label className="text-xs font-bold text-brand-cyan uppercase mb-2 block">Checklist</label>
                     <div className="flex gap-2 mb-2">
                        <input type="text" value={checklistInput} onChange={(e) => setChecklistInput(e.target.value)} placeholder="Novo item..." className="flex-1 bg-background border border-white/10 rounded px-2 py-1 text-sm text-white" />
                        <button onClick={() => {
                           if(!checklistInput.trim()) return;
                           setFormData({...formData, checklist: [...(formData.checklist || []), {text: checklistInput, done: false}]});
                           setChecklistInput('');
                        }} className="bg-brand-cyan p-1.5 rounded text-white"><Plus className="w-4 h-4"/></button>
                     </div>
                     <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {formData.checklist?.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center bg-black/20 p-2 rounded">
                              <span className="text-sm text-gray-300">{item.text}</span>
                              <button onClick={() => {
                                 const updated = formData.checklist.filter((_, i) => i !== idx);
                                 setFormData({...formData, checklist: updated});
                              }} className="text-red-500"><X className="w-3 h-3"/></button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="p-4 border-t border-white/10 flex gap-3 bg-surface">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                  <button onClick={handleSave} className="flex-1 bg-brand-cyan hover:bg-cyan-600 py-2 rounded-lg text-white font-bold transition-colors shadow-lg">
                      {currentTask ? 'Salvar Alterações' : 'Criar Tarefa'}
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}