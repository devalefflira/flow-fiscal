import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  ChevronLeft, Plus, CheckCircle, Trash2, Edit2, 
  Square, CheckSquare, X, ListTodo, MoreHorizontal, Calendar 
} from 'lucide-react';

export default function EisenhowerMatrix() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para o Modal de Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editChecklistInput, setEditChecklistInput] = useState('');

  // --- BUSCAR TAREFAS ---
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, clients(razao_social), categories(name, color)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  // --- LÓGICA DE ACTIONS ---
  
  // 1. Marcar item do checklist como feito
  const toggleChecklistItem = async (task, itemIndex) => {
    // Cria cópia do checklist
    const newChecklist = [...task.checklist];
    // Inverte o status do item clicado
    newChecklist[itemIndex].done = !newChecklist[itemIndex].done;

    // Atualização Otimista (Visual imediato)
    const updatedTasks = tasks.map(t => 
      t.id === task.id ? { ...t, checklist: newChecklist } : t
    );
    setTasks(updatedTasks);

    // Atualiza no Banco
    await supabase
      .from('tasks')
      .update({ checklist: newChecklist })
      .eq('id', task.id);
  };

  // 2. Concluir Tarefa (Só se 100% checklist)
  const completeTask = async (task) => {
    // Verifica se todos checklist estão true
    const allChecked = task.checklist ? task.checklist.every(item => item.done) : true;
    
    if (!allChecked) {
      alert("Você precisa completar todos os itens do checklist antes de finalizar a tarefa!");
      return;
    }

    if (window.confirm('Concluir esta tarefa?')) {
      await supabase.from('tasks').update({ status: 'done' }).eq('id', task.id);
      fetchTasks();
    }
  };

  // 3. Excluir Tarefa
  const deleteTask = async (id) => {
    if (window.confirm('Excluir permanentemente?')) {
      await supabase.from('tasks').delete().eq('id', id);
      fetchTasks();
    }
  };

  // 4. Salvar Edição
  const handleSaveEdit = async () => {
     if (!editingTask.title.trim()) return;
     
     const { id, clients, categories, ...payload } = editingTask; // Remove objetos relacionados
     
     await supabase.from('tasks').update({
       title: payload.title,
       description: payload.description,
       checklist: payload.checklist
     }).eq('id', id);

     setIsEditModalOpen(false);
     fetchTasks();
  };

  // --- RENDERIZADORES ---

  // Função para calcular progresso
  const getProgress = (checklist) => {
    if (!checklist || checklist.length === 0) return 0;
    const doneCount = checklist.filter(i => i.done).length;
    return Math.round((doneCount / checklist.length) * 100);
  };

  // Componente do Card de Tarefa
  const TaskCard = ({ task }) => {
    const progress = getProgress(task.checklist);
    const isReadyToComplete = progress === 100 || (!task.checklist || task.checklist.length === 0);

    return (
      <div className="bg-surface p-4 rounded-xl border border-white/5 shadow-sm group hover:border-brand-cyan/30 transition-all flex flex-col h-full">
        {/* Topo: Categoria e Ações */}
        <div className="flex justify-between items-start mb-2">
           <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${task.categories?.color || 'bg-gray-700'} text-white`}>
             {task.categories?.name || 'Geral'}
           </span>
           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingTask(task); setIsEditModalOpen(true); }} className="p-1 hover:text-brand-cyan"><Edit2 className="w-3 h-3" /></button>
              <button onClick={() => deleteTask(task.id)} className="p-1 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
           </div>
        </div>

        {/* Título e Cliente */}
        <h3 className="text-white font-bold text-sm mb-1">{task.title}</h3>
        {task.clients && (
           <p className="text-xs text-gray-400 mb-3 truncate">{task.clients.razao_social}</p>
        )}

        {/* Checklist */}
        <div className="mt-auto space-y-2">
          {/* Barra de Progresso */}
          {task.checklist && task.checklist.length > 0 && (
             <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-brand-cyan'}`} 
                  style={{ width: `${progress}%` }}
                ></div>
             </div>
          )}

          {/* Lista de Itens (Limitado a 3 para não estourar o card, ver mais no modal) */}
          <div className="space-y-1">
             {task.checklist?.map((item, idx) => (
                <div key={idx} 
                     onClick={() => toggleChecklistItem(task, idx)}
                     className="flex items-start gap-2 cursor-pointer group/item"
                >
                   {item.done 
                     ? <CheckSquare className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" /> 
                     : <Square className="w-3 h-3 text-gray-500 group-hover/item:text-brand-cyan mt-0.5 shrink-0" />
                   }
                   <span className={`text-xs ${item.done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                     {item.text}
                   </span>
                </div>
             ))}
          </div>

          {/* Botão Concluir */}
          <button 
             onClick={() => completeTask(task)}
             disabled={!isReadyToComplete}
             className={`w-full mt-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all
               ${isReadyToComplete 
                 ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 cursor-pointer' 
                 : 'bg-gray-700/20 text-gray-600 cursor-not-allowed'}
             `}
          >
             <CheckCircle className="w-3 h-3" /> Concluir
          </button>
        </div>
      </div>
    );
  };

  // Separação das Tarefas
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
         <button onClick={() => navigate('/tarefas/adicionar')} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg active:scale-95"><Plus className="w-5 h-5" /> Nova Tarefa</button>
       </div>

       {/* MATRIZ 2x2 */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mb-8">
          
          {/* Q1 */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex flex-col">
             <h2 className="text-red-500 font-bold mb-4 flex justify-between">
                <span>1. Fazer Agora</span> <span className="text-xs bg-red-500/10 px-2 py-0.5 rounded">{q1.length}</span>
             </h2>
             <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                {q1.map(t => <TaskCard key={t.id} task={t} />)}
                {q1.length === 0 && <div className="text-center text-gray-600 text-xs italic mt-10">Nada urgente.</div>}
             </div>
          </div>

          {/* Q2 */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex flex-col">
             <h2 className="text-blue-500 font-bold mb-4 flex justify-between">
                <span>2. Agendar</span> <span className="text-xs bg-blue-500/10 px-2 py-0.5 rounded">{q2.length}</span>
             </h2>
             <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                {q2.map(t => <TaskCard key={t.id} task={t} />)}
                {q2.length === 0 && <div className="text-center text-gray-600 text-xs italic mt-10">Agenda livre.</div>}
             </div>
          </div>

          {/* Q3 */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex flex-col">
             <h2 className="text-yellow-500 font-bold mb-4 flex justify-between">
                <span>3. Delegar</span> <span className="text-xs bg-yellow-500/10 px-2 py-0.5 rounded">{q3.length}</span>
             </h2>
             <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                {q3.map(t => <TaskCard key={t.id} task={t} />)}
             </div>
          </div>

          {/* Q4 */}
          <div className="bg-gray-500/5 border border-gray-500/20 rounded-2xl p-4 flex flex-col">
             <h2 className="text-gray-500 font-bold mb-4 flex justify-between">
                <span>4. Eliminar</span> <span className="text-xs bg-gray-500/10 px-2 py-0.5 rounded">{q4.length}</span>
             </h2>
             <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                {q4.map(t => <TaskCard key={t.id} task={t} />)}
             </div>
          </div>
       </div>

       {/* Lista de Concluídos */}
       <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <h2 className="text-emerald-500 font-bold mb-4 flex items-center gap-2">
             <CheckCircle className="w-5 h-5" /> Tarefas Finalizadas Recentemente
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {finished.map(t => (
                <div key={t.id} className="bg-black/20 p-3 rounded-lg border border-white/5 opacity-60 hover:opacity-100 transition-opacity">
                   <h3 className="text-gray-300 font-bold text-sm line-through">{t.title}</h3>
                   <span className="text-[10px] text-emerald-500">Concluído</span>
                </div>
             ))}
             {finished.length === 0 && <p className="text-gray-600 text-sm">Nenhuma tarefa finalizada ainda.</p>}
          </div>
       </div>

       {/* MODAL DE EDIÇÃO */}
       {isEditModalOpen && editingTask && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-surface rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2"><Edit2 className="w-4 h-4" /> Editar Tarefa</h2>
                  <button onClick={() => setIsEditModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
               </div>
               
               <div className="p-6 overflow-y-auto space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Título</label>
                    <input type="text" value={editingTask.title} onChange={(e) => setEditingTask({...editingTask, title: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Descrição</label>
                    <textarea rows="3" value={editingTask.description || ''} onChange={(e) => setEditingTask({...editingTask, description: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none resize-none" />
                  </div>

                  {/* Checklist no Modal */}
                  <div className="bg-white/5 p-4 rounded-xl">
                     <label className="text-xs font-bold text-brand-cyan uppercase mb-2 block">Gerenciar Checklist</label>
                     <div className="flex gap-2 mb-2">
                        <input type="text" value={editChecklistInput} onChange={(e) => setEditChecklistInput(e.target.value)} placeholder="Novo item..." className="flex-1 bg-background border border-white/10 rounded px-2 py-1 text-sm text-white" />
                        <button onClick={() => {
                           if(!editChecklistInput.trim()) return;
                           setEditingTask({...editingTask, checklist: [...(editingTask.checklist || []), {text: editChecklistInput, done: false}]});
                           setEditChecklistInput('');
                        }} className="bg-brand-cyan p-1.5 rounded text-white"><Plus className="w-4 h-4"/></button>
                     </div>
                     <div className="space-y-1">
                        {editingTask.checklist?.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center bg-black/20 p-2 rounded">
                              <span className="text-sm text-gray-300">{item.text}</span>
                              <button onClick={() => {
                                 const updated = editingTask.checklist.filter((_, i) => i !== idx);
                                 setEditingTask({...editingTask, checklist: updated});
                              }} className="text-red-500"><X className="w-3 h-3"/></button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="p-4 border-t border-white/10 flex gap-3">
                  <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 text-gray-400">Cancelar</button>
                  <button onClick={handleSaveEdit} className="flex-1 bg-brand-cyan py-2 rounded-lg text-white font-bold">Salvar Alterações</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}