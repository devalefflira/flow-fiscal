import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Plus, Search, Edit2, Trash2, X, 
  User, Mail, Briefcase, Shield, Check, Power,
  BadgeCheck, Users as UsersIcon
} from 'lucide-react';

export default function Users() {
  const navigate = useNavigate();

  // --- MOCK DATA ---
  const [users, setUsers] = useState([
    { 
      id: 1, 
      name: 'Marcos Silva', 
      email: 'marcos@flowfiscal.com', 
      role: 'CEO / Contador', 
      dept: 'Diretoria',
      access: 'admin', // admin ou user
      active: true
    },
    { 
      id: 2, 
      name: 'Ana Pereira', 
      email: 'ana.fiscal@flowfiscal.com', 
      role: 'Analista Fiscal', 
      dept: 'Fiscal',
      access: 'user',
      active: true
    },
    { 
      id: 3, 
      name: 'João Souza', 
      email: 'joao.estagiario@flowfiscal.com', 
      role: 'Estagiário', 
      dept: 'Contábil',
      access: 'user',
      active: false // Inativo
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  
  // --- ESTADOS DO MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const initialForm = { 
    id: null, 
    name: '', 
    email: '', 
    role: '', 
    dept: 'Fiscal', 
    access: 'user', 
    active: true 
  };
  const [formData, setFormData] = useState(initialForm);

  // --- HELPERS ---
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // --- AÇÕES ---
  const handleOpenModal = (user = null) => {
    if (user) {
      setFormData(user);
      setIsEditing(true);
    } else {
      setFormData(initialForm);
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (isEditing) {
      setUsers(prev => prev.map(u => u.id === formData.id ? formData : u));
    } else {
      const newId = Math.max(...users.map(u => u.id), 0) + 1;
      setUsers([...users, { ...formData, id: newId }]);
    }
    setIsModalOpen(false);
  };

  const toggleStatus = (id) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, active: !u.active } : u
    ));
  };

  // Filtro
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h1 className="text-2xl font-bold text-white">Equipe</h1>
              <p className="text-gray-500 text-sm">Gerencie usuários e permissões de acesso</p>
            </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" /> Novo Usuário
        </button>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="bg-surface p-4 rounded-xl border border-white/5 mb-6">
        <div className="flex items-center gap-3 bg-background px-4 py-3 rounded-lg border border-white/10 focus-within:border-brand-cyan transition-colors">
            <Search className="w-5 h-5 text-gray-500" />
            <input 
                type="text" 
                placeholder="Buscar por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-white w-full outline-none placeholder-gray-600"
            />
        </div>
      </div>

      {/* GRID DE CARDS (Estilo Crachá) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredUsers.map((user) => (
          <div 
            key={user.id} 
            className={`
              relative bg-surface rounded-2xl border transition-all duration-300 flex flex-col items-center p-6
              ${user.active ? 'border-white/5 hover:border-brand-cyan/50 hover:shadow-xl' : 'border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}
            `}
          >
            {/* Badge Admin */}
            {user.access === 'admin' && (
              <div className="absolute top-4 right-4 text-brand-cyan bg-brand-cyan/10 p-1.5 rounded-lg" title="Administrador">
                <Shield className="w-4 h-4" />
              </div>
            )}

            {/* Avatar / Iniciais */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg
              ${user.active 
                ? (user.access === 'admin' ? 'bg-gradient-to-br from-brand-cyan to-blue-600 text-white' : 'bg-white/10 text-gray-300') 
                : 'bg-gray-800 text-gray-600'}
            `}>
              {getInitials(user.name)}
            </div>

            {/* Dados Principais */}
            <h3 className="text-lg font-bold text-white mb-1">{user.name}</h3>
            <span className="text-xs text-gray-500 mb-4">{user.email}</span>

            {/* Tags de Cargo e Depto */}
            <div className="flex gap-2 mb-6">
              <span className="px-2 py-1 rounded bg-white/5 text-[10px] uppercase font-bold text-gray-300 border border-white/5">
                {user.dept}
              </span>
              <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-medium text-gray-400 border border-white/5">
                {user.role}
              </span>
            </div>

            {/* Ações e Status */}
            <div className="w-full pt-4 border-t border-white/5 flex justify-between items-center">
               
               {/* Botão Switch de Ativar/Inativar */}
               <button 
                 onClick={() => toggleStatus(user.id)}
                 className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-colors
                   ${user.active ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}
                 `}
               >
                 <Power className="w-3 h-3" />
                 {user.active ? 'Ativo' : 'Inativo'}
               </button>

               {/* Botão Editar */}
               <button 
                 onClick={() => handleOpenModal(user)}
                 className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
               >
                 <Edit2 className="w-4 h-4" />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
           <div className="bg-surface rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden">
              
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-brand-cyan" />
                  {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                
                {/* Nome */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
                  <div className="flex items-center gap-3 bg-background px-3 py-2 rounded-lg border border-white/10 focus-within:border-brand-cyan transition-colors">
                    <User className="w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-transparent text-white w-full outline-none"
                      placeholder="Ex: Ana Silva"
                    />
                  </div>
                </div>

                {/* E-mail */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">E-mail Corporativo</label>
                  <div className="flex items-center gap-3 bg-background px-3 py-2 rounded-lg border border-white/10 focus-within:border-brand-cyan transition-colors">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-transparent text-white w-full outline-none"
                      placeholder="ana@empresa.com"
                    />
                  </div>
                </div>

                {/* Cargo e Depto */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Cargo</label>
                    <input 
                      type="text" 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"
                      placeholder="Ex: Analista"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Departamento</label>
                    <select 
                      value={formData.dept}
                      onChange={(e) => setFormData({...formData, dept: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"
                    >
                      <option value="Fiscal">Fiscal</option>
                      <option value="Contábil">Contábil</option>
                      <option value="RH">RH</option>
                      <option value="Diretoria">Diretoria</option>
                    </select>
                  </div>
                </div>

                {/* Permissões e Status */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                   <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Acesso e Permissões</h3>
                   
                   <div className="flex gap-4">
                      {/* Nível de Acesso */}
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Nível</label>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => setFormData({...formData, access: 'user'})}
                             className={`flex-1 py-2 text-xs rounded-lg border transition-colors ${formData.access === 'user' ? 'bg-white/10 border-white text-white' : 'border-white/10 text-gray-500'}`}
                           >
                             Usuário
                           </button>
                           <button 
                             onClick={() => setFormData({...formData, access: 'admin'})}
                             className={`flex-1 py-2 text-xs rounded-lg border transition-colors ${formData.access === 'admin' ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' : 'border-white/10 text-gray-500'}`}
                           >
                             Admin
                           </button>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex-1 space-y-1">
                         <label className="text-[10px] font-bold text-gray-500 uppercase">Status Inicial</label>
                         <button 
                           onClick={() => setFormData({...formData, active: !formData.active})}
                           className={`w-full py-2 text-xs rounded-lg border flex items-center justify-center gap-2 transition-colors
                             ${formData.active ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-red-500/10 border-red-500 text-red-500'}
                           `}
                         >
                           {formData.active ? <BadgeCheck className="w-3 h-3"/> : <Power className="w-3 h-3"/>}
                           {formData.active ? 'Ativo' : 'Inativo'}
                         </button>
                      </div>
                   </div>
                </div>

              </div>

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
                  Salvar Usuário
                </button>
              </div>

           </div>
        </div>
      )}

    </div>
  );
}