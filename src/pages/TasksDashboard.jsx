import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../supabaseClient'; // Conexão com o banco
import { 
  Search, Filter, Plus, MoreHorizontal, 
  Calendar, Clock, AlertCircle, CheckCircle, 
  Briefcase, Hash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TaskDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Estrutura inicial das colunas
  const [columns, setColumns] = useState({
    todo: { id: 'todo', title: 'A Fazer', items: [] },
    doing: { id: 'doing', title: 'Em Andamento', items: [] },
    done: { id: 'done', title: 'Concluído', items: [] },
  });

  // --- 1. BUSCAR TAREFAS (READ) ---
  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Busca tarefas + dados do cliente + dados da categoria
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          clients (razao_social),
          categories (name, color, icon)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Organiza as tarefas nas colunas corretas
      const newColumns = {
        todo: { id: 'todo', title: 'A Fazer', items: [] },
        doing: { id: 'doing', title: 'Em Andamento', items: [] },
        done: { id: 'done', title: 'Concluído', items: [] },
      };

      data.forEach(task => {
        if (newColumns[task.status]) {
          newColumns[task.status].items.push(task);
        } else {
          // Fallback para tarefas com status desconhecido (joga no todo)
          newColumns.todo.items.push(task);
        }
      });

      setColumns(newColumns);

    } catch (error) {
      console.error('Erro ao buscar tarefas:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // --- 2. ATUALIZAR STATUS (DRAG & DROP) ---
  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Se soltou no mesmo lugar, não faz nada
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Cópia das colunas para atualização otimista (visual)
    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const sourceItems = [...sourceCol.items];
    const destItems = [...destCol.items];

    const [removed] = sourceItems.splice(source.index, 1);
    
    // Atualiza o objeto removido com o novo status (para manter consistência local)
    const updatedTask = { ...removed, status: destination.droppableId };
    
    destItems.splice(destination.index, 0, updatedTask);

    setColumns({
      ...columns,
      [source.droppableId]: { ...sourceCol, items: sourceItems },
      [destination.droppableId]: { ...destCol, items: destItems },
    });

    // --- ATUALIZAÇÃO NO BANCO (SUPABASE) ---
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: destination.droppableId })
        .eq('id', removed.id);

      if (error) throw error;
      // Não precisamos recarregar tudo (fetchTasks) porque já atualizamos visualmente
    } catch (error) {
      console.error('Erro ao mover card:', error.message);
      alert('Erro ao salvar movimentação. Recarregue a página.');
      fetchTasks(); // Reverte em caso de erro
    }
  };

  // --- HELPERS VISUAIS ---
  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'Alta': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Média': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'Baixa': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  // Filtro de Busca (Client-side)
  // Filtra itens dentro das colunas sem perder a estrutura
  const getFilteredColumns = () => {
    if (!searchTerm) return columns;
    
    const filtered = {};
    Object.keys(columns).forEach(key => {
      filtered[key] = {
        ...columns[key],
        items: columns[key].items.filter(task => 
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.clients?.razao_social && task.clients.razao_social.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      };
    });
    return filtered;
  };

  const displayColumns = getFilteredColumns();

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      
      {/* HEADER DO DASHBOARD */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-surface/50 backdrop-blur-sm z-10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Dashboard
            <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
              Visão Kanban
            </span>
          </h1>
          <p className="text-gray-500 text-sm">Gerencie o fluxo de trabalho do escritório</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Barra de Busca */}
          <div className="flex items-center gap-3 bg-surface px-4 py-2.5 rounded-xl border border-white/10 focus-within:border-brand-cyan transition-colors w-64">
            <Search className="w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Filtrar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-white w-full outline-none text-sm placeholder-gray-600"
            />
          </div>

          <button className="p-2.5 bg-surface border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 transition-all">
            <Filter className="w-5 h-5" />
          </button>

          <button 
            onClick={() => navigate('/tarefas/adicionar')}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* ÁREA DE DRAG & DROP */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 animate-pulse">
            Carregando quadro...
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-6 min-w-[1000px]">
              
              {Object.entries(displayColumns).map(([columnId, column]) => (
                <div key={columnId} className="flex-1 flex flex-col min-w-[320px]">
                  
                  {/* Título da Coluna */}
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="font-bold text-gray-300 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full 
                        ${columnId === 'todo' ? 'bg-gray-400' : 
                          columnId === 'doing' ? 'bg-brand-cyan' : 'bg-emerald-500'}
                      `}></div>
                      {column.title}
                      <span className="text-xs text-gray-600 font-mono ml-1">
                        ({column.items.length})
                      </span>
                    </h2>
                  </div>

                  {/* Área Droppable */}
                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`
                          flex-1 rounded-2xl p-3 transition-colors overflow-y-auto custom-scrollbar border border-white/5
                          ${snapshot.isDraggingOver ? 'bg-white/5 border-brand-cyan/30' : 'bg-surface/30'}
                        `}
                      >
                        {column.items.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`
                                  bg-surface p-4 rounded-xl mb-3 border border-white/5 shadow-sm group
                                  hover:border-brand-cyan/30 hover:shadow-lg transition-all
                                  ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl z-50 border-brand-cyan' : ''}
                                `}
                                style={{ ...provided.draggableProps.style }}
                              >
                                {/* Tags Superiores (Categoria + Prioridade) */}
                                <div className="flex justify-between items-start mb-3">
                                  {item.categories ? (
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider text-white ${item.categories.color || 'bg-gray-600'}`}>
                                      {item.categories.name}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2 py-1 rounded uppercase bg-gray-700 text-gray-300">
                                      Geral
                                    </span>
                                  )}
                                  
                                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${getPriorityColor(item.priority)}`}>
                                    <AlertCircle className="w-3 h-3" />
                                    {item.priority}
                                  </div>
                                </div>

                                {/* Conteúdo */}
                                <h3 className="text-white font-bold text-sm mb-1 leading-snug">
                                  {item.title}
                                </h3>
                                
                                {item.clients && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                                    <Briefcase className="w-3 h-3" />
                                    <span className="truncate max-w-[200px]">{item.clients.razao_social}</span>
                                  </div>
                                )}

                                {/* Rodapé (Data e Avatar) */}
                                <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2">
                                  {item.due_date ? (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(item.due_date).toLocaleDateString('pt-BR')}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-600 italic">Sem prazo</div>
                                  )}

                                  <button className="text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </div>

                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                </div>
              ))}

            </div>
          </DragDropContext>
        )}

      </div>
    </div>
  );
}