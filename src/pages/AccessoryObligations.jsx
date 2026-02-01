import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Search, Filter, Calendar, 
  AlertCircle, CheckCircle, Clock, FileText, 
  MoreHorizontal, Hash 
} from 'lucide-react';

export default function AccessoryObligations() {
  const navigate = useNavigate();

  // --- ESTADOS DE FILTROS ---
  const [competence, setCompetence] = useState('2026-01');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');

  // --- MOCK DATA (SIMULAÇÃO) ---
  // Data de referência simulada: 15/02/2026 para vermos os alertas funcionarem
  const today = '2026-02-15'; 

  const [obligations, setObligations] = useState([
    { 
      id: 1, 
      clientName: 'TechSolutions Ltda', 
      clientCode: '001',
      cnpj: '12.345.678/0001-90',
      regime: 'Lucro Presumido',
      type: 'DCTF Mensal',
      deadline: '2026-02-10', // Atrasado (Ref: dia 15)
      status: 'pending', 
      receipt: '',
      submissionDate: null
    },
    { 
      id: 2, 
      clientName: 'Padaria Central', 
      clientCode: '045',
      cnpj: '98.765.432/0001-10',
      regime: 'Simples Nacional',
      type: 'PGDAS-D',
      deadline: '2026-02-15', // Vence Hoje
      status: 'pending', 
      receipt: '',
      submissionDate: null
    },
    { 
      id: 3, 
      clientName: 'Indústria Metalúrgica', 
      clientCode: '088',
      cnpj: '45.123.789/0001-55',
      regime: 'Lucro Real',
      type: 'EFD REINF',
      deadline: '2026-02-20', // No Prazo
      status: 'pending', 
      receipt: '',
      submissionDate: null
    },
    { 
      id: 4, 
      clientName: 'Comércio de Roupas SA', 
      clientCode: '102',
      cnpj: '11.222.333/0001-00',
      regime: 'Lucro Real',
      type: 'SPED Fiscal',
      deadline: '2026-02-10', 
      status: 'done', // Concluído
      receipt: 'REC-2026-998877',
      submissionDate: '2026-02-09'
    },
  ]);

  // --- MODAL DE CONCLUSÃO ---
  const [showModal, setShowModal] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState(null);
  const [receiptInput, setReceiptInput] = useState('');

  // Abrir Modal
  const handleOpenConclude = (obl) => {
    setSelectedObligation(obl);
    setReceiptInput('');
    setShowModal(true);
  };

  // Salvar Conclusão
  const handleConfirmConclusion = () => {
    if (!receiptInput.trim()) return; // Obriga a digitar

    setObligations(prev => prev.map(item => {
      if (item.id === selectedObligation.id) {
        return {
          ...item,
          status: 'done',
          receipt: receiptInput,
          submissionDate: new Date().toISOString().split('T')[0] // Data de hoje
        };
      }
      return item;
    }));

    setShowModal(false);
  };

  // --- LÓGICA VISUAL DE PRAZOS ---
  const getStatusInfo = (obl) => {
    if (obl.status === 'done') {
      return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Concluído', icon: CheckCircle };
    }

    // Comparação de Datas (String YYYY-MM-DD funciona direto)
    if (obl.deadline < today) {
      return { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Atrasado', icon: AlertCircle };
    }
    if (obl.deadline === today) {
      return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Vence Hoje', icon: Clock };
    }
    
    return { color: 'text-gray-400', bg: 'bg-white/5', label: 'Pendente', icon: Clock };
  };

  // Filtros
  const filteredData = obligations.filter(item => {
    const matchesSearch = item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.clientCode.includes(searchTerm) ||
                          item.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'Todos' || item.type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-background p-8 font-sans flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Obrigações Acessórias</h1>
              <p className="text-gray-500 text-sm">Controle de envio de declarações e SPEDs</p>
            </div>
        </div>
        
        {/* Seletor de Competência */}
        <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-lg border border-white/10">
            <span className="text-gray-400 text-sm font-bold uppercase mr-2">Competência:</span>
            <input 
              type="month" 
              value={competence}
              onChange={(e) => setCompetence(e.target.value)}
              className="bg-transparent text-white outline-none font-bold cursor-pointer"
            />
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-surface p-4 rounded-xl border border-white/5 flex flex-wrap gap-4 items-center mb-6">
          <div className="flex-1 flex items-center gap-3 bg-background px-4 py-3 rounded-lg border border-white/10 focus-within:border-brand-cyan transition-colors">
              <Search className="w-5 h-5 text-gray-500" />
              <input 
                  type="text" 
                  placeholder="Buscar por Cliente, Código ou Tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent text-white w-full outline-none placeholder-gray-600"
              />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-background text-sm text-white px-4 py-3 rounded-lg border border-white/10 outline-none"
            >
                <option value="Todos">Todas as Obrigações</option>
                <option value="DCTF Mensal">DCTF Mensal</option>
                <option value="PGDAS-D">PGDAS-D</option>
                <option value="EFD REINF">EFD REINF</option>
                <option value="SPED Fiscal">SPED Fiscal</option>
                <option value="SPED Contribuições">SPED Contribuições</option>
            </select>
          </div>
      </div>

      {/* TABELA */}
      <div className="bg-surface rounded-xl border border-white/5 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase border-b border-white/10">
                <th className="p-4 font-bold">Status / Prazo</th>
                <th className="p-4 font-bold">Cliente</th>
                <th className="p-4 font-bold">Obrigação</th>
                <th className="p-4 font-bold">Recibo</th>
                <th className="p-4 font-bold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.map((item) => {
                const statusInfo = getStatusInfo(item);
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    
                    {/* Coluna 1: Status Visual */}
                    <td className="p-4 align-middle">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-white/5 ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusInfo.label}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 ml-1">
                        Limite: {item.deadline.split('-').reverse().join('/')}
                      </div>
                    </td>

                    {/* Coluna 2: Cliente */}
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">{item.clientName}</span>
                        <span className="text-xs text-gray-500">{item.clientCode} • {item.cnpj}</span>
                        <span className="text-[10px] text-brand-cyan mt-0.5">{item.regime}</span>
                      </div>
                    </td>

                    {/* Coluna 3: Obrigação */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm font-medium">{item.type}</span>
                      </div>
                    </td>

                    {/* Coluna 4: Recibo */}
                    <td className="p-4 align-middle">
                      {item.receipt ? (
                        <div className="flex flex-col">
                          <span className="text-emerald-500 font-mono text-xs">{item.receipt}</span>
                          <span className="text-[10px] text-gray-600">Envio: {item.submissionDate.split('-').reverse().join('/')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs italic">- Pendente -</span>
                      )}
                    </td>

                    {/* Coluna 5: Ação */}
                    <td className="p-4 align-middle text-right">
                      {item.status === 'pending' ? (
                        <button 
                          onClick={() => handleOpenConclude(item)}
                          className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                        >
                          Concluir
                        </button>
                      ) : (
                        <button className="text-gray-600 hover:text-white transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Empty State */}
          {filteredData.length === 0 && (
            <div className="p-12 text-center text-gray-500 text-sm">
              Nenhuma obrigação encontrada para os filtros selecionados.
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL DE INSERIR RECIBO --- */}
      {showModal && selectedObligation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
           <div className="bg-surface p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl relative">
              
              <h2 className="text-xl font-bold text-white mb-1">Concluir Obrigação</h2>
              <p className="text-gray-400 text-sm mb-6">
                Informe o recibo para finalizar <strong>{selectedObligation.type}</strong> de {selectedObligation.clientName}.
              </p>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Número do Recibo</label>
                <div className="flex items-center gap-3 bg-background px-4 py-3 rounded-xl border border-white/10 focus-within:border-brand-cyan transition-colors">
                  <Hash className="w-5 h-5 text-brand-cyan" />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Ex: 2026.01.998877-XX"
                    value={receiptInput}
                    onChange={(e) => setReceiptInput(e.target.value)}
                    className="bg-transparent text-white w-full outline-none font-mono placeholder-gray-600"
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-2">
                  * A data de envio será registrada automaticamente como hoje.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmConclusion}
                  disabled={!receiptInput.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold transition-colors text-sm"
                >
                  Confirmar Envio
                </button>
              </div>

           </div>
        </div>
      )}

    </div>
  );
}