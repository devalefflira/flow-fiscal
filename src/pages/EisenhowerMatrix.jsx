import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Trash2, Plus, Play, Pause, CheckCircle, 
  ChevronLeft, ArrowUp, ArrowDown, List, Zap, 
  ToggleLeft, ToggleRight, Calendar, X, AlignLeft
} from 'lucide-react';
import { format, intervalToDuration, formatDuration } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- COMPONENTES AUXILIARES ---

// 1. Conteúdo Visual do Card (Sem lógica de Drag and Drop)
const CardContent = ({ task, isRunning, isWaitingList, onMoveUp, onMoveDown, isFirst, isLast, onDelete, onTimerToggle, onStatusChange }) => {
    return (
        <div className={`bg-surface p-4 rounded-xl mb-3 border shadow-sm group hover:border-brand-cyan/50 transition-all relative w-full
            ${isWaitingList ? 'border-l-4 border-l-purple-500' : 'border-white/5'}
            ${isRunning ? 'border-l-4 border-l-brand-cyan' : ''}
        `}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded">
                    {task.categories?.name || 'Geral'}
                </span>
                
                {/* Ações da Lista de Espera */}
                {isWaitingList && (
                    <div className="flex gap-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMoveUp(task); }}
                            disabled={isFirst}
                            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onMoveDown(task); }}
                            disabled={isLast}
                            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ArrowDown className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className={`flex gap-2 transition-opacity ${isWaitingList ? '' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <h4 className="text-white font-bold text-sm leading-snug mb-3 break-words">{task.title}</h4>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1 text-gray-400 text-xs truncate max-w-[50%]">
                    <span className="truncate" title={task.clients?.razao_social}>
                        {task.clients?.razao_social || 'Sem Cliente'}
                    </span>
                </div>

                {/* Controles apenas se não for Lista de Espera */}
                {!isWaitingList && (
                    <div className="flex items-center gap-2">
                        {task.status !== 'done' && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onTimerToggle(task); }}
                                className={`p-1.5 rounded-lg transition-all flex items-center gap-1
                                    ${isRunning ? 'bg-yellow-500/10 text-yellow-500' : 'bg-brand-cyan/10 text-brand-cyan'}
                                `}
                            >
                                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'done'); }}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all"
                        >
                            <CheckCircle className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// 2. Wrapper Inteligente (Decide se é Draggable ou não)
const TaskCard = ({ task, index, onDelete, onStatusChange, onTimerToggle, isWaitingList, onMoveUp, onMoveDown, isFirst, isLast, isDraggable = true }) => {
  const isRunning = task.status === 'doing' && !task.is_paused;

  // Se NÃO for arrastável (Lista de Espera ou Foco), renderiza direto para evitar erro de Invariant
  if (!isDraggable) {
      return (
        <CardContent 
            task={task} isRunning={isRunning} isWaitingList={isWaitingList}
            onMoveUp={onMoveUp} onMoveDown={onMoveDown} isFirst={isFirst} isLast={isLast}
            onDelete={onDelete} onTimerToggle={onTimerToggle} onStatusChange={onStatusChange}
        />
      );
  }

  // Se for arrastável (Quadrantes 2, 3, 4), usa o Draggable
  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
          className={snapshot.isDragging ? 'rotate-2 opacity-90' : ''}
        >
            <CardContent 
                task={task} isRunning={isRunning} isWaitingList={isWaitingList}
                onMoveUp={onMoveUp} onMoveDown={onMoveDown} isFirst={isFirst} isLast={isLast}
                onDelete={onDelete} onTimerToggle={onTimerToggle} onStatusChange={onStatusChange}
            />
        </div>
      )}
    </Draggable>
  );
};

export default function EisenhowerMatrix() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [waitingList, setWaitingList] = useState([]);
  const [currentTask, setCurrentTask] = useState(null); 
  const [otherTasks, setOtherTasks] = useState([]); 
  const [recentTasks, setRecentTasks] = useState([]); 

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checklistInput, setChecklistInput] = useState('');
  const [selectedTaskCategory, setSelectedTaskCategory] = useState('');

  const [newTask, setNewTask] = useState({ 
      title: '', 
      category_id: '', 
      client_id: '',
      origin_id: '', 
      priority: 'Media', 
      quadrant: 'not_urgent_important', 
      deadline: '',
      description: '',
      checklist: [], 
      is_waiting_list: false 
  });
  
  // Auxiliares
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [taskCategories, setTaskCategories] = useState([]); 

  // --- BUSCA DE DADOS ---
  const fetchData = async () => {
    try {
      const { data: allActive, error: activeError } = await supabase
        .from('tasks')
        .select(`*, categories(name), clients(razao_social)`)
        .neq('status', 'done')
        .order('list_position', { ascending: true });

      if (activeError) throw activeError;

      const waiting = allActive.filter(t => t.is_waiting_list);
      const q1 = allActive.find(t => t.priority === 'urgent_important' && !t.is_waiting_list);
      const others = allActive.filter(t => t.id !== q1?.id && !t.is_waiting_list);

      setWaitingList(waiting);
      setCurrentTask(q1 || null);
      setOtherTasks(others);

      const { data: recent } = await supabase
        .from('tasks')
        .select(`*, categories(name), clients(razao_social)`)
        .eq('status', 'done')
        .order('completed_at', { ascending: false })
        .limit(10);
      setRecentTasks(recent || []);

      const { data: cats } = await supabase.from('categories').select('*'); 
      const { data: clis } = await supabase.from('clients').select('id, razao_social');
      const { data: tCats } = await supabase.from('task_categories').select('*'); 

      setCategories(cats || []);
      setClients(clis || []);
      setTaskCategories(tCats || []);

    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- AÇÕES ---

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (destination.droppableId === 'focus_area') {
        alert("O quadro 'Fazer Agora' é alimentado automaticamente pela Lista de Espera.");
        return; 
    }

    const newPriority = destination.droppableId;
    setOtherTasks(prev => prev.map(t => t.id.toString() === draggableId ? { ...t, priority: newPriority } : t));
    await supabase.from('tasks').update({ priority: newPriority }).eq('id', draggableId);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;

    let position = 0;
    if (newTask.is_waiting_list && waitingList.length > 0) {
        position = Math.max(...waitingList.map(t => t.list_position || 0)) + 1;
    }

    let finalPriority = newTask.quadrant; 
    let finalWaiting = newTask.is_waiting_list;

    if (finalPriority === 'urgent_important' && !finalWaiting && currentTask) {
        alert("Já existe uma tarefa em 'Fazer Agora'. Esta tarefa será enviada para a Lista de Espera.");
        finalWaiting = true;
        position = waitingList.length > 0 ? Math.max(...waitingList.map(t => t.list_position || 0)) + 1 : 1;
    }

    if (finalWaiting) finalPriority = 'waiting_list'; 

    const { error } = await supabase.from('tasks').insert([{
        title: newTask.title,
        priority: finalWaiting ? 'urgent_important' : finalPriority, 
        category_id: newTask.origin_id || null, 
        client_id: newTask.client_id || null,
        status: 'todo',
        is_waiting_list: finalWaiting,
        list_position: position,
        description: newTask.description
    }]);

    if (!error) {
        fetchData();
        setIsModalOpen(false);
        setNewTask({ 
            title: '', category_id: '', client_id: '', origin_id: '', 
            priority: 'Media', quadrant: 'not_urgent_important', 
            deadline: '', description: '', checklist: [], is_waiting_list: false 
        });
        setSelectedTaskCategory('');
        setChecklistInput('');
    }
  };

  const handleDelete = async (id) => {
      if (!confirm('Excluir?')) return;
      await supabase.from('tasks').delete().eq('id', id);
      fetchData();
  };

  const handleStatusChange = async (id, newStatus) => {
      if (newStatus === 'done') {
          const now = new Date().toISOString();
          await supabase.from('tasks').update({ status: 'done', completed_at: now }).eq('id', id);

          if (currentTask && currentTask.id === id && waitingList.length > 0) {
              const nextTask = waitingList[0];
              await supabase
                .from('tasks')
                .update({ is_waiting_list: false, priority: 'urgent_important', status: 'todo' })
                .eq('id', nextTask.id);
          }
          fetchData();
      }
  };

  const handleTimerToggle = async (task) => {
      const now = new Date().toISOString();
      let updates = {};
      if (task.status === 'todo') updates = { status: 'doing', started_at: now, is_paused: false };
      else if (task.status === 'doing') {
          if (task.is_paused) {
              const pauseStart = new Date(task.last_paused_at).getTime();
              const pauseEnd = new Date().getTime();
              const additionalPause = pauseEnd - pauseStart;
              updates = { is_paused: false, last_paused_at: null, total_pause: (task.total_pause || 0) + additionalPause };
          } else {
              updates = { is_paused: true, last_paused_at: now };
          }
      }
      await supabase.from('tasks').update(updates).eq('id', task.id);
      fetchData();
  };

  const handleMoveWaitList = async (task, direction) => {
      const currentIndex = waitingList.findIndex(t => t.id === task.id);
      if (currentIndex === -1) return;
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= waitingList.length) return;

      const targetTask = waitingList[targetIndex];
      const posA = task.list_position;
      const posB = targetTask.list_position;
      const finalPosA = posA === posB ? posA + 1 : posB;
      const finalPosB = posA === posB ? posA : posA;

      await supabase.from('tasks').update({ list_position: finalPosA }).eq('id', task.id);
      await supabase.from('tasks').update({ list_position: finalPosB }).eq('id', targetTask.id);
      fetchData();
  };

  const addChecklistItem = () => {
      if (checklistInput.trim()) {
          setNewTask(prev => ({ ...prev, checklist: [...prev.checklist, checklistInput] }));
          setChecklistInput('');
      }
  };

  const removeChecklistItem = (idx) => {
      setNewTask(prev => ({ ...prev, checklist: prev.checklist.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="min-h-screen bg-background p-8 font-sans flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Matriz de Eisenhower</h1>
              <p className="text-gray-500 text-sm">Fluxo de Foco Único</p>
            </div>
        </div>
        
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-cyan hover:bg-cyan-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
            <Plus className="w-5 h-5" /> Nova Tarefa
        </button>
      </div>

      <div className="flex gap-6 flex-1 h-full min-h-0">
          
          {/* COLUNA ESQUERDA: FOCO & LISTA DE ESPERA */}
          <div className="w-1/3 flex flex-col gap-6 h-full">
              
              {/* 1. QUADRO FOCO (Fazer Agora) - NO TOPO */}
              <div className="w-full bg-gradient-to-br from-brand-cyan/20 to-surface border border-brand-cyan/50 rounded-2xl flex flex-col shadow-[0_0_20px_rgba(8,145,178,0.2)] shrink-0">
                  <div className="p-3 border-b border-brand-cyan/30 flex justify-between items-center">
                      <h3 className="font-bold text-brand-cyan flex items-center gap-2">
                          <Zap className="w-4 h-4 fill-brand-cyan" /> 1. Fazer Agora (Foco)
                      </h3>
                  </div>
                  <div className="p-4 w-full">
                      {currentTask ? (
                          <TaskCard 
                              task={currentTask} index={0} 
                              isDraggable={false} 
                              onDelete={handleDelete} 
                              onStatusChange={handleStatusChange} 
                              onTimerToggle={handleTimerToggle}
                          />
                      ) : (
                          <div className="text-gray-500 text-sm italic text-center py-4 border border-dashed border-white/10 rounded-xl">
                              {waitingList.length > 0 ? "Conclua a tarefa atual ou mova da lista de espera." : "Nada para fazer agora."}
                          </div>
                      )}
                  </div>
              </div>

              {/* 2. LISTA DE ESPERA - ABAIXO (OCUPANDO O RESTO) */}
              <div className="flex-1 bg-surface/30 rounded-2xl border border-purple-500/30 flex flex-col overflow-hidden relative min-h-0">
                  <div className="p-3 bg-purple-500/10 border-b border-purple-500/20 flex justify-between items-center shrink-0">
                      <h3 className="font-bold text-purple-300 flex items-center gap-2">
                          <List className="w-4 h-4" /> Lista de Espera
                      </h3>
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">{waitingList.length}</span>
                  </div>
                  <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-2">
                      {waitingList.map((task, idx) => (
                          <TaskCard 
                              key={task.id} task={task} index={idx}
                              isDraggable={false} 
                              isWaitingList={true}
                              isFirst={idx === 0}
                              isLast={idx === waitingList.length - 1}
                              onDelete={handleDelete}
                              onMoveUp={() => handleMoveWaitList(task, 'up')}
                              onMoveDown={() => handleMoveWaitList(task, 'down')}
                          />
                      ))}
                      {waitingList.length === 0 && (
                          <div className="text-center text-gray-600 py-10 text-sm">Lista vazia.</div>
                      )}
                  </div>
              </div>

          </div>

          {/* COLUNA CENTRAL: QUADRANTES 2, 3, 4 */}
          <div className="flex-1 flex flex-col gap-4 h-full">
             <DragDropContext onDragEnd={handleDragEnd}>
                 {/* Q2 */}
                 <div className="flex-1 bg-surface/50 rounded-2xl border border-t-blue-500 border-t-4 flex flex-col overflow-hidden">
                     <div className="p-2 border-b border-white/5 bg-blue-500/5 flex justify-between">
                         <h3 className="font-bold text-white text-sm">2. Agendar</h3>
                         <span className="text-xs text-gray-400">{otherTasks.filter(t => t.priority === 'not_urgent_important').length}</span>
                     </div>
                     <Droppable droppableId="not_urgent_important">
                         {(provided) => (
                             <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                                 {otherTasks.filter(t => t.priority === 'not_urgent_important').map((t, i) => (
                                     <TaskCard key={t.id} task={t} index={i} onDelete={handleDelete} onStatusChange={handleStatusChange} onTimerToggle={handleTimerToggle} />
                                 ))}
                                 {provided.placeholder}
                             </div>
                         )}
                     </Droppable>
                 </div>

                 {/* Q3 e Q4 lado a lado */}
                 <div className="flex-1 flex gap-4 min-h-0">
                     <div className="flex-1 bg-surface/50 rounded-2xl border border-t-yellow-500 border-t-4 flex flex-col overflow-hidden">
                         <div className="p-2 border-b border-white/5 bg-yellow-500/5 flex justify-between">
                             <h3 className="font-bold text-white text-sm">3. Delegar</h3>
                             <span className="text-xs text-gray-400">{otherTasks.filter(t => t.priority === 'urgent_not_important').length}</span>
                         </div>
                         <Droppable droppableId="urgent_not_important">
                             {(provided) => (
                                 <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                                     {otherTasks.filter(t => t.priority === 'urgent_not_important').map((t, i) => (
                                         <TaskCard key={t.id} task={t} index={i} onDelete={handleDelete} onStatusChange={handleStatusChange} onTimerToggle={handleTimerToggle} />
                                     ))}
                                     {provided.placeholder}
                                 </div>
                             )}
                         </Droppable>
                     </div>

                     <div className="flex-1 bg-surface/50 rounded-2xl border border-t-gray-500 border-t-4 flex flex-col overflow-hidden">
                         <div className="p-2 border-b border-white/5 bg-gray-500/5 flex justify-between">
                             <h3 className="font-bold text-white text-sm">4. Eliminar</h3>
                             <span className="text-xs text-gray-400">{otherTasks.filter(t => t.priority === 'not_urgent_not_important').length}</span>
                         </div>
                         <Droppable droppableId="not_urgent_not_important">
                             {(provided) => (
                                 <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                                     {otherTasks.filter(t => t.priority === 'not_urgent_not_important').map((t, i) => (
                                         <TaskCard key={t.id} task={t} index={i} onDelete={handleDelete} onStatusChange={handleStatusChange} onTimerToggle={handleTimerToggle} />
                                     ))}
                                     {provided.placeholder}
                                 </div>
                             )}
                         </Droppable>
                     </div>
                 </div>
             </DragDropContext>
          </div>

          {/* COLUNA DIREITA: FINALIZADAS */}
          <div className="w-64 bg-surface rounded-2xl border border-white/5 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-surface">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> Finalizadas
                  </h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                  {recentTasks.map(task => (
                      <div key={task.id} className="bg-black/20 p-2 rounded border border-white/5 opacity-60 hover:opacity-100 transition-opacity">
                          <h4 className="text-gray-400 font-medium text-xs">{task.title}</h4>
                          <div className="flex justify-between items-center mt-1 text-[9px] text-gray-600">
                              <span>{task.clients?.razao_social?.slice(0, 15) || '-'}</span>
                              <span>{task.completed_at ? format(new Date(task.completed_at), 'HH:mm') : '-'}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

      </div>

      {/* MODAL NOVA TAREFA */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-surface rounded-2xl w-full max-w-2xl border border-white/10 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                      <h2 className="text-xl font-bold text-white">Nova Tarefa</h2>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
                  </div>
                  
                  <form onSubmit={handleCreateTask} className="space-y-4">
                      
                      {/* LINHA 1: Categoria e Título Padrão (AGRUPADO) */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Categoria da Tarefa</label>
                              <select 
                                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm outline-none"
                                  value={selectedTaskCategory}
                                  onChange={e => {
                                      setSelectedTaskCategory(e.target.value);
                                      setNewTask(prev => ({...prev, title: ''})); 
                                  }}
                              >
                                  <option value="">Selecione...</option>
                                  {[...new Set(taskCategories.map(c => c.categoria_task))].map(cat => (
                                      <option key={cat} value={cat} className="bg-surface">{cat}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Título (Padrão)</label>
                              <select 
                                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm outline-none disabled:opacity-50"
                                  value={newTask.title}
                                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                                  disabled={!selectedTaskCategory}
                              >
                                  <option value="">Selecione o Título...</option>
                                  {taskCategories
                                      .filter(c => c.categoria_task === selectedTaskCategory)
                                      .map(c => (
                                          <option key={c.id} value={c.subcategoria_task} className="bg-surface">{c.subcategoria_task}</option>
                                      ))
                                  }
                              </select>
                          </div>
                      </div>

                      {/* LINHA 2: Cliente e Origem */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Cliente</label>
                              <select 
                                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm outline-none"
                                  value={newTask.client_id}
                                  onChange={e => setNewTask({...newTask, client_id: e.target.value})}
                              >
                                  <option value="">Geral (Sem cliente)</option>
                                  {clients.map(c => <option key={c.id} value={c.id} className="bg-surface">{c.razao_social}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Origem</label>
                              <select 
                                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm outline-none"
                                  value={newTask.origin_id}
                                  onChange={e => setNewTask({...newTask, origin_id: e.target.value})}
                              >
                                  <option value="">Selecione...</option>
                                  {categories.map(c => <option key={c.id} value={c.id} className="bg-surface">{c.name}</option>)}
                              </select>
                          </div>
                      </div>

                      {/* LINHA 3: Prioridade e Quadrante (Com Toggle) */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Prioridade</label>
                              <select 
                                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm outline-none"
                                  value={newTask.priority}
                                  onChange={e => setNewTask({...newTask, priority: e.target.value})}
                              >
                                  <option value="Baixa">Baixa</option>
                                  <option value="Media">Média</option>
                                  <option value="Alta">Alta</option>
                              </select>
                          </div>
                          
                          <div className="flex flex-col">
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex justify-between">
                                  <span>Quadrante</span>
                                  <div className="flex items-center gap-1 cursor-pointer" onClick={() => setNewTask(p => ({...p, is_waiting_list: !p.is_waiting_list}))}>
                                      <span className={`text-[10px] ${newTask.is_waiting_list ? 'text-purple-400' : 'text-gray-500'}`}>Lista de Espera</span>
                                      {newTask.is_waiting_list ? <ToggleRight className="w-5 h-5 text-purple-500"/> : <ToggleLeft className="w-5 h-5 text-gray-600"/>}
                                  </div>
                              </label>
                              <select 
                                  className={`w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm outline-none transition-opacity ${newTask.is_waiting_list ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  value={newTask.quadrant}
                                  onChange={e => setNewTask({...newTask, quadrant: e.target.value})}
                                  disabled={newTask.is_waiting_list}
                              >
                                  {newTask.is_waiting_list ? <option>Enviado para Lista de Espera...</option> : (
                                      <>
                                        <option value="urgent_important">1. Fazer Agora</option>
                                        <option value="not_urgent_important">2. Agendar</option>
                                        <option value="urgent_not_important">3. Delegar</option>
                                        <option value="not_urgent_not_important">4. Eliminar</option>
                                      </>
                                  )}
                              </select>
                          </div>
                      </div>

                      {/* LINHA 4: Prazo */}
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Prazo</label>
                          <input 
                              type="date"
                              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm outline-none [&::-webkit-calendar-picker-indicator]:invert"
                              value={newTask.deadline}
                              onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                          />
                      </div>

                      {/* LINHA 5: Descrição */}
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição</label>
                          <textarea 
                              rows="3"
                              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm outline-none resize-none"
                              value={newTask.description}
                              onChange={e => setNewTask({...newTask, description: e.target.value})}
                          ></textarea>
                      </div>

                      {/* LINHA 6: Checklist */}
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Checklist</label>
                          <div className="flex gap-2 mb-2">
                              <input 
                                  type="text"
                                  placeholder="Novo item..."
                                  className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm outline-none"
                                  value={checklistInput}
                                  onChange={e => setChecklistInput(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                              />
                              <button type="button" onClick={addChecklistItem} className="bg-brand-cyan/20 text-brand-cyan p-2 rounded-lg hover:bg-brand-cyan hover:text-white transition-colors"><Plus className="w-5 h-5"/></button>
                          </div>
                          <div className="space-y-1">
                              {newTask.checklist.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded text-xs text-gray-300">
                                      <span>{item}</span>
                                      <button type="button" onClick={() => removeChecklistItem(idx)} className="text-gray-500 hover:text-red-400"><X className="w-3 h-3"/></button>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                          <button type="submit" className="flex-1 bg-brand-cyan hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg transition-colors">Criar Tarefa</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
}