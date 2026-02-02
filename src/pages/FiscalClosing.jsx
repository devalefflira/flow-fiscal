import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Calendar, RefreshCw, 
  CheckCircle, FileText, UserPlus, X, BoxSelect, AlertTriangle, Send
} from 'lucide-react';

export default function FiscalClosing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Controle de Data
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
  const [selectedCompetence, setSelectedCompetence] = useState(getCurrentMonth());

  // Definição das Colunas
  const columnsDef = {
    pending: { title: 'Pendente', color: 'bg-gray-500', items: [] },
    docs_received: { title: 'Docs Recebidos', color: 'bg-blue-500', items: [] },
    analysis: { title: 'Em Análise', color: 'bg-yellow-500', items: [] },
    taxes_generated: { title: 'Impostos Gerados', color: 'bg-purple-500', items: [] },
    done: { title: 'Concluído', color: 'bg-emerald-500', items: [] },
  };
  
  const [columns, setColumns] = useState(columnsDef);

  // --- ESTADOS DOS MODAIS ---
  
  // 1. Modal de Movimento (Entradas/Saídas)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [pendingMoveDrag, setPendingMoveDrag] = useState(null); 
  const [movementData, setMovementData] = useState({ entradas: false, saidas: false });

  // 2. Modal de Guias (Confirmação de Envio)
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [pendingGuideDrag, setPendingGuideDrag] = useState(null);

  // --- 1. BUSCAR DADOS ---
  const fetchData = async () => {
    setLoading(true);
    const compDate = `${selectedCompetence}-01`;

    try {
      const { data, error } = await supabase
        .from('fiscal_closings')
        .select(`*, clients(id, razao_social, regime)`)
        .eq('competence', compDate);

      if (error) throw error;
      distributeToColumns(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const distributeToColumns = (data) => {
    const newCols = JSON.parse(JSON.stringify(columnsDef));
    data.forEach(item => {
      if (newCols[item.status]) {
        newCols[item.status].items.push(item);
      }
    });
    setColumns(newCols);
  };

  useEffect(() => { fetchData(); }, [selectedCompetence]);

  // --- 2. SINCRONIZAR ---
  const handleSyncClients = async () => {
    setLoading(true);
    try {
      const allCards = Object.values(columns).flatMap(col => col.items);
      const { data: allClients } = await supabase.from('clients').select('id');
      if (!allClients?.length) return alert('Nenhum cliente cadastrado.');

      const existingIds = allCards.map(c => c.client_id || c.clients?.id);
      const missing = allClients.filter(c => !existingIds.includes(c.id));

      if (missing.length === 0) return alert('Tudo atualizado!');

      const newRows = missing.map(client => ({
        client_id: client.id,
        competence: `${selectedCompetence}-01`,
        status: 'pending'
      }));

      await supabase.from('fiscal_closings').insert(newRows);
      alert(`${missing.length} novos clientes adicionados!`);
      fetchData();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. LÓGICA DE MOVIMENTO (CORE) ---
  const onDragEnd = async (result) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const destStatus = destination.droppableId;

    // REGRA 1: Indo para 'Em Análise' -> Abre Modal de Movimento
    if (destStatus === 'analysis') {
      setPendingMoveDrag(result);
      setMovementData({ entradas: false, saidas: false }); 
      setIsMovementModalOpen(true);
      return; 
    }

    // REGRA 2: Indo para 'Concluído' -> Abre Modal de Guias
    if (destStatus === 'done') {
      setPendingGuideDrag(result);
      setIsGuideModalOpen(true);
      return;
    }

    // Se não caiu em regra especial, move direto
    executeMove(result);
  };

  // Função que executa o movimento (Visual + Banco)
  const executeMove = async (result, extraData = null) => {
    const { source, destination, draggableId } = result;
    
    // Atualização Otimista
    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const sourceItems = [...sourceCol.items];
    const destItems = [...destCol.items];
    const [movedItem] = sourceItems.splice(source.index, 1);
    
    const updatedItem = { 
      ...movedItem, 
      status: destination.droppableId,
      movement_data: extraData || movedItem.movement_data 
    };
    
    destItems.splice(destination.index, 0, updatedItem);

    setColumns({
      ...columns,
      [source.droppableId]: { ...sourceCol, items: sourceItems },
      [destination.droppableId]: { ...destCol, items: destItems },
    });

    // Atualiza no Banco
    const updatePayload = { status: destination.droppableId };
    if (extraData) updatePayload.movement_data = extraData;

    await supabase
      .from('fiscal_closings')
      .update(updatePayload)
      .eq('id', draggableId);
  };

  // --- HANDLERS DOS MODAIS ---
  
  const confirmMovement = () => {
    if (pendingMoveDrag) {
      executeMove(pendingMoveDrag, movementData);
      setPendingMoveDrag(null);
      setIsMovementModalOpen(false);
    }
  };

  const confirmGuides = () => {
    if (pendingGuideDrag) {
      executeMove(pendingGuideDrag); // Não precisa de dados extras, só move
      setPendingGuideDrag(null);
      setIsGuideModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-surface/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-6 h-6" />
           </button>
           <div>
             <h1 className="text-2xl font-bold text-white">Fechamento Fiscal</h1>
             <p className="text-gray-500 text-sm">Controle de apuração mensal</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-xl border border-white/10">
              <Calendar className="w-4 h-4 text-brand-cyan" />
              <input 
                type="month" 
                value={selectedCompetence}
                onChange={(e) => setSelectedCompetence(e.target.value)}
                className="bg-transparent text-white outline-none font-bold cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
              />
           </div>

           <button 
             onClick={handleSyncClients}
             title="Atualizar lista"
             className="bg-surface hover:bg-surfaceHover border border-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
           >
             {Object.values(columns).every(c => c.items.length === 0) ? <RefreshCw className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
             {Object.values(columns).every(c => c.items.length === 0) ? "Iniciar Mês" : "Atualizar"}
           </button>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        {loading ? (
           <div className="h-full flex items-center justify-center text-gray-500">Carregando...</div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
             <div className="flex h-full gap-6 min-w-[1200px]">
                {Object.entries(columns).map(([colId, col]) => (
                   <div key={colId} className="flex-1 flex flex-col min-w-[280px]">
                      <div className={`flex items-center gap-2 mb-4 px-2 pb-2 border-b-2 ${colId === 'done' ? 'border-emerald-500' : 'border-white/10'}`}>
                         <div className={`w-3 h-3 rounded-full ${col.color}`}></div>
                         <span className="font-bold text-gray-300">{col.title}</span>
                         <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">{col.items.length}</span>
                      </div>

                      <Droppable droppableId={colId}>
                         {(provided, snapshot) => (
                            <div
                               {...provided.droppableProps}
                               ref={provided.innerRef}
                               className={`flex-1 rounded-2xl p-2 transition-colors overflow-y-auto custom-scrollbar 
                                 ${snapshot.isDraggingOver ? 'bg-white/5 border border-brand-cyan/30' : 'bg-surface/20 border border-white/5'}
                               `}
                            >
                               {col.items.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                                     {(provided, snapshot) => (
                                        <div
                                           ref={provided.innerRef}
                                           {...provided.draggableProps}
                                           {...provided.dragHandleProps}
                                           className={`bg-surface p-4 rounded-xl mb-3 border border-white/5 shadow-sm hover:border-brand-cyan/40 hover:shadow-lg transition-all
                                              ${snapshot.isDragging ? 'rotate-2 scale-105 z-50 border-brand-cyan' : ''}
                                           `}
                                           style={provided.draggableProps.style}
                                        >
                                           <div className="flex justify-between items-start mb-2">
                                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded">
                                                 {item.clients?.regime || 'Indefinido'}
                                              </span>
                                              
                                              {/* Ícone de Movimento */}
                                              {item.movement_data && (item.movement_data.entradas || item.movement_data.saidas) && (
                                                <div className="flex gap-1" title="Movimento registrado">
                                                  {item.movement_data.entradas && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                                                  {item.movement_data.saidas && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                                </div>
                                              )}
                                           </div>
                                           
                                           <h3 className="text-white font-bold text-sm leading-snug mb-1">
                                              {item.clients?.razao_social}
                                           </h3>
                                           
                                           <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                                              <span className="text-[10px] text-gray-500">ID: #{item.id}</span>
                                              {colId === 'done' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
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

      {/* --- MODAL 1: REGISTRO DE MOVIMENTO --- */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
           <div className="bg-surface rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden p-6 space-y-6">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   <BoxSelect className="w-6 h-6 text-brand-cyan" /> Registro de Movimento
                 </h2>
                 <button onClick={() => {setIsMovementModalOpen(false); setPendingMoveDrag(null);}} className="text-gray-400 hover:text-white">
                   <X className="w-6 h-6" />
                 </button>
              </div>
              <p className="text-gray-400 text-sm">Selecione os tipos de movimento fiscal:</p>
              <div className="space-y-3">
                 <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${movementData.entradas ? 'bg-brand-cyan/20 border-brand-cyan' : 'bg-background border-white/10 hover:bg-white/5'}`}>
                    <input type="checkbox" className="w-5 h-5 accent-brand-cyan" checked={movementData.entradas} onChange={(e) => setMovementData({...movementData, entradas: e.target.checked})} />
                    <span className="text-white font-bold">Entradas (Compras)</span>
                 </label>
                 <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${movementData.saidas ? 'bg-brand-cyan/20 border-brand-cyan' : 'bg-background border-white/10 hover:bg-white/5'}`}>
                    <input type="checkbox" className="w-5 h-5 accent-brand-cyan" checked={movementData.saidas} onChange={(e) => setMovementData({...movementData, saidas: e.target.checked})} />
                    <span className="text-white font-bold">Saídas (Vendas)</span>
                 </label>
              </div>
              <button onClick={confirmMovement} className="w-full bg-brand-cyan hover:bg-cyan-600 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95">Confirmar e Mover</button>
           </div>
        </div>
      )}

      {/* --- MODAL 2: CONFIRMAÇÃO DE GUIAS (NOVO) --- */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
           <div className="bg-surface rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden p-6 space-y-6 relative">
              
              {/* Ícone de Fundo Decorativo */}
              <Send className="absolute top-4 right-4 text-white/5 w-24 h-24 -rotate-12" />

              <div className="flex justify-between items-center relative z-10">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   <AlertTriangle className="w-6 h-6 text-yellow-500" /> Confirmação
                 </h2>
              </div>

              <div className="relative z-10">
                <p className="text-white text-lg font-bold mb-2">As guias de impostos já foram enviadas?</p>
                <p className="text-gray-400 text-sm">
                  Ao confirmar, o fechamento desta empresa será marcado como <span className="text-emerald-500 font-bold">Concluído</span>.
                </p>
              </div>

              <div className="flex gap-3 relative z-10 pt-2">
                <button 
                  onClick={() => {setIsGuideModalOpen(false); setPendingGuideDrag(null);}} 
                  className="flex-1 py-3 bg-surface hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 font-bold transition-colors"
                >
                  Ainda não
                </button>
                <button 
                  onClick={confirmGuides}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
                >
                  Sim, enviadas!
                </button>
              </div>

           </div>
        </div>
      )}

    </div>
  );
}