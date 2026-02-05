import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Calendar, RefreshCw, Server, BoxSelect, AlertTriangle, Send, 
  ArrowRight, ArrowLeft, RotateCcw, XCircle, PauseCircle, 
  List, Columns, AlertCircle, CheckCircle, Search, Save, Play
} from 'lucide-react';
import { format } from 'date-fns';

export default function FiscalClosing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Controle de Visualização e Data
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
  const [selectedCompetence, setSelectedCompetence] = useState(getCurrentMonth());

  // Dados Principais
  const [allData, setAllData] = useState([]); // Dados brutos para a lista
  const [columns, setColumns] = useState({}); // Dados processados para o Kanban

  // --- FILTROS ---
  const [listFilters, setListFilters] = useState({
      client: '',
      regime: '',
      status: '',
      importType: '',
      finishDate: ''
  });

  // NOVO: Busca específica da coluna Pendente
  const [pendingSearch, setPendingSearch] = useState('');

  // Estado de Seleção do Card (Kanban)
  const [selectedCardId, setSelectedCardId] = useState(null);

  // Definição das Colunas Kanban
  const columnsDef = {
    pending: { id: 'pending', title: 'Pendente', color: 'bg-gray-500', label: 'Pendente' },
    docs_received: { id: 'docs_received', title: 'Importação', color: 'bg-blue-500', label: 'Importação' },
    analysis: { id: 'analysis', title: 'Apuração', color: 'bg-yellow-500', label: 'Apuração' },
    taxes_generated: { id: 'taxes_generated', title: 'Guias Geradas', color: 'bg-purple-500', label: 'Guias Geradas' },
    done: { id: 'done', title: 'Fechamento Finalizado', color: 'bg-emerald-500', label: 'Concluído' },
  };
  const columnOrder = ['pending', 'docs_received', 'analysis', 'taxes_generated', 'done'];

  // --- MODAIS DE PROCESSO ---
  const [modalStartConfirmationOpen, setModalStartConfirmationOpen] = useState(false); // NOVO
  const [modalImportOpen, setModalImportOpen] = useState(false);
  const [modalApurationOpen, setModalApurationOpen] = useState(false);
  const [modalClosingOpen, setModalClosingOpen] = useState(false);
  
  const [apurationData, setApurationData] = useState({ entradas: false, saidas: false });
  const [importError, setImportError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // --- MODAL DE ERROS ---
  const [modalErrorsListOpen, setModalErrorsListOpen] = useState(false);

  // --- MODAIS DE RETORNO ---
  const [modalReverseClosingOpen, setModalReverseClosingOpen] = useState(false);
  const [modalReverseGuidesOpen, setModalReverseGuidesOpen] = useState(false);
  const [modalReverseAnalysisOpen, setModalReverseAnalysisOpen] = useState(false);
  const [modalReverseImportOpen, setModalReverseImportOpen] = useState(false);

  const [activeTask, setActiveTask] = useState(null);

  const errorOptions = [
    "Sistema não importou", "Sistema importou parcialmente", 
    "Sistema importou canceladas com valores", "Sistema importou duplicadas",
    "Importou parcialmente e canceladas com valores", "Importou parcialmente e duplicadas",
    "Importou parcialmente, canceladas com valores e duplicadas", "Outro motivo não especificado"
  ];

  // --- 1. BUSCAR DADOS ---
  const fetchData = async () => {
    setLoading(true);
    const compDate = `${selectedCompetence}-01`;

    try {
      const { data, error } = await supabase
        .from('fiscal_closings')
        .select(`*, clients(id, razao_social, regime, cnpj)`)
        .eq('competence', compDate);

      if (error) throw error;
      
      setAllData(data || []);
      distributeToColumns(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const distributeToColumns = (data) => {
    const newCols = {
        pending: { ...columnsDef.pending, items: [] },
        docs_received: { ...columnsDef.docs_received, items: [] },
        analysis: { ...columnsDef.analysis, items: [] },
        taxes_generated: { ...columnsDef.taxes_generated, items: [] },
        done: { ...columnsDef.done, items: [] },
    };
    data.forEach(item => {
      if (newCols[item.status]) {
        newCols[item.status].items.push(item);
      }
    });
    setColumns(newCols);
  };

  useEffect(() => { fetchData(); }, [selectedCompetence]);

  // --- LÓGICA DE FILTRO DA LISTA ---
  const filteredListItems = useMemo(() => {
      return allData.filter(item => {
          const matchesClient = item.clients?.razao_social?.toLowerCase().includes(listFilters.client.toLowerCase());
          const matchesRegime = listFilters.regime ? item.clients?.regime === listFilters.regime : true;
          const matchesStatus = listFilters.status ? item.status === listFilters.status : true;
          
          let matchesType = true;
          if (listFilters.importType === 'Manual') matchesType = item.import_type === 'manual';
          if (listFilters.importType === 'Automática') matchesType = item.import_type === 'automatic';

          let matchesDate = true;
          if (listFilters.finishDate) {
              const itemDate = item.completed_at ? item.completed_at.slice(0, 10) : '';
              matchesDate = itemDate === listFilters.finishDate;
          }

          return matchesClient && matchesRegime && matchesStatus && matchesType && matchesDate;
      });
  }, [allData, listFilters]);

  // --- AÇÕES DE ATUALIZAÇÃO ---

  const handleMove = async (task, direction) => {
    const currentIndex = columnOrder.indexOf(task.status);
    if (currentIndex === -1) return;

    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= columnOrder.length) return;
    const nextStatus = columnOrder[nextIndex];

    setActiveTask(task);

    // Gatilhos de Avanço
    if (direction === 'next') {
      
      // ALTERAÇÃO AQUI: De Pendente para Importação -> Abre Modal
      if (task.status === 'pending' && nextStatus === 'docs_received') {
        setModalStartConfirmationOpen(true);
        return;
      }

      if (task.status === 'docs_received' && nextStatus === 'analysis') {
        setImportError(''); setShowManualInput(false); setModalImportOpen(true);
        return;
      }
      if (task.status === 'analysis' && nextStatus === 'taxes_generated') {
        setApurationData({ entradas: false, saidas: false }); setModalApurationOpen(true);
        return;
      }
      if (task.status === 'taxes_generated' && nextStatus === 'done') {
        setModalClosingOpen(true);
        return;
      }
    }

    // Gatilhos de Retorno
    if (direction === 'prev') {
      if (task.status === 'done') { setModalReverseClosingOpen(true); return; }
      if (task.status === 'taxes_generated') { setModalReverseGuidesOpen(true); return; }
      if (task.status === 'analysis') { setModalReverseAnalysisOpen(true); return; }
      if (task.status === 'docs_received') { setModalReverseImportOpen(true); return; }
    }

    await executeUpdate(task, nextStatus);
  };

  const executeUpdate = async (task, newStatus, extraFields = {}) => {
    // Atualização Otimista
    const updatedTask = { ...task, status: newStatus, ...extraFields };
    
    // Atualiza AllData
    setAllData(prev => prev.map(i => i.id === task.id ? updatedTask : i));
    
    // Atualiza Columns
    const prevStatus = task.status;
    const sourceItems = columns[prevStatus].items.filter(i => i.id !== task.id);
    const destItems = [...columns[newStatus].items, updatedTask];
    setColumns(prev => ({
      ...prev,
      [prevStatus]: { ...prev[prevStatus], items: sourceItems },
      [newStatus]: { ...prev[newStatus], items: destItems }
    }));

    setSelectedCardId(null);
    setActiveTask(null);

    try {
      const { error } = await supabase.from('fiscal_closings').update({ status: newStatus, ...extraFields }).eq('id', task.id);
      if (error) throw error;
    } catch (error) {
      console.error("Erro ao salvar:", error);
      fetchData(); // Reverte
    }
  };

  // --- SALVAR AJUSTE DE ERRO ---
  const handleSaveAdjustment = async (id, text) => {
      try {
          const { error } = await supabase
            .from('fiscal_closings')
            .update({ import_adjustment_details: text })
            .eq('id', id);
          
          if (error) throw error;
          
          setAllData(prev => prev.map(i => i.id === id ? { ...i, import_adjustment_details: text } : i));
      } catch (err) {
          alert('Erro ao salvar ajuste');
      }
  };

  // --- CONFIRMAÇÕES DE MODAIS ---
  
  // NOVO: Confirmar Início
  const confirmStart = () => {
      executeUpdate(activeTask, 'docs_received', { started_at: new Date().toISOString() });
      setModalStartConfirmationOpen(false);
  };

  const confirmImport = (type) => { 
    if (type === 'Manual' && !importError) return alert("Selecione o erro.");
    const extraData = { 
        movement_data: { ...(activeTask.movement_data || {}), import_type: type },
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
    executeUpdate(activeTask, 'done', { completed_at: new Date().toISOString() });
    setModalClosingOpen(false);
  };

  const confirmReverseClosing = () => { executeUpdate(activeTask, 'taxes_generated', { completed_at: null }); setModalReverseClosingOpen(false); };
  const confirmReverseGuides = () => { 
      const d = { ...(activeTask.movement_data || {}) }; delete d.entradas; delete d.saidas;
      executeUpdate(activeTask, 'analysis', { movement_data: d }); setModalReverseGuidesOpen(false); 
  };
  const confirmReverseAnalysis = () => { executeUpdate(activeTask, 'docs_received', { started_at: null }); setModalReverseAnalysisOpen(false); };
  const confirmReverseImport = () => { executeUpdate(activeTask, 'pending'); setModalReverseImportOpen(false); };

  const handleSyncClients = async () => {
    setLoading(true);
    try {
      const { data: allClients } = await supabase.from('clients').select('id');
      const existingIds = allData.map(c => c.client_id);
      const missing = allClients.filter(c => !existingIds.includes(c.id));
      if (missing.length === 0) return alert('Tudo atualizado!');
      const newRows = missing.map(client => ({ client_id: client.id, competence: `${selectedCompetence}-01`, status: 'pending' }));
      await supabase.from('fiscal_closings').insert(newRows);
      fetchData();
    } catch (error) { alert(error.message); } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center px-8 py-6 border-b border-white/5 bg-surface/50 backdrop-blur-sm z-10 gap-4">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-6 h-6" />
           </button>
           <div>
             <h1 className="text-2xl font-bold text-white">Fechamento Fiscal</h1>
             <p className="text-gray-500 text-sm">Controle de apuração mensal</p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 justify-end">
           {/* BOTÃO MODO DE VISUALIZAÇÃO */}
           <div className="bg-surface p-1 rounded-xl border border-white/10 flex">
               <button 
                  onClick={() => setViewMode('kanban')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-brand-cyan text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  title="Visualização Kanban"
               >
                   <Columns className="w-5 h-5" />
               </button>
               <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand-cyan text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  title="Visualização em Lista"
               >
                   <List className="w-5 h-5" />
               </button>
           </div>

           {/* BOTÃO ERROS DE IMPORTAÇÃO */}
           <button 
              onClick={() => setModalErrorsListOpen(true)}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
           >
             <AlertCircle className="w-4 h-4" /> Erros de Importação
           </button>

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
             <RefreshCw className="w-4 h-4" /> <span className="hidden md:inline">Atualizar</span>
           </button>
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="flex-1 overflow-hidden p-8">
        
        {loading ? (
            <div className="h-full flex items-center justify-center text-gray-500 animate-pulse">Carregando dados...</div>
        ) : viewMode === 'kanban' ? (
            
            /* === VISÃO KANBAN === */
            <div className="flex h-full gap-6 min-w-[1400px] overflow-x-auto pb-4">
                {Object.entries(columns).map(([colKey, col]) => (
                <div key={colKey} className="flex-1 flex flex-col min-w-[280px]">
                    
                    {/* Header da Coluna */}
                    <div className={`flex flex-col gap-2 mb-4 px-2 pb-2 border-b-2 ${colKey === 'done' ? 'border-emerald-500' : 'border-white/10'}`}>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${col.color}`}></div>
                            <span className="font-bold text-gray-300">{col.title}</span>
                            <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">{col.items.length}</span>
                        </div>
                        
                        {/* NOVO: Campo de Busca na Coluna Pendente */}
                        {colKey === 'pending' && (
                            <div className="mt-1">
                                <div className="flex items-center bg-black/20 rounded-lg px-2 py-1.5 border border-white/5 focus-within:border-white/20 transition-colors">
                                    <Search className="w-3 h-3 text-gray-500 mr-2" />
                                    <input 
                                        type="text"
                                        placeholder="Buscar pendente..."
                                        value={pendingSearch}
                                        onChange={(e) => setPendingSearch(e.target.value)}
                                        className="bg-transparent text-xs text-white outline-none w-full placeholder-gray-600"
                                    />
                                    {pendingSearch && (
                                        <button onClick={() => setPendingSearch('')} className="text-gray-500 hover:text-white">
                                            <XCircle className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 rounded-2xl p-2 bg-surface/20 border border-white/5 overflow-y-auto custom-scrollbar">
                    {col.items
                        .filter(item => {
                            // Aplica filtro apenas se for a coluna pendente e houver busca
                            if (colKey === 'pending' && pendingSearch) {
                                return item.clients?.razao_social?.toLowerCase().includes(pendingSearch.toLowerCase());
                            }
                            return true;
                        })
                        .map((item) => {
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
                                        </div>
                                    )}
                                </div>
                                
                                <h3 className="text-white font-bold text-sm leading-snug mb-3">{item.clients?.razao_social}</h3>

                                {/* Detalhes Kanban */}
                                {colKey === 'done' && item.completed_at && (
                                    <p className="text-[10px] text-emerald-400 mt-2 border-t border-white/10 pt-2 flex justify-between">
                                        <span>Concluído:</span>
                                        <span>{format(new Date(item.completed_at), 'dd/MM HH:mm')}</span>
                                    </p>
                                )}

                                {/* Ações Kanban */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-xl flex items-center justify-between px-2 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                        {colKey !== 'pending' ? (
                                            <button onClick={() => handleMove(item, 'prev')} className="p-2 bg-red-500/20 hover:bg-red-500 rounded-full text-white border border-red-500/50"><ArrowLeft className="w-5 h-5" /></button>
                                        ) : <div />}
                                        <button onClick={() => setSelectedCardId(null)} className="text-xs text-gray-400 hover:text-white mt-12">Fechar</button>
                                        {colKey !== 'done' ? (
                                            <button onClick={() => handleMove(item, 'next')} className="p-2 bg-brand-cyan hover:bg-cyan-600 rounded-full text-white shadow-lg"><ArrowRight className="w-5 h-5" /></button>
                                        ) : <div />}
                                    </div>
                                )}
                            </div>
                            );
                        })
                    }
                    </div>
                </div>
                ))}
            </div>

        ) : (
            
            /* === VISÃO EM LISTA (TABELA) === */
            <div className="bg-surface rounded-2xl border border-white/5 h-full flex flex-col overflow-hidden animate-fade-in">
                
                {/* Filtros da Lista */}
                <div className="p-4 border-b border-white/5 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-black/20 border border-white/10 rounded-lg flex items-center px-3 py-2">
                        <Search className="w-4 h-4 text-gray-500 mr-2" />
                        <input 
                            placeholder="Nome do Cliente" 
                            className="bg-transparent text-white text-sm w-full outline-none placeholder-gray-600"
                            value={listFilters.client}
                            onChange={e => setListFilters({...listFilters, client: e.target.value})}
                        />
                    </div>
                    {/* ... (outros filtros mantidos) ... */}
                    <select 
                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
                        value={listFilters.regime}
                        onChange={e => setListFilters({...listFilters, regime: e.target.value})}
                    >
                        <option value="">Todos Regimes</option>
                        <option value="Simples Nacional">Simples Nacional</option>
                        <option value="Lucro Presumido">Lucro Presumido</option>
                        <option value="Lucro Real">Lucro Real</option>
                    </select>
                    <select 
                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
                        value={listFilters.status}
                        onChange={e => setListFilters({...listFilters, status: e.target.value})}
                    >
                        <option value="">Todos Status</option>
                        <option value="pending">Pendente</option>
                        <option value="docs_received">Importação</option>
                        <option value="analysis">Apuração</option>
                        <option value="taxes_generated">Guias Geradas</option>
                        <option value="done">Concluído</option>
                    </select>
                    <select 
                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
                        value={listFilters.importType}
                        onChange={e => setListFilters({...listFilters, importType: e.target.value})}
                    >
                        <option value="">Tipo de Importação</option>
                        <option value="Automática">Automática</option>
                        <option value="Manual">Manual</option>
                    </select>
                    <input 
                        type="date"
                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none [&::-webkit-calendar-picker-indicator]:invert"
                        value={listFilters.finishDate}
                        onChange={e => setListFilters({...listFilters, finishDate: e.target.value})}
                    />
                </div>

                {/* Tabela */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-surface z-10">
                            <tr className="text-xs text-gray-500 uppercase border-b border-white/10">
                                <th className="p-3">Cliente</th>
                                <th className="p-3">CNPJ</th>
                                <th className="p-3">Regime</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Importação</th>
                                <th className="p-3 text-right">Data Finalização</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                            {filteredListItems.map(item => {
                                const statusInfo = columnsDef[item.status] || {};
                                return (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3 font-bold text-white">{item.clients?.razao_social}</td>
                                        <td className="p-3 font-mono text-xs">{item.clients?.cnpj || '-'}</td>
                                        <td className="p-3">
                                            <span className="bg-white/10 px-2 py-0.5 rounded text-xs">{item.clients?.regime || '-'}</span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${statusInfo.color ? statusInfo.color.replace('bg-', 'bg-opacity-20 text-') : ''} ${statusInfo.color ? statusInfo.color.replace('bg-', 'bg-') + '/20' : ''}`}>
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {item.import_type === 'manual' && <span className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Manual</span>}
                                            {item.import_type === 'automatic' && <span className="text-blue-400 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Auto</span>}
                                            {!item.import_type && '-'}
                                        </td>
                                        <td className="p-3 text-right text-gray-400">
                                            {item.completed_at ? format(new Date(item.completed_at), 'dd/MM/yyyy HH:mm') : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredListItems.length === 0 && (
                        <div className="text-center py-10 text-gray-500">Nenhum resultado encontrado.</div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* --- MODAIS --- */}
      
      {/* NOVO: Modal Confirmação de Início */}
      {modalStartConfirmationOpen && activeTask && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
           <div className="bg-surface rounded-2xl w-full max-w-sm border border-white/10 p-6">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 mx-auto">
                 <Play className="w-6 h-6 text-blue-400 ml-1" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2 text-center">Iniciar Fechamento?</h2>
              <p className="text-gray-400 text-sm text-center mb-6">
                 Deseja iniciar o processo de fechamento para <strong>{activeTask.clients?.razao_social}</strong>?
              </p>
              <div className="flex gap-3">
                  <button onClick={() => setModalStartConfirmationOpen(false)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold text-sm">Cancelar</button>
                  <button onClick={confirmStart} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm">Iniciar</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Erros Lista (Mantido) */}
      {modalErrorsListOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-surface rounded-2xl w-full max-w-4xl border border-white/10 p-6 flex flex-col h-[80vh]">
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <AlertTriangle className="w-6 h-6 text-red-500" /> Relatório de Erros de Importação
                      </h2>
                      <button onClick={() => setModalErrorsListOpen(false)} className="text-gray-400 hover:text-white"><XCircle className="w-6 h-6" /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 rounded-xl border border-white/5">
                      <table className="w-full text-left">
                          <thead className="sticky top-0 bg-surface z-10">
                              <tr className="text-xs text-gray-500 uppercase border-b border-white/10">
                                  <th className="p-4 w-1/4">Cliente</th>
                                  <th className="p-4 w-1/4">Erro Identificado</th>
                                  <th className="p-4 w-1/2">Ajuste Realizado (Descreva a solução)</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {allData.filter(i => i.import_type === 'manual').map(item => (
                                  <tr key={item.id} className="text-sm hover:bg-white/5">
                                      <td className="p-4 font-bold text-gray-300">{item.clients?.razao_social}</td>
                                      <td className="p-4">
                                          <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs border border-red-500/20 block w-fit">
                                              {item.import_error_details || 'Erro não especificado'}
                                          </span>
                                      </td>
                                      <td className="p-4">
                                          <div className="relative group">
                                            <input 
                                                type="text"
                                                defaultValue={item.import_adjustment_details || ''}
                                                onBlur={(e) => handleSaveAdjustment(item.id, e.target.value)}
                                                placeholder="Digite como o erro foi corrigido..."
                                                className="w-full bg-transparent border-b border-gray-700 focus:border-brand-cyan outline-none py-1 text-white placeholder-gray-600 transition-colors"
                                            />
                                            <Save className="w-3 h-3 text-gray-500 absolute right-0 top-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                              {allData.filter(i => i.import_type === 'manual').length === 0 && (
                                  <tr><td colSpan="3" className="p-8 text-center text-gray-500">Nenhum erro manual registrado nesta competência.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* Modal Importação (Mantido) */}
      {modalImportOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Server className="w-5 h-5 text-blue-400" /> Como foi importado?</h2>
            {!showManualInput ? (
                <div className="space-y-3">
                  <button onClick={() => confirmImport('Automática')} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl text-left border border-white/10"><span className="block text-brand-cyan font-bold">Automática</span></button>
                  <button onClick={() => setShowManualInput(true)} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl text-left border border-white/10"><span className="block text-yellow-500 font-bold">Manual</span></button>
                </div>
            ) : (
                <div className="space-y-4">
                    <label className="text-xs font-bold text-red-400 uppercase">Selecione o erro</label>
                    <select value={importError} onChange={(e) => setImportError(e.target.value)} className="w-full bg-black/20 border border-red-500/30 rounded-lg p-3 text-white text-sm outline-none">
                        <option value="">Selecione...</option>
                        {errorOptions.map((opt, idx) => <option key={idx} value={opt} className="bg-surface">{opt}</option>)}
                    </select>
                    <button onClick={() => confirmImport('Manual')} disabled={!importError} className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 rounded-lg text-white font-bold">Salvar e Continuar</button>
                    <button onClick={() => setShowManualInput(false)} className="w-full text-gray-500 text-sm">Voltar</button>
                </div>
            )}
            {!showManualInput && <button onClick={() => setModalImportOpen(false)} className="mt-4 w-full text-gray-500 text-sm">Cancelar</button>}
          </div>
        </div>
      )}

      {/* Modal Apuração (Mantido) */}
      {modalApurationOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BoxSelect className="w-5 h-5 text-yellow-500" /> O que foi apurado?</h2>
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

      {/* Modal Fechamento (Mantido) */}
      {modalClosingOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
           <div className="bg-surface rounded-2xl w-full max-w-sm border border-white/10 p-6 relative">
              <Send className="absolute top-4 right-4 text-white/5 w-24 h-24 -rotate-12" />
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-emerald-500" /> Finalizar?</h2>
              <p className="text-white text-lg font-bold mb-6">As guias foram enviadas?</p>
              <div className="flex gap-3">
                  <button onClick={() => setModalClosingOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold">Voltar</button>
                  <button onClick={confirmClosing} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold">Sim, enviadas</button>
              </div>
           </div>
        </div>
      )}

      {/* Modais Reverse (Mantidos) */}
      {modalReverseClosingOpen && <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-surface rounded-2xl p-6 w-full max-w-sm"><h2 className="text-white font-bold mb-4">Cancelar Fechamento?</h2><div className="flex gap-3"><button onClick={() => setModalReverseClosingOpen(false)} className="flex-1 bg-white/10 py-2 rounded text-white">Não</button><button onClick={confirmReverseClosing} className="flex-1 bg-red-600 py-2 rounded text-white font-bold">Sim</button></div></div></div>}
      {modalReverseGuidesOpen && <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-surface rounded-2xl p-6 w-full max-w-sm"><h2 className="text-white font-bold mb-4">Reapurar?</h2><div className="flex gap-3"><button onClick={() => setModalReverseGuidesOpen(false)} className="flex-1 bg-white/10 py-2 rounded text-white">Não</button><button onClick={confirmReverseGuides} className="flex-1 bg-yellow-600 py-2 rounded text-white font-bold">Sim</button></div></div></div>}
      {modalReverseAnalysisOpen && <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-surface rounded-2xl p-6 w-full max-w-sm"><h2 className="text-white font-bold mb-4">Refazer Conferência?</h2><div className="flex gap-3"><button onClick={() => setModalReverseAnalysisOpen(false)} className="flex-1 bg-white/10 py-2 rounded text-white">Não</button><button onClick={confirmReverseAnalysis} className="flex-1 bg-blue-600 py-2 rounded text-white font-bold">Sim</button></div></div></div>}
      {modalReverseImportOpen && <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-surface rounded-2xl p-6 w-full max-w-sm"><h2 className="text-white font-bold mb-4">Pausar?</h2><div className="flex gap-3"><button onClick={() => setModalReverseImportOpen(false)} className="flex-1 bg-white/10 py-2 rounded text-white">Cancelar</button><button onClick={confirmReverseImport} className="flex-1 bg-white/20 py-2 rounded text-white font-bold">Sim</button></div></div></div>}

    </div>
  );
}