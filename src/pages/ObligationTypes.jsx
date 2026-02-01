import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  ChevronLeft, Plus, Search, Edit2, Trash2, X, 
  FileText, Calendar, Clock, CheckSquare
} from 'lucide-react';

export default function ObligationTypes() {
  const navigate = useNavigate();
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form (deadline_day, deadline_type)
  const initialForm = { 
    id: null, name: '', recurrence: 'Mensal', 
    deadline_day: 15, deadline_type: 'next_month', regimes: [] 
  };
  const [formData, setFormData] = useState(initialForm);

  const availableRegimes = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI', 'Produtor Rural', 'Isento'];

  // --- READ ---
  const fetchObligations = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('obligation_types').select('*').order('name');
    if (error) console.error(error);
    else setObligations(data);
    setLoading(false);
  };

  useEffect(() => { fetchObligations(); }, []);

  // --- HELPERS ---
  const getRecurrenceStyle = (rec) => {
    switch(rec) {
      case 'Mensal': return 'bg-blue-600';
      case 'Anual': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };
  const getRuleText = (day, type) => `Dia ${day} ${type === 'next_month' ? 'do mês seguinte' : 'do mês corrente'}`;

  const toggleRegime = (regime) => {
    if (formData.regimes.includes(regime)) {
      setFormData({ ...formData, regimes: formData.regimes.filter(r => r !== regime) });
    } else {
      setFormData({ ...formData, regimes: [...formData.regimes, regime] });
    }
  };

  // --- SAVE ---
  const handleSave = async () => {
    if (!formData.name.trim() || formData.regimes.length === 0) return;
    const { id, ...payload } = formData;

    if (isEditing) {
      await supabase.from('obligation_types').update(payload).eq('id', id);
    } else {
      await supabase.from('obligation_types').insert([payload]);
    }
    setIsModalOpen(false);
    fetchObligations();
  };

  // --- DELETE ---
  const handleDelete = async (id) => {
    if (window.confirm('Excluir esta obrigação?')) {
      await supabase.from('obligation_types').delete().eq('id', id);
      fetchObligations();
    }
  };

  const handleOpenModal = (obs = null) => {
    if (obs) {
      setFormData(obs);
      setIsEditing(true);
    } else {
      setFormData(initialForm);
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const filteredObligations = obligations.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-background p-8 font-sans flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors"><ChevronLeft className="w-6 h-6" /></button>
            <div><h1 className="text-2xl font-bold text-white">Tipos de Obrigações</h1><p className="text-gray-500 text-sm">Defina regras de entrega</p></div>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"><Plus className="w-5 h-5" /> Nova Obrigação</button>
      </div>

      <div className="bg-surface p-4 rounded-xl border border-white/5 mb-6">
        <div className="flex items-center gap-3 bg-background px-4 py-3 rounded-lg border border-white/10 focus-within:border-brand-cyan transition-colors">
            <Search className="w-5 h-5 text-gray-500" />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent text-white w-full outline-none placeholder-gray-600" />
        </div>
      </div>

      {loading ? <div className="text-center text-gray-500 animate-pulse">Carregando...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredObligations.map((obs) => (
            <div key={obs.id} className="bg-surface rounded-2xl border border-white/5 overflow-hidden group hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col">
              <div className="p-4 border-b border-white/5 flex justify-between items-start">
                 <span className={`text-[10px] font-bold text-white uppercase px-2 py-1 rounded ${getRecurrenceStyle(obs.recurrence)}`}>{obs.recurrence}</span>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleOpenModal(obs)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-brand-cyan"><Edit2 className="w-3 h-3" /></button>
                   <button onClick={() => handleDelete(obs.id)} className="p-1.5 bg-white/5 hover:bg-red-500/20 rounded text-red-500"><Trash2 className="w-3 h-3" /></button>
                 </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-4">{obs.name}</h3>
                <div className="mb-4">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block mb-2">Regimes Obrigatórios</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(obs.regimes || []).map(r => (<span key={r} className="px-2 py-1 rounded border border-white/10 bg-background/50 text-[10px] text-gray-300">{r}</span>))}
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2 text-gray-400 text-xs bg-white/5 p-2 rounded-lg"><Clock className="w-3 h-3" /><span>Vence: <strong>{getRuleText(obs.deadline_day, obs.deadline_type)}</strong></span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
           <div className="bg-surface rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-brand-cyan" /> {isEditing ? 'Editar' : 'Nova'} Obrigação</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-3 gap-4">
                   <div className="col-span-2 space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Nome</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan" /></div>
                   <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Recorrência</label><select value={formData.recurrence} onChange={(e) => setFormData({...formData, recurrence: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"><option>Mensal</option><option>Bimestral</option><option>Trimestral</option><option>Semestral</option><option>Anual</option></select></div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10"><div className="flex items-center gap-2 mb-3 text-brand-cyan"><Calendar className="w-4 h-4" /><h3 className="font-bold text-sm">Regra de Vencimento</h3></div><div className="flex gap-3"><div className="flex-1"><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Dia</label><input type="number" min="1" max="31" value={formData.deadline_day} onChange={(e) => setFormData({...formData, deadline_day: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan" /></div><div className="flex-[2]"><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Quando</label><select value={formData.deadline_type} onChange={(e) => setFormData({...formData, deadline_type: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"><option value="next_month">Do Mês Seguinte</option><option value="same_month">Do Mês Corrente</option></select></div></div></div>
                <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase">Aplica-se aos Regimes:</label><div className="grid grid-cols-2 gap-2">{availableRegimes.map(regime => (<div key={regime} onClick={() => toggleRegime(regime)} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${formData.regimes.includes(regime) ? 'bg-brand-cyan/20 border-brand-cyan text-white' : 'bg-background border-white/5 text-gray-400 hover:bg-white/5'}`}><div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.regimes.includes(regime) ? 'border-brand-cyan bg-brand-cyan' : 'border-gray-500'}`}>{formData.regimes.includes(regime) && <CheckSquare className="w-3 h-3 text-white" />}</div><span className="text-xs font-medium">{regime}</span></div>))}</div></div>
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