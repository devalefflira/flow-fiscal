import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Importando Supabase
import { 
  ChevronLeft, Plus, Search, 
  Edit2, Trash2, X, Building, 
  FileText, Key, ShieldCheck, 
  AlertTriangle, AlertCircle, ExternalLink, Eye, EyeOff
} from 'lucide-react';

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState({});

  // --- ESTADOS DO MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [isEditing, setIsEditing] = useState(false);

  // Form State (Nomes iguais ao Banco de Dados)
  const initialForm = { 
    id: null, 
    razao_social: '', 
    cnpj: '', 
    regime: 'Simples Nacional', 
    im: '', 
    ie: '', 
    cert_val: '', 
    pref_link: '', 
    pref_pass: '' 
  };
  const [formData, setFormData] = useState(initialForm);

  // --- 1. BUSCAR DADOS (READ) ---
  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('razao_social', { ascending: true });

    if (error) console.error('Erro ao buscar clientes:', error);
    else setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // --- HELPERS ---
  const getCertStatus = (dateString) => {
    if (!dateString) return { color: 'text-gray-500', icon: ShieldCheck, label: 'Não informado', bg: 'bg-white/5' };
    
    const today = new Date(); // Data real de hoje
    const valDate = new Date(dateString);
    const diffTime = valDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'text-red-500', bg:'bg-red-500/10', icon: AlertCircle, label: 'Vencido' };
    if (diffDays <= 30) return { color: 'text-yellow-500', bg:'bg-yellow-500/10', icon: AlertTriangle, label: 'Vence em breve' };
    return { color: 'text-emerald-500', bg:'bg-emerald-500/10', icon: ShieldCheck, label: 'Válido' };
  };

  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
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

  // --- 2. SALVAR (CREATE / UPDATE) ---
  const handleSave = async () => {
    if (!formData.razao_social.trim()) return;

    // Removemos o ID do payload para o insert (o banco gera sozinho)
    const { id, ...payload } = formData;

    // Tratamento para datas vazias (Supabase não gosta de string vazia em campo date)
    if (payload.cert_val === '') payload.cert_val = null;

    if (isEditing) {
      const { error } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', formData.id);
      
      if (error) alert('Erro ao atualizar: ' + error.message);
    } else {
      const { error } = await supabase
        .from('clients')
        .insert([payload]);

      if (error) alert('Erro ao criar: ' + error.message);
    }

    setIsModalOpen(false);
    fetchClients();
  };

  // --- 3. DELETAR (DELETE) ---
  const handleDelete = async (id) => {
    if (window.confirm('Excluir este cliente permanentemente?')) {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) alert('Erro ao excluir: ' + error.message);
      else fetchClients();
    }
  };

  // Filtro (Client-side, já que a lista não será gigante na V1)
  const filteredClients = clients.filter(c => 
    c.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

      {/* SEARCH */}
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

      {/* LOADING STATE */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 animate-pulse">
          Carregando clientes...
        </div>
      ) : (
        /* TABELA */
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
                  const certStatus = getCertStatus(client.cert_val);
                  const CertIcon = certStatus.icon;

                  return (
                    <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                      
                      {/* Coluna 1 */}
                      <td className="p-4 align-top">
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-sm">{client.razao_social}</span>
                          <span className="text-xs text-gray-500 font-mono mt-1">{client.cnpj}</span>
                        </div>
                      </td>

                      {/* Coluna 2 */}
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

                      {/* Coluna 3 */}
                      <td className="p-4 align-top">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 ${certStatus.bg}`}>
                          <CertIcon className={`w-4 h-4 ${certStatus.color}`} />
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${certStatus.color}`}>{certStatus.label}</span>
                            <span className="text-[10px] text-gray-400">{client.cert_val ? client.cert_val.split('-').reverse().join('/') : '-'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Coluna 4 (Ações) */}
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(client)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-brand-cyan transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(client.id)}
                            className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
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
            
            {filteredClients.length === 0 && (
              <div className="p-12 text-center text-gray-500 text-sm">
                Nenhum cliente encontrado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
           <div className="bg-surface rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-brand-cyan" />
                  {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

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

              <div className="p-6 overflow-y-auto custom-scrollbar">
                
                {/* ABA 1: DADOS BÁSICOS */}
                {activeTab === 'basic' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Razão Social</label>
                      <input 
                        type="text" 
                        value={formData.razao_social}
                        onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
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
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2 mb-3 text-brand-cyan">
                        <ShieldCheck className="w-5 h-5" />
                        <h3 className="font-bold text-sm">Certificado Digital (A1/A3)</h3>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Validade</label>
                        <input 
                          type="date" 
                          value={formData.cert_val || ''}
                          onChange={(e) => setFormData({...formData, cert_val: e.target.value})}
                          className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan [&::-webkit-calendar-picker-indicator]:invert"
                        />
                      </div>
                    </div>

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
                              value={formData.pref_link}
                              onChange={(e) => setFormData({...formData, pref_link: e.target.value})}
                              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"
                            />
                            {formData.pref_link && (
                              <a href={formData.pref_link} target="_blank" rel="noreferrer" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white">
                                <ExternalLink className="w-5 h-5" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Senha</label>
                          <div className="relative">
                            <input 
                              type={showPassword['modal'] ? "text" : "password"}
                              value={formData.pref_pass}
                              onChange={(e) => setFormData({...formData, pref_pass: e.target.value})}
                              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan pr-10"
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

              <div className="p-6 border-t border-white/10 flex gap-3 bg-surface">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                <button onClick={handleSave} className="flex-1 bg-brand-cyan hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95">Salvar Cliente</button>
              </div>

           </div>
        </div>
      )}
    </div>
  );
}