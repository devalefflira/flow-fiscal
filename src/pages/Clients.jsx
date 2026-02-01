import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Plus, Search, 
  Edit2, Trash2, X, Building, 
  FileText, Key, ShieldCheck, 
  AlertTriangle, AlertCircle, ExternalLink, Eye, EyeOff
} from 'lucide-react';

export default function Clients() {
  const navigate = useNavigate();

  // --- MOCK DATA ---
  const [clients, setClients] = useState([
    { 
      id: 1, 
      razao: 'TechSolutions Desenvolvimento Ltda', 
      cnpj: '12.345.678/0001-90',
      regime: 'Lucro Presumido',
      im: '123456',
      ie: 'Isento',
      certVal: '2026-05-20', // Vence longe
      prefLink: 'https://nfse.blumenau.sc.gov.br',
      prefPass: 'Senha@123'
    },
    { 
      id: 2, 
      razao: 'Padaria Central do Bairro', 
      cnpj: '98.765.432/0001-10',
      regime: 'Simples Nacional',
      im: '987654',
      ie: '25.654.321-9',
      certVal: '2026-02-20', // Vence em breve (ex: < 30 dias)
      prefLink: 'https://nfse.saopaulo.sp.gov.br',
      prefPass: 'PaoQuentinho2026'
    },
    { 
      id: 3, 
      razao: 'Indústria Metalúrgica Ferro Forte', 
      cnpj: '45.123.789/0001-55',
      regime: 'Lucro Real',
      im: '112233',
      ie: '123.456.789.111',
      certVal: '2026-01-10', // Vencido
      prefLink: 'https://fazenda.gov.br',
      prefPass: 'Ferro2025!'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState({}); // Controle de visibilidade de senha por ID

  // --- ESTADOS DO MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' ou 'fiscal'
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const initialForm = { 
    id: null, 
    razao: '', cnpj: '', regime: 'Simples Nacional', im: '', ie: '', 
    certVal: '', prefLink: '', prefPass: '' 
  };
  const [formData, setFormData] = useState(initialForm);

  // --- LÓGICA DE ALERTA DE CERTIFICADO ---
  const getCertStatus = (dateString) => {
    if (!dateString) return { color: 'text-gray-500', icon: ShieldCheck, label: 'Não informado', bg: 'bg-white/5' };
    
    const today = new Date('2026-02-15'); // Data simulada (hoje)
    const valDate = new Date(dateString);
    const diffTime = valDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'text-red-500', bg:'bg-red-500/10', icon: AlertCircle, label: 'Vencido' };
    if (diffDays <= 30) return { color: 'text-yellow-500', bg:'bg-yellow-500/10', icon: AlertTriangle, label: 'Vence em breve' };
    return { color: 'text-emerald-500', bg:'bg-emerald-500/10', icon: ShieldCheck, label: 'Válido' };
  };

  // --- AÇÕES ---
  const handleOpenModal = (client = null) => {
    setActiveTab('basic'); 
    if (client) {
      setFormData(client);
      setIsEditing(true);
    } else {
      setFormData(initialForm);
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.razao.trim()) return;

    if (isEditing) {
      setClients(prev => prev.map(c => c.id === formData.id ? formData : c));
    } else {
      const newId = Math.max(...clients.map(c => c.id), 0) + 1;
      setClients([...clients, { ...formData, id: newId }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Excluir este cliente?')) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtro
  const filteredClients = clients.filter(c => 
    c.razao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-background p-8 font-sans flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Clientes</h1>
              <p className="text-gray-500 text-sm">Gerencie dados cadastrais, fiscais e acessos</p>
            </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" /> Novo Cliente
        </button>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="bg-surface p-4 rounded-xl border border-white/5 mb-6">
        <div className="flex items-center gap-3 bg-background px-4 py-3 rounded-lg border border-white/10 focus-within:border-brand-cyan transition-colors">
            <Search className="w-5 h-5 text-gray-500" />
            <input 
                type="text" 
                placeholder="Buscar por Razão Social ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-white w-full outline-none placeholder-gray-600"
            />
        </div>
      </div>

      {/* TABELA DENSA */}
      <div className="bg-surface rounded-xl border border-white/5 overflow-hidden flex-1 flex flex-col shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase border-b border-white/10">
                <th className="p-4 font-bold">Razão Social / CNPJ</th>
                <th className="p-4 font-bold">Regime / Inscrições</th>
                <th className="p-4 font-bold">Certificado Digital</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredClients.map((client) => {
                const certStatus = getCertStatus(client.certVal);
                const CertIcon = certStatus.icon;

                return (
                  <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                    
                    {/* Razão Social & CNPJ */}
                    <td className="p-4 align-top">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">{client.razao}</span>
                        <span className="text-xs text-gray-500 font-mono mt-1">{client.cnpj}</span>
                      </div>
                    </td>

                    {/* Regime & Inscrições */}
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded w-fit mb-1">
                          {client.regime}
                        </span>
                        <span className="text-xs text-gray-400">
                           <strong className="text-gray-500">IM:</strong> {client.im || '-'}
                        </span>
                        <span className="text-xs text-gray-400">
                           <strong className="text-gray-500">IE:</strong> {client.ie || '-'}
                        </span>
                      </div>
                    </td>

                    {/* Certificado Digital */}
                    <td className="p-4 align-top">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 ${certStatus.bg}`}>
                         <CertIcon className={`w-4 h-4 ${certStatus.color}`} />
                         <div className="flex flex-col">
                           <span className={`text-xs font-bold ${certStatus.color}`}>{certStatus.label}</span>
                           <span className="text-[10px] text-gray-400">{client.certVal ? client.certVal.split('-').reverse().join('/') : '-'}</span>
                         </div>
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="p-4 align-middle text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(client)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-brand-cyan transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)}
                          className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL COM ABAS --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
           <div className="bg-surface rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Header Modal */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-brand-cyan" />
                  {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Abas de Navegação */}
              <div className="flex border-b border-white/10">
                <button 
                  onClick={() => setActiveTab('basic')}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2
                    ${activeTab === 'basic' ? 'border-brand-cyan text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}
                  `}
                >
                  <FileText className="w-4 h-4" /> Dados Básicos
                </button>
                <button 
                  onClick={() => setActiveTab('fiscal')}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2
                    ${activeTab === 'fiscal' ? 'border-brand-cyan text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}
                  `}
                >
                  <Key className="w-4 h-4" /> Fiscal & Acesso
                </button>
              </div>

              {/* Conteúdo do Modal */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                
                {/* ABA 1: DADOS BÁSICOS */}
                {activeTab === 'basic' && (
                  <div className="space-y-4 animate-fade-in">
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Razão Social</label>
                      <input 
                        type="text" 
                        value={formData.razao}
                        onChange={(e) => setFormData({...formData, razao: e.target.value})}
                        className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"
                        placeholder="Ex: Empresa Exemplo Ltda"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">CNPJ</label>
                        <input 
                          type="text" 
                          value={formData.cnpj}
                          onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                          className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"
                          placeholder="00.000.000/0000-00"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Regime Tributário</label>
                        <select 
                          value={formData.regime}
                          onChange={(e) => setFormData({...formData, regime: e.target.value})}
                          className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"
                        >
                          <option>Simples Nacional</option>
                          <option>Lucro Presumido</option>
                          <option>Lucro Real</option>
                          <option>MEI</option>
                          <option>Isento</option>
                          <option>Produtor Rural</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Inscrição Municipal</label>
                        <input 
                          type="text" 
                          value={formData.im}
                          onChange={(e) => setFormData({...formData, im: e.target.value})}
                          className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Inscrição Estadual</label>
                        <input 
                          type="text" 
                          value={formData.ie}
                          onChange={(e) => setFormData({...formData, ie: e.target.value})}
                          className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 2: FISCAL & ACESSO */}
                {activeTab === 'fiscal' && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Seção Certificado */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2 mb-3 text-brand-cyan">
                        <ShieldCheck className="w-5 h-5" />
                        <h3 className="font-bold text-sm">Certificado Digital (A1/A3)</h3>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Validade do Certificado</label>
                        <input 
                          type="date" 
                          value={formData.certVal}
                          onChange={(e) => setFormData({...formData, certVal: e.target.value})}
                          className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan [&::-webkit-calendar-picker-indicator]:invert"
                        />
                        <p className="text-[10px] text-gray-500">O sistema alertará 30 dias antes do vencimento.</p>
                      </div>
                    </div>

                    {/* Seção Prefeitura */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2 mb-3 text-brand-cyan">
                        <Building className="w-5 h-5" />
                        <h3 className="font-bold text-sm">Acesso Prefeitura (NFS-e)</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Link de Acesso</label>
                          <div className="flex gap-2">
                             <input 
                              type="text" 
                              value={formData.prefLink}
                              onChange={(e) => setFormData({...formData, prefLink: e.target.value})}
                              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"
                              placeholder="https://..."
                            />
                            {formData.prefLink && (
                              <a href={formData.prefLink} target="_blank" rel="noreferrer" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white">
                                <ExternalLink className="w-5 h-5" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Senha de Acesso</label>
                          <div className="relative">
                            <input 
                              type={showPassword['modal'] ? "text" : "password"}
                              value={formData.prefPass}
                              onChange={(e) => setFormData({...formData, prefPass: e.target.value})}
                              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan pr-10"
                              placeholder="••••••"
                            />
                            <button 
                              type="button"
                              onClick={() => togglePasswordVisibility('modal')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                            >
                              {showPassword['modal'] ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Footer Modal */}
              <div className="p-6 border-t border-white/10 flex gap-3 bg-surface">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-brand-cyan hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
                >
                  Salvar Cliente
                </button>
              </div>

           </div>
        </div>
      )}

    </div>
  );
}