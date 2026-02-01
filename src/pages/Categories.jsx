import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Plus, X, Trash2, Edit2,
  Tag, FileText, DollarSign, AlertCircle, 
  CheckSquare, Bookmark, Briefcase, Archive,
  PieChart, Settings, Users, Layers
} from 'lucide-react';

export default function Categories() {
  const navigate = useNavigate();

  // --- MOCK DATA ---
  const [categories, setCategories] = useState([
    { id: 1, name: 'Impostos', icon: 'dollar', color: 'bg-emerald-600', desc: 'Guias e tributos a pagar', dept: 'Fiscal' },
    { id: 2, name: 'Obrigações', icon: 'file', color: 'bg-blue-600', desc: 'Declarações acessórias (SPED, DCTF)', dept: 'Fiscal' },
    { id: 3, name: 'Atendimento', icon: 'users', color: 'bg-purple-600', desc: 'Dúvidas e solicitações de clientes', dept: 'Fiscal' },
    { id: 4, name: 'Urgente', icon: 'alert', color: 'bg-red-600', desc: 'Prioridade máxima / Risco', dept: 'Fiscal' },
  ]);

  // --- ESTADOS DO MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const initialForm = { id: null, name: '', icon: 'tag', color: 'bg-gray-600', desc: '', dept: 'Fiscal' };
  const [formData, setFormData] = useState(initialForm);

  // --- MAPA DE ÍCONES DISPONÍVEIS ---
  const iconMap = {
    tag: <Tag className="w-6 h-6" />,
    file: <FileText className="w-6 h-6" />,
    dollar: <DollarSign className="w-6 h-6" />,
    alert: <AlertCircle className="w-6 h-6" />,
    check: <CheckSquare className="w-6 h-6" />,
    bookmark: <Bookmark className="w-6 h-6" />,
    briefcase: <Briefcase className="w-6 h-6" />,
    archive: <Archive className="w-6 h-6" />,
    chart: <PieChart className="w-6 h-6" />,
    settings: <Settings className="w-6 h-6" />,
    users: <Users className="w-6 h-6" />,
    layers: <Layers className="w-6 h-6" />,
  };

  // --- PALETA DE CORES ---
  const colorPalette = [
    'bg-red-600', 'bg-orange-600', 'bg-amber-500', 
    'bg-emerald-600', 'bg-teal-600', 'bg-cyan-600',
    'bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 
    'bg-pink-600', 'bg-rose-600', 'bg-gray-600'
  ];

  // --- AÇÕES ---
  const handleOpenModal = (category = null) => {
    if (category) {
      setFormData(category);
      setIsEditing(true);
    } else {
      setFormData(initialForm);
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (isEditing) {
      setCategories(prev => prev.map(c => c.id === formData.id ? formData : c));
    } else {
      const newId = Math.max(...categories.map(c => c.id), 0) + 1;
      setCategories([...categories, { ...formData, id: newId }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 font-sans flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Categorias</h1>
              <p className="text-gray-500 text-sm">Organize tarefas e processos fiscais</p>
            </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" /> Nova Categoria
        </button>
      </div>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <div 
            key={cat.id} 
            className={`${cat.color} rounded-2xl p-6 relative group transition-transform hover:-translate-y-1 hover:shadow-2xl flex flex-col items-center text-center overflow-hidden border border-white/10`}
          >
            {/* Efeito de Fundo */}
            <div className="absolute -right-4 -bottom-4 text-white opacity-10 transform rotate-12 scale-150 pointer-events-none">
              {iconMap[cat.icon]}
            </div>

            {/* Ações (Hover) */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenModal(cat)} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white backdrop-blur-sm">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="p-1.5 bg-black/20 hover:bg-red-500/80 rounded-lg text-white backdrop-blur-sm">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Ícone Central */}
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 shadow-inner backdrop-blur-md text-white">
              {React.cloneElement(iconMap[cat.icon], { className: "w-8 h-8" })}
            </div>

            {/* Conteúdo */}
            <h3 className="text-xl font-bold text-white mb-1">{cat.name}</h3>
            <p className="text-white/80 text-xs line-clamp-2">{cat.desc || 'Sem descrição.'}</p>
            
            <div className="mt-4 px-3 py-1 bg-black/20 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
              {cat.dept}
            </div>
          </div>
        ))}

        {/* Card de Adicionar (Fantasma) */}
        <button 
          onClick={() => handleOpenModal()}
          className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-white hover:border-brand-cyan hover:bg-white/5 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-brand-cyan/20 flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-bold text-sm">Adicionar</span>
        </button>
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
           <div className="bg-surface p-6 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl relative flex flex-col gap-6">
              
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Preview do Card no Modal */}
              <div className="flex justify-center mb-2">
                 <div className={`${formData.color} w-full h-24 rounded-xl flex items-center justify-center gap-4 text-white shadow-lg border border-white/10 transition-colors`}>
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                       {iconMap[formData.icon]}
                    </div>
                    <div className="text-left">
                       <span className="block font-bold text-lg">{formData.name || 'Nome da Categoria'}</span>
                       <span className="block text-xs opacity-80">{formData.dept}</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                {/* Nome & Departamento */}
                <div className="grid grid-cols-3 gap-4">
                   <div className="col-span-2 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"
                        placeholder="Ex: Impostos"
                      />
                   </div>
                   <div className="col-span-1 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Depto.</label>
                      <input 
                        type="text" 
                        value={formData.dept}
                        disabled
                        className="w-full bg-background/50 border border-white/5 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed text-center"
                      />
                   </div>
                </div>

                {/* Descrição */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Descrição</label>
                  <textarea 
                    rows="2"
                    value={formData.desc}
                    onChange={(e) => setFormData({...formData, desc: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan resize-none"
                    placeholder="Para que serve esta categoria?"
                  />
                </div>

                {/* Seletor de Ícone */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Ícone</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(iconMap).map(key => (
                      <button
                        key={key}
                        onClick={() => setFormData({...formData, icon: key})}
                        className={`p-2 rounded-lg transition-all ${formData.icon === key ? 'bg-brand-cyan text-white scale-110 shadow-lg' : 'bg-background text-gray-500 hover:text-white hover:bg-white/10'}`}
                      >
                        {React.cloneElement(iconMap[key], { className: "w-5 h-5" })}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seletor de Cor */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Cor da Etiqueta</label>
                  <div className="flex flex-wrap gap-2">
                    {colorPalette.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData({...formData, color: color})}
                        className={`w-8 h-8 rounded-full transition-transform ${color} border-2 ${formData.color === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                      />
                    ))}
                  </div>
                </div>

              </div>

              <div className="flex gap-3 pt-2">
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
                  Salvar
                </button>
              </div>

           </div>
        </div>
      )}

    </div>
  );
}