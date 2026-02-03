import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Calendar, RefreshCw, CheckCircle, 
  Server, BoxSelect, AlertTriangle, Send, 
  ArrowRight, ArrowLeft, RotateCcw, XCircle, PauseCircle
} from 'lucide-react';

export default function FiscalClosing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Controle de Data
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
  const [selectedCompetence, setSelectedCompetence] = useState(getCurrentMonth());

  // Estado de Seleção do Card
  const [selectedCardId, setSelectedCardId] = useState(null);

  // Definição das Colunas
  const columnsDef = {
    pending: { id: 'pending', title: 'Pendente', color: 'bg-gray-500', items: [] },
    docs_received: { id: 'docs_received', title: 'Importação', color: 'bg-blue-500', items: [] },
    analysis: { id: 'analysis', title: 'Apuração', color: 'bg-yellow-500', items: [] },
    taxes_generated: { id: 'taxes_generated', title: 'Guias Geradas', color: 'bg-purple-500', items: [] },
    done: { id: 'done', title: 'Fechamento Finalizado', color: 'bg-emerald-500', items: [] },
  };

  const columnOrder = ['pending', 'docs_received', 'analysis', 'taxes_generated', 'done'];
  const [columns, setColumns] = useState(columnsDef);

  // --- MODAIS DE AVANÇO (FORWARD) ---
  const [modalImportOpen, setModalImportOpen] = useState(false);
  const [modalApurationOpen, setModalApurationOpen] = useState(false);
  const [modalClosingOpen, setModalClosingOpen] = useState(false);
  
  const [apurationData, setApurationData] = useState({ entradas: false, saidas: false });

  // Novo estado para o erro da importação manual
  const [importError, setImportError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Opções de Erro (Padronização)
  const errorOptions = [
    "Sistema não importou",
    "Sistema importou parcialmente",
    "Sistema importou canceladas com valores",
    "Sistema importou duplicadas",
    "Importou parcialmente e canceladas com valores",
    "Importou parcialmente e duplicadas",
    "Importou parcialmente, canceladas com valores e duplicadas",
    "Outro motivo não especificado anteriormente"
  ];

  // --- MODAIS DE RETORNO (REVERSE) ---
  const [modalReverseClosingOpen, setModalReverseClosingOpen] = useState(false);   // Done -> Taxes
  const [modalReverseGuidesOpen, setModalReverseGuidesOpen] = useState(false);     // Taxes -> Analysis
  const [modalReverseAnalysisOpen, setModalReverseAnalysisOpen] = useState(false); // Analysis -> Docs
  const [modalReverseImportOpen, setModalReverseImportOpen] = useState(false);     // Docs -> Pending

  // Tarefa em foco (para qualquer modal)
  const [activeTask, setActiveTask] = useState(null);

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

  // --- 2. CONTROLE DE NAVEGAÇÃO ---

  const handleMove = async (task, direction) => {
    const currentIndex = columnOrder.indexOf(task.status);
    if (currentIndex === -1) return;

    let nextIndex;
    if (direction === 'next') nextIndex = currentIndex + 1;
    else nextIndex = currentIndex - 1;

    if (nextIndex < 0 || nextIndex >= columnOrder.length) return;
    const nextStatus = columnOrder[nextIndex];

    setActiveTask(task);

    // >>> GATILHOS DE AVANÇO (DIREITA) <<<
    if (direction === 'next') {
      if (task.status === 'pending' && nextStatus === 'docs_received') {
        const startedAt = new Date().toISOString();
        await executeUpdate(task, nextStatus, { started_at: startedAt });
        return;
      }
      if (task.status === 'docs_received' && nextStatus === 'analysis') {
        setImportError('');
        setShowManualInput(false);
        setModalImportOpen(true);
        return;
      }
      if (task.status === 'analysis' && nextStatus === 'taxes_generated') {
        setApurationData({ entradas: false, saidas: false });
        setModalApurationOpen(true);
        return;
      }
      if (task.status === 'taxes_generated' && nextStatus === 'done') {
        setModalClosingOpen(true);
        return;
      }
    }

    // >>> GATILHOS DE RETORNO (ESQUERDA) <<<
    if (direction === 'prev') {
      if (task.status === 'done' && nextStatus === 'taxes_generated') {
        setModalReverseClosingOpen(true);
        return;
      }
      if (task.status === 'taxes_generated' && nextStatus === 'analysis') {
        setModalReverseGuidesOpen(true);
        return;
      }
      if (task.status === 'analysis' && nextStatus === 'docs_received') {
        setModalReverseAnalysisOpen(true);
        return;
      }
      if (task.status === 'docs_received' && nextStatus === 'pending') {
        setModalReverseImportOpen(true);
        return;
      }
    }

    await executeUpdate(task, nextStatus);
  };

  const executeUpdate = async (task, newStatus, extraFields = {}) => {
    // 1. Atualização Visual Otimista (Muda na tela instantaneamente)
    const prevStatus = task.status;
    const updatedTask = { ...task, status: newStatus, ...extraFields };

    const sourceItems = columns[prevStatus].items.filter(i => i.id !== task.id);
    const destItems = [...columns[newStatus].items, updatedTask];

    setColumns(prev => ({
      ...prev,
      [prevStatus]: { ...prev[prevStatus], items: sourceItems },
      [newStatus]: { ...prev[newStatus], items: destItems }
    }));

    setSelectedCardId(null);
    setActiveTask(null);

    // 2. Persistência no Banco (Correção Crítica Aqui)
    try {
      const { error } = await supabase
        .from('fiscal_closings')
        .update({ status: newStatus, ...extraFields })
        .eq('id', task.id);

      if (error) throw error; // <--- AGORA O ERRO É LANÇADO SE EXISTIR
      
      console.log("Salvo com sucesso no banco:", newStatus);

    } catch (error) {
      console.error("Erro CRÍTICO ao salvar:", error);
      alert(`Erro ao salvar alteração: ${error.message || error.details || 'Verifique o console'}`);
      fetchData(); // Reverte visualmente se der erro
    }
  };

  // --- HANDLERS (CONFIRMAÇÕES) ---

  const confirmImport = (type) => { 
    if (type === 'Manual' && !importError) {
        alert("Por favor, selecione o erro ocorrido.");
        return;
    }

    const newData = { ...(activeTask.movement_data || {}), import_type: type };
    const extraData = { 
        movement_data: newData,
        import_type: type === 'Automática' ? 'automatic' : 'manual',
        import_error_details: type === 'Manual' ? importError : null
    };

    executeUpdate(activeTask, 'analysis', extraData);
    setModalImportOpen(false);
  };

  const confirmApuration = () => {
    const newData = { ...(activeTask.movement_data || {}), ...apurationData };
    executeUpdate(activeTask, 'taxes_generated', { movement_data: newData });
    setModalApurationOpen(false);
  };

  const confirmClosing = () => {
    // Garante que o status 'done' e a data sejam enviados
    executeUpdate(activeTask, 'done', { completed_at: new Date().toISOString() });
    setModalClosingOpen(false);
  };

  const confirmReverseClosing = () => {
    executeUpdate(activeTask, 'taxes_generated', { completed_at: null });
    setModalReverseClosingOpen(false);
  };

  const confirmReverseGuides = () => {
    const currentData = activeTask.movement_data || {};
    const newData = { ...currentData };
    delete newData.entradas;
    delete newData.saidas;
    executeUpdate(activeTask, 'analysis', { movement_data: newData });
    setModalReverseGuidesOpen(false);
  };

  const confirmReverseAnalysis = () => {
    executeUpdate(activeTask, 'docs_received', { started_at: null });
    setModalReverseAnalysisOpen(false);
  };

  const confirmReverseImport = () => {
    executeUpdate(activeTask, 'pending');
    setModalReverseImportOpen(false);
  };

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
      fetchData();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
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
           <button onClick={handleSyncClients} className="bg-surface hover:bg-surfaceHover border border-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
             <RefreshCw className="w-4 h-4" /> Atualizar
           </button>
        </div>
      </div>

      {/* BOARD */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        {loading ? (
           <div className="h-full flex items-center justify-center text-gray-500">Carregando...</div>
        ) : (
          <div className="flex h-full gap-6 min-w-[1400px]">
            {Object.entries(columns).map(([colKey, col]) => (
              <div key={colKey} className="flex-1 flex flex-col min-w-[280px]">
                <div className={`flex items-center gap-2 mb-4 px-2 pb-2 border-b-2 ${colKey === 'done' ? 'border-emerald-500' : 'border-white/10'}`}>
                    <div className={`w-3 h-3 rounded-full ${col.color}`}></div>
                    <span className="font-bold text-gray-300">{col.title}</span>
                    <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">{col.items.length}</span>
                </div>

                <div className="flex-1 rounded-2xl p-2 bg-surface/20 border border-white/5 overflow-y-auto custom-scrollbar">
                  {col.items.map((item) => {
                    const isSelected = selectedCardId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedCardId(isSelected ? null : item.id)}
                        className={`relative bg-surface p-4 rounded-xl mb-3 border transition-all cursor-pointer
                          ${isSelected ? 'border-brand-cyan ring-1 ring-brand-cyan/50 shadow-lg scale-[1.02] z-10' : 'border-white/5 hover:border-white/20'}
                        `}
                      >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded">
                                {item.clients?.regime || 'Indefinido'}
                            </span>
                            {item.movement_data && (
                                <div className="flex gap-1">
                                    {item.movement_data.import_type && (
                                        <span className={`text-[9px] px-1 rounded ${item.movement_data.import_type === 'Manual' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                            {item.movement_data.import_type === 'Automática' ? 'AUTO' : 'MAN'}
                                        </span>
                                    )}
                                    {(item.movement_data.entradas || item.movement_data.saidas) && (
                                        <div className="flex gap-1">
                                            {item.movement_data.entradas && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Entradas"></span>}
                                            {item.movement_data.saidas && <span className="w-2 h-2 rounded-full bg-red-500" title="Saídas"></span>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <h3 className="text-white font-bold text-sm leading-snug mb-3">{item.clients?.razao_social}</h3>

                        {colKey === 'done' && (
                            <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                                <div className="flex justify-between text-[10px] text-gray-400">
                                    <span>Início:</span>
                                    <span className="text-gray-300">{item.started_at ? new Date(item.started_at).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '-'}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-emerald-400 font-bold">
                                    <span>Fim:</span>
                                    <span>{item.completed_at ? new Date(item.completed_at).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '-'}</span>
                                </div>
                            </div>
                        )}

                        {/* --- AÇÕES DE NAVEGAÇÃO --- */}
                        {isSelected && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-xl flex items-center justify-between px-2 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                
                                {/* SETA ESQUERDA = VOLTAR (PREV) */}
                                {colKey !== 'pending' ? (
                                    <button 
                                        onClick={() => handleMove(item, 'prev')}
                                        className="p-2 bg-red-500/20 hover:bg-red-500 rounded-full text-white border border-red-500/50 transition-all"
                                        title="Voltar etapa"
                                    >
                                        <ArrowLeft className="w-6 h-6" />
                                    </button>
                                ) : <div />}

                                <button onClick={() => setSelectedCardId(null)} className="text-xs text-gray-400 hover:text-white mt-12">Fechar</button>

                                {/* SETA DIREITA = AVANÇAR (NEXT) */}
                                {colKey !== 'done' ? (
                                    <button 
                                        onClick={() => handleMove(item, 'next')}
                                        className="p-2 bg-brand-cyan hover:bg-cyan-600 rounded-full text-white shadow-lg shadow-cyan-500/20 transition-all"
                                        title="Avançar etapa"
                                    >
                                        <ArrowRight className="w-6 h-6" />
                                    </button>
                                ) : <div />}
                            </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAIS DE AVANÇO (FORWARD) --- */}

      {modalImportOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl w-full max-w-sm border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" /> Como foi importado?
            </h2>
            
            {!showManualInput && (
                <div className="space-y-3">
                  <button onClick={() => confirmImport('Automática')} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl text-left border border-white/10">
                    <span className="block text-brand-cyan font-bold">Automática</span>
                  </button>
                  <button onClick={() => setShowManualInput(true)} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl text-left border border-white/10">
                    <span className="block text-yellow-500 font-bold">Manual</span>
                  </button>
                </div>
            )}

            {showManualInput && (
                <div className="space-y-4 animate-fade-in">
                    <div>
                        <label className="text-xs font-bold text-red-400 uppercase mb-2 block">Selecione o erro ocorrido</label>
                        <select
                            value={importError}
                            onChange={(e) => setImportError(e.target.value)}
                            className="w-full bg-black/20 border border-red-500/30 rounded-lg p-3 text-white text-sm outline-none focus:border-red-500"
                        >
                            <option value="">Selecione uma opção...</option>
                            {errorOptions.map((opt, index) => (
                                <option key={index} value={opt} className="bg-surface text-white">{opt}</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={() => confirmImport('Manual')} 
                        disabled={!importError}
                        className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-bold transition-colors"
                    >
                        Salvar e Continuar
                    </button>
                    <button onClick={() => setShowManualInput(false)} className="w-full text-gray-500 text-sm hover:text-white">Voltar</button>
                </div>
            )}

            {!showManualInput && (
                <button onClick={() => setModalImportOpen(false)} className="mt-4 w-full text-gray-500 text-sm">Cancelar</button>
            )}
          </div>
        </div>
      )}

      {modalApurationOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl w-full max-w-sm border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BoxSelect className="w-5 h-5 text-yellow-500" /> O que foi apurado?
            </h2>
            <div className="space-y-3 mb-6">
                 <label className="flex items-center gap-3 p-4 rounded-xl border border-white/10 cursor-pointer hover:bg-white/5">
                    <input type="checkbox" className="w-5 h-5 accent-brand-cyan" checked={apurationData.entradas} onChange={(e) => setApurationData({...apurationData, entradas: e.target.checked})} />
                    <span className="text-white font-bold">Entradas</span>
                 </label>
                 <label className="flex items-center gap-3 p-4 rounded-xl border border-white/10 cursor-pointer hover:bg-white/5">
                    <input type="checkbox" className="w-5 h-5 accent-brand-cyan" checked={apurationData.saidas} onChange={(e) => setApurationData({...apurationData, saidas: e.target.checked})} />
                    <span className="text-white font-bold">Saídas</span>
                 </label>
            </div>
            <button onClick={confirmApuration} disabled={!apurationData.entradas && !apurationData.saidas} className="w-full bg-brand-cyan disabled:bg-gray-600 text-white font-bold py-3 rounded-xl">Confirmar</button>
            <button onClick={() => setModalApurationOpen(false)} className="mt-3 w-full text-gray-500 text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {modalClosingOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
           <div className="bg-surface rounded-2xl w-full max-w-sm border border-white/10 p-6 relative overflow-hidden">
              <Send className="absolute top-4 right-4 text-white/5 w-24 h-24 -rotate-12" />
              <div className="relative z-10">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                   <AlertTriangle className="w-6 h-6 text-emerald-500" /> Finalizar?
                </h2>
                <p className="text-white text-lg font-bold mb-6">As guias foram enviadas?</p>
                <div className="flex gap-3">
                    <button onClick={() => setModalClosingOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold">Voltar</button>
                    <button onClick={confirmClosing} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold">Sim, enviadas</button>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAIS DE RETORNO (REVERSE) --- */}

      {modalReverseClosingOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl w-full max-w-sm border border-red-500/30 p-6">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" /> Cancelar Fechamento?
            </h2>
            <p className="text-gray-400 text-sm mb-6">Isso apagará a data de finalização. Deseja continuar?</p>
            <div className="flex gap-3">
              <button onClick={() => setModalReverseClosingOpen(false)} className="flex-1 py-2 bg-white/5 rounded-lg text-gray-300">Não</button>
              <button onClick={confirmReverseClosing} className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold">Sim, cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalReverseGuidesOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl w-full max-w-sm border border-yellow-500/30 p-6">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-yellow-500" /> Reapurar Movimento?
            </h2>
            <p className="text-gray-400 text-sm mb-6">Isso removerá as definições de Entradas/Saídas. Deseja reapurar?</p>
            <div className="flex gap-3">
              <button onClick={() => setModalReverseGuidesOpen(false)} className="flex-1 py-2 bg-white/5 rounded-lg text-gray-300">Não</button>
              <button onClick={confirmReverseGuides} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white font-bold">Sim, reapurar</button>
            </div>
          </div>
        </div>
      )}

      {modalReverseAnalysisOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl w-full max-w-sm border border-blue-500/30 p-6">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-500" /> Refazer Conferência?
            </h2>
            <p className="text-gray-400 text-sm mb-6">Isso apagará a data de início do processo. Confirmar?</p>
            <div className="flex gap-3">
              <button onClick={() => setModalReverseAnalysisOpen(false)} className="flex-1 py-2 bg-white/5 rounded-lg text-gray-300">Não</button>
              <button onClick={confirmReverseAnalysis} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold">Sim, refazer</button>
            </div>
          </div>
        </div>
      )}

      {modalReverseImportOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl w-full max-w-sm border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <PauseCircle className="w-5 h-5 text-gray-400" /> Pausar Fechamento?
            </h2>
            <p className="text-gray-400 text-sm mb-6">Deseja trabalhar no fechamento desta empresa em outro momento?</p>
            <div className="flex gap-3">
              <button onClick={() => setModalReverseImportOpen(false)} className="flex-1 py-2 bg-white/5 rounded-lg text-gray-300">Cancelar</button>
              <button onClick={confirmReverseImport} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold">Sim, pausar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}