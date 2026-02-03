import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Calendar, RefreshCw } from 'lucide-react';

// --- SUB-COMPONENTES VISUAIS ---

const CountCard = ({ value, label, color = "text-white", subColor = "text-gray-400", borderColor = "border-white/5" }) => (
  <div className={`flex flex-col items-center justify-center p-6 border-r ${borderColor} last:border-r-0 w-full`}>
    <span className={`text-4xl font-bold ${color} mb-2`}>{value}</span>
    <span className={`${subColor} text-sm font-medium text-center`}>{label}</span>
  </div>
);

const FractionCard = ({ current, total, label }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-xl border border-white/10 hover:border-brand-cyan/50 transition-colors">
    <div className="flex items-baseline gap-1 mb-2">
      <span className={`text-4xl font-bold ${current === total && total > 0 ? 'text-emerald-500' : 'text-white'}`}>
        {current}
      </span>
      <span className="text-2xl font-bold text-gray-500">/{total}</span>
    </div>
    <span className="text-gray-400 text-sm font-medium text-center max-w-[180px]">{label}</span>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function FiscalDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fechamento'); // fechamento, obrigacoes, parcelamentos
  const [loading, setLoading] = useState(false);

  // Controle de Competência
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
  const [selectedCompetence, setSelectedCompetence] = useState(getCurrentMonth());

  // Estados dos Dados
  const [closingData, setClosingData] = useState({
    pending: 0, done: 0,
    importing: 0, analyzing: 0, generating: 0,
    regimeCounts: {}
  });

  const [obligationsData, setObligationsData] = useState({});
  const [installmentsData, setInstallmentsData] = useState({});

  // --- BUSCA DE DADOS ---

  const fetchDashboardData = async () => {
    setLoading(true);
    const compDate = `${selectedCompetence}-01`;
    
    // Define intervalo para buscar por data (usado em parcelamentos)
    const [year, month] = selectedCompetence.split('-');
    const startDate = `${selectedCompetence}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Último dia do mês

    try {
      // 1. DADOS DE FECHAMENTO
      if (activeTab === 'fechamento') {
        const { data, error } = await supabase
          .from('fiscal_closings')
          .select('status, clients(regime)')
          .eq('competence', compDate);

        if (!error && data) {
          const stats = {
            pending: 0, done: 0,
            importing: 0, analyzing: 0, generating: 0,
            regimeCounts: { 'Simples Nacional': 0, 'Lucro Presumido': 0, 'Lucro Real': 0, 'Isento': 0, 'MEI': 0 }
          };

          data.forEach(item => {
            // Contagem por Status
            if (item.status === 'pending') stats.pending++;
            if (item.status === 'done') stats.done++;
            if (item.status === 'docs_received') stats.importing++;
            if (item.status === 'analysis') stats.analyzing++;
            if (item.status === 'taxes_generated') stats.generating++;

            // Contagem por Regime (Apenas Finalizados)
            if (item.status === 'done' && item.clients?.regime) {
              const reg = item.clients.regime;
              if (stats.regimeCounts[reg] !== undefined) {
                stats.regimeCounts[reg]++;
              } else {
                // Caso venha um regime diferente do esperado
                stats.regimeCounts[reg] = (stats.regimeCounts[reg] || 0) + 1;
              }
            }
          });
          setClosingData(stats);
        }
      }

      // 2. DADOS DE OBRIGAÇÕES
      if (activeTab === 'obrigacoes') {
        // Assume tabela 'accessory_obligations' com colunas: type, status, competence
        const { data, error } = await supabase
          .from('accessory_obligations')
          .select('type, status')
          .eq('competence', compDate);

        if (!error && data) {
          // Agrupa por tipo: { 'SPED EFD': { total: 10, done: 5 } }
          const groups = {};
          data.forEach(item => {
            if (!groups[item.type]) groups[item.type] = { total: 0, done: 0 };
            groups[item.type].total++;
            if (item.status === 'done' || item.status === 'transmitted') groups[item.type].done++;
          });
          setObligationsData(groups);
        }
      }

      // 3. DADOS DE PARCELAMENTOS
      if (activeTab === 'parcelamentos') {
        // Assume tabela 'installment_controls' com colunas: type, status, due_date
        const { data, error } = await supabase
          .from('installment_controls')
          .select('type, status')
          .gte('due_date', startDate)
          .lte('due_date', endDate);

        if (!error && data) {
           const counts = {
             'Simples Nacional': 0,
             'PGFN': 0,
             'Simplificado': 0,
             'Outros': 0
           };

           data.forEach(item => {
             // Conta apenas os enviados/pagos/concluídos para o dashboard? 
             // Ou conta todos? O layout diz "Enviados". Vamos contar status='done' ou 'paid'
             const isDone = item.status === 'done' || item.status === 'paid' || item.status === 'sent';
             
             if (isDone) {
               if (counts[item.type] !== undefined) {
                 counts[item.type]++;
               } else {
                 counts['Outros']++;
               }
             }
           });
           setInstallmentsData(counts);
        }
      }

    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedCompetence, activeTab]);


  // --- MAPAS DE TIPOS (Para Labels) ---
  // Ajuste as chaves conforme o que está salvo no seu Banco de Dados
  const OBLIGATION_LABELS = {
    'sped_efd': 'SPED EFD Contribuições',
    'efd_reinf': 'EFD REINF',
    'mit': 'MIT',
    'sped_icms': 'SPED ICMS IPI',
    'estadual': 'Declarações Estaduais',
    'dctf_web': 'DCTF Web',
    'dctf': 'DCTF Mensal'
  };

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      
      {/* --- HEADER --- */}
      <header className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-bold text-white">Visão Fiscal</h1>
           <p className="text-gray-500 text-sm">Acompanhamento consolidado da operação</p>
        </div>
        
        {/* Navegação de Abas */}
        <div className="bg-surface rounded-full p-1 flex items-center border border-white/5">
          {['fechamento', 'obrigacoes', 'parcelamentos'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all capitalize 
                ${activeTab === tab ? 'bg-brand-cyan text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button 
          onClick={() => navigate('/home')}
          className="bg-surface hover:bg-surfaceHover border border-white/10 text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Voltar
        </button>
      </header>

      {/* --- SELETOR DE COMPETÊNCIA --- */}
      <div className="mb-8 flex items-center gap-4">
        <div className="bg-surface inline-flex items-center rounded-xl p-2 pr-4 border border-white/5 shadow-sm">
            <div className="bg-white/5 p-2 rounded-lg mr-3">
                <Calendar className="w-5 h-5 text-brand-cyan" />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-gray-500">Competência</span>
                <input 
                    type="month" 
                    value={selectedCompetence}
                    onChange={(e) => setSelectedCompetence(e.target.value)}
                    className="bg-transparent text-white font-bold outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                />
            </div>
        </div>
        
        {loading && <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />}
      </div>

      {/* --- CONTEÚDO DINÂMICO --- */}
      
      {/* 1. ABA FECHAMENTO */}
      {activeTab === 'fechamento' && (
        <div className="bg-surface rounded-2xl p-8 border border-white/5 animate-fade-in">
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Esquerda: Status Geral */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-y-12 pr-8 lg:border-r border-white/5 relative">
              
              {/* Totais Gerais */}
              <div className="col-span-full grid grid-cols-2 gap-4 pb-8 border-b border-white/5 mb-4">
                  <CountCard value={closingData.done} label="Apurações Finalizadas" color="text-emerald-500" borderColor="border-r-0" />
                  <CountCard value={closingData.pending + closingData.importing + closingData.analyzing + closingData.generating} label="Pendentes Totais" color="text-red-500" borderColor="border-r-0" />
              </div>

              {/* Fases do Processo */}
              <CountCard value={closingData.importing} label="Fazendo Importação" color="text-blue-400" />
              <CountCard value={closingData.analyzing} label="Fazendo Apuração" color="text-yellow-400" />
              <CountCard value={closingData.generating} label="Gerando Guias" color="text-purple-400" />
            </div>

            {/* Direita: Por Regime */}
            <div className="flex-1 pl-4 flex flex-col items-center">
               <h3 className="text-white text-lg mb-8 font-bold flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                 Finalizadas por Regime
               </h3>
               <div className="w-full grid grid-cols-2 gap-8">
                 <div className="flex flex-col items-center p-4 bg-white/5 rounded-xl">
                    <span className="text-4xl font-bold text-white mb-1">{closingData.regimeCounts['Simples Nacional'] || 0}</span>
                    <span className="text-gray-400 text-sm text-center">Simples Nacional</span>
                 </div>
                 <div className="flex flex-col items-center p-4 bg-white/5 rounded-xl">
                    <span className="text-4xl font-bold text-white mb-1">{closingData.regimeCounts['Lucro Presumido'] || 0}</span>
                    <span className="text-gray-400 text-sm text-center">Lucro Presumido</span>
                 </div>
                 <div className="flex flex-col items-center p-4 bg-white/5 rounded-xl">
                    <span className="text-4xl font-bold text-white mb-1">{closingData.regimeCounts['Lucro Real'] || 0}</span>
                    <span className="text-gray-400 text-sm text-center">Lucro Real</span>
                 </div>
                 <div className="flex flex-col items-center p-4 bg-white/5 rounded-xl">
                    <span className="text-4xl font-bold text-white mb-1">
                        {(closingData.regimeCounts['MEI'] || 0) + (closingData.regimeCounts['Isento'] || 0)}
                    </span>
                    <span className="text-gray-400 text-sm text-center">Outros (MEI/Isento)</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ABA OBRIGAÇÕES */}
      {activeTab === 'obrigacoes' && (
        <div className="bg-surface rounded-2xl p-8 border border-white/5 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Se não houver dados no banco, mostra zeros */}
            {Object.keys(OBLIGATION_LABELS).map(key => {
                const info = obligationsData[key] || { done: 0, total: 0 };
                return (
                    <FractionCard 
                        key={key}
                        current={info.done} 
                        total={info.total} 
                        label={OBLIGATION_LABELS[key]} 
                    />
                );
            })}
            
            {/* Caso queira renderizar dinamicamente o que vem do banco sem mapa fixo: */}
            {Object.keys(obligationsData).filter(k => !OBLIGATION_LABELS[k]).map(key => (
                 <FractionCard 
                    key={key}
                    current={obligationsData[key].done} 
                    total={obligationsData[key].total} 
                    label={key.replace(/_/g, ' ').toUpperCase()} 
                />
            ))}
          </div>
          
          {Object.keys(obligationsData).length === 0 && (
              <div className="text-center py-12 text-gray-500">Nenhuma obrigação encontrada para esta competência.</div>
          )}
        </div>
      )}

      {/* 3. ABA PARCELAMENTOS */}
      {activeTab === 'parcelamentos' && (
        <div className="bg-surface rounded-2xl p-8 border border-white/5 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-8 px-8 py-4">
             <div className="bg-white/5 rounded-2xl border border-white/10 flex items-center">
                 <CountCard value={installmentsData['Simples Nacional'] || 0} label="Parcelamentos do Simples enviados" color="text-brand-cyan" borderColor="border-none" />
             </div>
             
             <div className="bg-white/5 rounded-2xl border border-white/10 flex items-center">
                 <CountCard value={installmentsData['PGFN'] || 0} label="Parcelamentos da PGFN enviados" color="text-brand-cyan" borderColor="border-none" />
             </div>
             
             <div className="relative rounded-2xl border border-purple-500/50 bg-purple-500/10 flex items-center shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <div className="absolute top-2 right-3 text-[10px] uppercase font-bold text-purple-300 bg-purple-500/20 px-2 rounded">Prioridade</div>
                <CountCard value={installmentsData['Simplificado'] || 0} label="Parcelamentos do Simplificado enviados" color="text-purple-300" borderColor="border-none" />
             </div>

             <div className="bg-white/5 rounded-2xl border border-white/10 flex items-center">
                <CountCard value={installmentsData['Outros'] || 0} label="Outros (ISS, MEI, PERT, PAEX)" color="text-brand-cyan" borderColor="border-none" />
             </div>
          </div>
        </div>
      )}

    </div>
  );
}