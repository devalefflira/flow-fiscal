import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  ChevronLeft, Plus, Search, Edit2, X, 
  User, Mail, Shield, Power, BadgeCheck, Users as UsersIcon
} from 'lucide-react';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form (access_level, department)
  const initialForm = { 
    id: null, name: '', email: '', role: '', 
    department: 'Fiscal', access_level: 'user', active: true 
  };
  const [formData, setFormData] = useState(initialForm);

  // --- READ ---
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('app_users').select('*').order('name');
    if (error) console.error(error);
    else setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const getInitials = (name) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  // --- SAVE ---
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) return;
    const { id, ...payload } = formData;

    if (isEditing) {
      await supabase.from('app_users').update(payload).eq('id', id);
    } else {
      await supabase.from('app_users').insert([payload]);
    }
    setIsModalOpen(false);
    fetchUsers();
  };

  // --- TOGGLE STATUS ---
  const toggleStatus = async (user) => {
    const newStatus = !user.active;
    // Otimista (muda na tela antes do banco)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: newStatus } : u));
    
    await supabase.from('app_users').update({ active: newStatus }).eq('id', user.id);
  };

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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8 font-sans flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors"><ChevronLeft className="w-6 h-6" /></button>
            <div><h1 className="text-2xl font-bold text-white">Equipe</h1><p className="text-gray-500 text-sm">Gerencie usuários e permissões</p></div>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"><Plus className="w-5 h-5" /> Novo Usuário</button>
      </div>

      <div className="bg-surface p-4 rounded-xl border border-white/5 mb-6">
        <div className="flex items-center gap-3 bg-background px-4 py-3 rounded-lg border border-white/10 focus-within:border-brand-cyan transition-colors">
            <Search className="w-5 h-5 text-gray-500" />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent text-white w-full outline-none placeholder-gray-600" />
        </div>
      </div>

      {loading ? <div className="text-center text-gray-500 animate-pulse">Carregando...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className={`relative bg-surface rounded-2xl border transition-all duration-300 flex flex-col items-center p-6 ${user.active ? 'border-white/5 hover:border-brand-cyan/50 hover:shadow-xl' : 'border-white/5 opacity-60 grayscale'}`}>
              {user.access_level === 'admin' && (<div className="absolute top-4 right-4 text-brand-cyan bg-brand-cyan/10 p-1.5 rounded-lg"><Shield className="w-4 h-4" /></div>)}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg ${user.active ? (user.access_level === 'admin' ? 'bg-gradient-to-br from-brand-cyan to-blue-600 text-white' : 'bg-white/10 text-gray-300') : 'bg-gray-800 text-gray-600'}`}>
                {getInitials(user.name)}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{user.name}</h3>
              <span className="text-xs text-gray-500 mb-4">{user.email}</span>
              <div className="flex gap-2 mb-6">
                <span className="px-2 py-1 rounded bg-white/5 text-[10px] uppercase font-bold text-gray-300 border border-white/5">{user.department}</span>
                <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-medium text-gray-400 border border-white/5">{user.role}</span>
              </div>
              <div className="w-full pt-4 border-t border-white/5 flex justify-between items-center">
                 <button onClick={() => toggleStatus(user)} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${user.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                   <Power className="w-3 h-3" /> {user.active ? 'Ativo' : 'Inativo'}
                 </button>
                 <button onClick={() => handleOpenModal(user)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
           <div className="bg-surface rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><UsersIcon className="w-5 h-5 text-brand-cyan" /> {isEditing ? 'Editar' : 'Novo'} Usuário</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                  <div className="flex items-center gap-3 bg-background px-3 py-2 rounded-lg border border-white/10"><User className="w-4 h-4 text-gray-500" /><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-transparent text-white w-full outline-none" /></div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">E-mail</label>
                  <div className="flex items-center gap-3 bg-background px-3 py-2 rounded-lg border border-white/10"><Mail className="w-4 h-4 text-gray-500" /><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-transparent text-white w-full outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Cargo</label><input type="text" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan" /></div>
                  <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Departamento</label><select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"><option>Fiscal</option><option>Contábil</option><option>RH</option><option>Diretoria</option></select></div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10"><h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Permissões</h3><div className="flex gap-4"><div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Nível</label><div className="flex gap-2"><button onClick={() => setFormData({...formData, access_level: 'user'})} className={`flex-1 py-2 text-xs rounded-lg border ${formData.access_level === 'user' ? 'bg-white/10 border-white text-white' : 'border-white/10 text-gray-500'}`}>Usuário</button><button onClick={() => setFormData({...formData, access_level: 'admin'})} className={`flex-1 py-2 text-xs rounded-lg border ${formData.access_level === 'admin' ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' : 'border-white/10 text-gray-500'}`}>Admin</button></div></div></div></div>
              </div>
              <div className="p-6 border-t border-white/10 flex gap-3 bg-surface">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                <button onClick={handleSave} className="flex-1 bg-brand-cyan hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95">Salvar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}