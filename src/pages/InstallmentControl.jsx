import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Search, Filter, Calendar, 
  DollarSign, CheckCircle, AlertTriangle, 
  Clock, Check
} from 'lucide-react';

export default function InstallmentControl() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');

  // Data de referência (Simulação: Hoje é 15/02/2026)
  const today = new Date('2026-02-15');

  const [installments, setInstallments] = useState([
    { 
      id: 1, 
      clientName: 'TechSolutions Ltda', 
      type: 'Simples Nacional',
      current: 12,
      total: 60,
      value: 1250.00,
      dueDate: '2026-02-10', // Atrasado
      sent: false
    },
    { 
      id: 2, 
      clientName: 'Padaria Central', 
      type: 'PGFN',
      current: 5,
      total: 24,
      value: 450.50,
      dueDate: '2026-02-18', // Vence em breve (3 dias)
      sent: false
    },
    { 
      id: 3, 
      clientName: 'Indústria Metalúrgica', 
      type: 'Regularize',
      current: 58,
      total: 60,
      value: 3200.00,
      dueDate: '2026-02-25', // Em dia
      sent: false
    },
    { 
      id: 4, 
      clientName: 'Comércio de Roupas', 
      type: 'Parcelamento MEI',
      current: 10,
      total: 12,
      value: 65.00,
      dueDate: '2026-02-20', // Em dia
      sent: true // Já enviado
    },
    { 
      id: 5, 
      clientName: 'Oficina do Zé', 
      type: 'Simples Nacional',
      current: 1,
      total: 120,
      value: 150.00,
      dueDate: '2026-02-14', // Atrasado (Ontem)
      sent: false
    },
  ]);

  // --- LÓGICA DE STATUS (SEMÁFORO) ---
  const getStatus = (inst) => {
    if (inst.sent) return 'done';

    const due = new Date(inst.dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'late';      // Vermelho
    if (diffDays <= 5) return 'warning';  // Amarelo
    return 'ok';                          // Verde
  };

  const getCardStyles = (status) => {
    switch (status) {
      case 'late':
        return { border: 'border-l-red-500', iconColor: 'text-red-500', badge: 'bg-red-500/10 text-red-500', label: 'Atrasado' };
      case 'warning':
        return { border: 'border-l-yellow-500', iconColor: 'text-yellow-500', badge: 'bg-yellow-500/10 text-yellow-500', label: 'Vence em Breve' };
      case 'done':
        return { border: 'border-l-gray-600', iconColor: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500', label: 'Enviado' };
      default: // ok
        return { border: 'border-l-emerald-500', iconColor: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500', label: 'Em dia' };
    }
  };

  // --- AÇÃO DE ENVIAR (CHECK) ---
  const handleToggleSent = (id) => {
    setInstallments(prev => prev.map(inst => 
      inst.id === id ? { ...inst, sent: !inst.sent } : inst
    ));
  };

  // Filtros
  const filteredData = installments.filter(item => {
    const matchesSearch = item.clientName.toLowerCase().includes(searchTerm.toLowerCase());
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
              <h1 className="text-2xl font-bold text-white">Controle de Parcelamentos</h1>
              <p className="text-gray-500 text-sm">Acompanhamento mensal de acordos e guias</p>
            </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-surface p-4 rounded-xl border border-white/5 flex flex-wrap gap-4 items-center mb-8">
          <div className="flex-1 flex items-center gap-3 bg-background px-4 py-3 rounded-lg border border-white/10 focus-within:border-brand-cyan transition-colors">
              <Search className="w-5 h-5 text-gray-500" />
              <input 
                  type="text" 
                  placeholder="Buscar cliente..."
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
                <option value="Todos">Todos os Tipos</option>
                <option value="Simples Nacional">Simples Nacional</option>
                <option value="PGFN">PGFN</option>
                <option value="Regularize">Regularize</option>
                <option value="Parcelamento MEI">Parcelamento MEI</option>
            </select>
          </div>
      </div>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredData.map(inst => {
          const status = getStatus(inst);
          const style = getCardStyles(status);
          const progress = Math.round((inst.current / inst.total) * 100);

          return (
            <div 
              key={inst.id} 
              className={`bg-surface rounded-xl border-t border-r border-b border-white/5 border-l-4 ${style.border} p-6 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden`}
            >
              {/* Efeito de Fundo (Opcional) */}
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <DollarSign className="w-24 h-24" />
              </div>

              {/* Cabeçalho do Card */}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                   <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-1">{inst.type}</span>
                   <h3 className="font-bold text-white text-lg leading-tight">{inst.clientName}</h3>
                </div>
                {/* Status Badge */}
                <div className={`px-2 py-1 rounded text-[10px] font-bold border border-white/5 ${style.badge}`}>
                  {style.label}
                </div>
              </div>

              {/* Progresso (Contador) */}
              <div className="mb-6 relative z-10">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-4xl font-bold text-white font-mono">{inst.current}<span className="text-xl text-gray-500">/{inst.total}</span></span>
                  <span className="text-xs text-brand-cyan font-bold">{progress}% Pago</span>
                </div>
                <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-brand-cyan transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              {/* Informações Financeiras */}
              <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                 <div className="bg-background/50 p-3 rounded-lg border border-white/5">
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">Valor</span>
                    <span className="text-white font-bold text-sm">R$ {inst.value.toFixed(2).replace('.', ',')}</span>
                 </div>
                 <div className="bg-background/50 p-3 rounded-lg border border-white/5">
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">Vencimento</span>
                    <div className="flex items-center gap-1">
                       <Calendar className={`w-3 h-3 ${style.iconColor}`} />
                       <span className={`font-bold text-sm ${status === 'late' ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                         {inst.dueDate.split('-').reverse().slice(0,2).join('/')}
                       </span>
                    </div>
                 </div>
              </div>

              {/* Botão de Ação (Rodapé) */}
              <div className="mt-auto relative z-10">
                 <button 
                   onClick={() => handleToggleSent(inst.id)}
                   className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95
                     ${inst.sent 
                       ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-600/50 hover:bg-emerald-600/30' 
                       : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-blue-500/20'
                     }
                   `}
                 >
                    {inst.sent ? (
                      <>
                        <CheckCircle className="w-5 h-5" /> Guia Enviada
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" /> Confirmar Envio
                      </>
                    )}
                 </button>
              </div>

            </div>
          );
        })}
      </div>
      
      {/* Empty State */}
      {filteredData.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
             <DollarSign className="w-12 h-12 mb-4 opacity-20" />
             <p>Nenhum parcelamento encontrado.</p>
          </div>
      )}

    </div>
  );
}