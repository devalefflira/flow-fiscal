import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // <--- Importamos o cliente
import { 
  ChevronLeft, Plus, X, Trash2, Edit2,
  Tag, FileText, DollarSign, AlertCircle, 
  CheckSquare, Bookmark, Briefcase, Archive,
  PieChart, Settings, Users, Layers
} from 'lucide-react';

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true); // Estado de carregamento

  // --- ESTADOS DO MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State (Ajustei os nomes para bater com o Banco de Dados: description, department)
  const initialForm = { id: null, name: '', icon: 'tag', color: 'bg-gray-600', description: '', department: 'Fiscal' };
  const [formData, setFormData] = useState(initialForm);

  // --- 1. BUSCAR DADOS (READ) ---
  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true }); // Ordenar por ID ou Nome

    if (error) console.error('Erro ao buscar:', error);
    else setCategories(data);
    setLoading(false);
  };

  // Carrega os dados assim que a tela abre
  useEffect(() => {
    fetchCategories();
  }, []);

  // --- MAPA DE ÍCONES ---
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

  // --- 2. SALVAR (CREATE / UPDATE) ---
  const handleSave = async () => {
    if (!formData.name.trim()) return;

    const payload = {
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      description: formData.description,
      department: formData.department
    };

    if (isEditing) {
      // Update
      const { error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', formData.id);
      
      if (error) alert('Erro ao atualizar!');
    } else {
      // Create
      const { error } = await supabase
        .from('categories')
        .insert([payload]);

      if (error) alert('Erro ao criar!');
    }

    setIsModalOpen(false);
    fetchCategories(); // Recarrega a lista
  };

  // --- 3. DELETAR (DELETE) ---
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) alert('Erro ao excluir!');
      else fetchCategories(); // Recarrega a lista
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

      {/* LOADING STATE */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 animate-pulse">
          Carregando dados...
        </div>
      ) : (
        /* GRID DE CARDS */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className={`${cat.color} rounded-2xl p-6 relative group transition-transform hover:-translate-y-1 hover:shadow-2xl flex flex-col items-center text-center overflow-hidden border border-white/10`}
            >
              <div className="absolute -right-4 -bottom-4 text-white opacity-10 transform rotate-12 scale-150 pointer-events-none">
                {iconMap[cat.icon] || <Tag />}
              </div>

              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(cat)} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white backdrop-blur-sm">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 bg-black/20 hover:bg-red-500/80 rounded-lg text-white backdrop-blur-sm">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 shadow-inner backdrop-blur-md text-white">
                {iconMap[cat.icon] ? React.cloneElement(iconMap[cat.icon], { className: "w-8 h-8" }) : <Tag className="w-8 h-8"/>}
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{cat.name}</h3>
              <p className="text-white/80 text-xs line-clamp-2">{cat.description || 'Sem descrição.'}</p>
              
              <div className="mt-4 px-3 py-1 bg-black/20 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                {cat.department}
              </div>
            </div>
          ))}

          {/* Card de Adicionar (Fantasma) */}
          <button 
            onClick={() => handleOpenModal()}
            className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-white hover:border-brand-cyan hover:bg-white/5 transition-all group min-h-[240px]"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-brand-cyan/20 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm">Adicionar</span>
          </button>
        </div>
      )}

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

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                   <div className="col-span-2 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan"
                      />
                   </div>
                   <div className="col-span-1 space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Depto.</label>
                      <input 
                        type="text" 
                        value={formData.department}
                        disabled
                        className="w-full bg-background/50 border border-white/5 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed text-center"
                      />
                   </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Descrição</label>
                  <textarea 
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan resize-none"
                  />
                </div>

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
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSave} className="flex-1 bg-brand-cyan hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95">
                  Salvar
                </button>
              </div>

           </div>
        </div>
      )}

    </div>
  );
}