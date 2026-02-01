import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  ChevronLeft, Plus, Search, Edit2, Trash2, X, 
  FileText, Calendar, Landmark, Hash
} from 'lucide-react';

export default function TaxGuides() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- ESTADOS DO MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form (Nomes das colunas SQL: due_day, due_type)
  const initialForm = { 
    id: null, 
    name: '', 
    code: '', 
    agency: 'Federal', 
    due_day: 20, 
    due_type: 'next_month' 
  };
  const [formData, setFormData] = useState(initialForm);

  // --- READ ---
  const fetchGuides = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tax_guides').select('*').order('name');
    if (error) console.error(error);
    else setGuides(data);
    setLoading(false);
  };

  useEffect(() => { fetchGuides(); }, []);

  // --- HELPERS ---
  const getAgencyStyle = (agency) => {
    switch(agency) {
      case 'Federal': return { bg: 'bg-blue-600', label: 'Federal' };
      case 'Estadual': return { bg: 'bg-orange-600', label: 'Estadual' };
      case 'Municipal': return { bg: 'bg-emerald-600', label: 'Municipal' };
      default: return { bg: 'bg-gray-600', label: 'Outros' };
    }
  };

  const getRuleText = (day, type) => {
    const period = type === 'next_month' ? 'do mês seguinte' : 'do mesmo mês';
    return `Dia ${day} ${period}`;
  };

  // --- SAVE ---
  const handleSave = async () => {
    if (!formData.name.trim()) return;
    const { id, ...payload } = formData;

    if (isEditing) {
      await supabase.from('tax_guides').update(payload).eq('id', id);
    } else {
      await supabase.from('tax_guides').insert([payload]);
    }
    setIsModalOpen(false);
    fetchGuides();
  };

  // --- DELETE ---
  const handleDelete = async (id) => {
    if (window.confirm('Excluir esta guia?')) {
      await supabase.from('tax_guides').delete().eq('id', id);
      fetchGuides();
    }
  };

  const handleOpenModal = (guide = null) => {
    if (guide) {
      setFormData(guide);
      setIsEditing(true);
    } else {
      setFormData(initialForm);
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const filteredGuides = guides.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.code && g.code.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-background p-8 font-sans flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Guias de Tributos</h1>
              <p className="text-gray-500 text-sm">Cadastro de impostos e regras de vencimento</p>
            </div>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
          <Plus className="w-5 h-5" /> Nova Guia
        </button>
      </div>

      <div className="bg-surface p-4 rounded-xl border border-white/5 mb-6">
        <div className="flex items-center gap-3 bg-background px-4 py-3 rounded-lg border border-white/10 focus-within:border-brand-cyan transition-colors">
            <Search className="w-5 h-5 text-gray-500" />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent text-white w-full outline-none placeholder-gray-600" />
        </div>
      </div>

      {loading ? <div className="text-center text-gray-500 animate-pulse">Carregando...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGuides.map((guide) => {
            const style = getAgencyStyle(guide.agency);
            return (
              <div key={guide.id} className="bg-surface rounded-2xl border border-white/5 overflow-hidden group hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col">
                <div className={`${style.bg} p-3 flex justify-between items-center`}>
                  <span className="text-xs font-bold text-white uppercase flex items-center gap-1">
                    <Landmark className="w-3 h-3" /> {style.label}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => handleOpenModal(guide)} className="p-1 bg-black/20 hover:bg-black/40 rounded text-white"><Edit2 className="w-3 h-3" /></button>
                     <button onClick={() => handleDelete(guide.id)} className="p-1 bg-black/20 hover:bg-red-500/80 rounded text-white"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                     <div className="bg-white/5 px-2 py-1 rounded text-[10px] font-mono text-gray-400 border border-white/5 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> {guide.code || 'S/C'}
                     </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-4 leading-tight">{guide.name}</h3>
                  <div className="mt-auto bg-background/50 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                     <div className="bg-brand-cyan/10 p-2 rounded-lg text-brand-cyan"><Calendar className="w-5 h-5" /></div>
                     <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold block">Vencimento Padrão</span>
                        <span className="text-sm font-bold text-gray-200">{getRuleText(guide.due_day, guide.due_type)}</span>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
           <div className="bg-surface rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-brand-cyan" /> {isEditing ? 'Editar' : 'Nova'} Guia</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Código</label>
                    <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Órgão</label>
                    <select value={formData.agency} onChange={(e) => setFormData({...formData, agency: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan">
                      <option value="Federal">Federal</option>
                      <option value="Estadual">Estadual</option>
                      <option value="Municipal">Municipal</option>
                    </select>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-2">
                   <div className="flex items-center gap-2 mb-3 text-brand-cyan"><Calendar className="w-4 h-4" /><h3 className="font-bold text-sm">Regra de Vencimento</h3></div>
                   <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Dia</label>
                        <input type="number" min="1" max="31" value={formData.due_day} onChange={(e) => setFormData({...formData, due_day: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan" />
                      </div>
                      <div className="flex-[2]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Período</label>
                        <select value={formData.due_type} onChange={(e) => setFormData({...formData, due_type: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan">
                          <option value="same_month">Do Mês Atual</option>
                          <option value="next_month">Do Mês Seguinte</option>
                        </select>
                      </div>
                   </div>
                </div>
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