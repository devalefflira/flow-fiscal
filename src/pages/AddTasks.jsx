import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  ChevronLeft, User, Tag, AlignLeft, 
  Check, ListTodo, Plus, X, LayoutGrid 
} from 'lucide-react';

export default function AddTask() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Estado do Checklist
  const [checklistInput, setChecklistInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    category_id: '',
    quadrant: 2, // Padrão: Q2 (Agendar)
    due_date: '',
    checklist: [] // Array de objetos { text:Str, done:Bool }
  });

  // --- 1. BUSCAR DADOS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const { data: clientsData } = await supabase.from('clients').select('id, razao_social').order('razao_social');
        const { data: categoriesData } = await supabase.from('categories').select('id, name').order('name');
        setClients(clientsData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. FUNÇÕES DE CHECKLIST ---
  const addChecklistItem = (e) => {
    e.preventDefault();
    if (!checklistInput.trim()) return;
    
    const newItem = { text: checklistInput, done: false };
    setFormData({ ...formData, checklist: [...formData.checklist, newItem] });
    setChecklistInput('');
  };

  const removeChecklistItem = (index) => {
    const updated = formData.checklist.filter((_, i) => i !== index);
    setFormData({ ...formData, checklist: updated });
  };

  // --- 3. SALVAR ---
  const handleSave = async () => {
    if (!formData.title.trim()) return alert('Dê um título para a tarefa.');

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        quadrant: formData.quadrant, // Salva o número do quadrante
        checklist: formData.checklist, // Salva o array de subtarefas
        due_date: formData.due_date || null,
        status: 'todo',
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
      };

      const { error } = await supabase.from('tasks').insert([payload]);
      if (error) throw error;

      navigate('/tarefas/matriz'); // Vai para a Matriz após salvar

    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  // Definição visual dos Quadrantes
  const quadrants = [
    { id: 1, label: 'Q1', title: 'Fazer Agora', desc: 'Urgente e Importante', color: 'bg-red-500/20 border-red-500 text-red-500' },
    { id: 2, label: 'Q2', title: 'Agendar', desc: 'Importante, Não Urgente', color: 'bg-blue-500/20 border-blue-500 text-blue-500' },
    { id: 3, label: 'Q3', title: 'Delegar', desc: 'Urgente, Não Importante', color: 'bg-yellow-500/20 border-yellow-500 text-yellow-500' },
    { id: 4, label: 'Q4', title: 'Eliminar', desc: 'Nem Urgente, Nem Importante', color: 'bg-gray-500/20 border-gray-500 text-gray-500' },
  ];

  return (
    <div className="min-h-screen bg-background p-8 font-sans flex flex-col items-center">
      <div className="w-full max-w-3xl">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="bg-surface hover:bg-surfaceHover p-3 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/5">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Nova Tarefa</h1>
            <p className="text-gray-500">Adicione à Matriz de Eisenhower</p>
          </div>
        </div>

        <div className="bg-surface p-8 rounded-3xl border border-white/10 shadow-2xl relative">
          <div className="space-y-6">
            
            {/* Título */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-cyan uppercase ml-1">O que precisa ser feito?</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                autoFocus
                placeholder="Ex: Fechamento Fiscal"
                className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-white text-lg outline-none focus:border-brand-cyan"
              />
            </div>

            {/* Seleção de Quadrante */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-2">
                <LayoutGrid className="w-3 h-3" /> Prioridade (Matriz de Eisenhower)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {quadrants.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setFormData({...formData, quadrant: q.id})}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1
                      ${formData.quadrant === q.id ? q.color + ' ring-1 ring-offset-1 ring-offset-background ' + q.color.split(' ')[2] : 'bg-background border-white/10 text-gray-500 hover:bg-white/5'}
                    `}
                  >
                    <span className="font-bold text-sm flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-black/20">{q.label}</span> {q.title}
                    </span>
                    <span className="text-[10px] opacity-80">{q.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cliente e Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-2"><User className="w-3 h-3" /> Cliente</label>
                <select 
                  value={formData.client_id}
                  onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                  className="w-full bg-background border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-brand-cyan appearance-none"
                >
                  <option value="">Sem vínculo</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-2"><Tag className="w-3 h-3" /> Categoria</label>
                <select 
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  className="w-full bg-background border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-brand-cyan appearance-none"
                >
                  <option value="">Geral</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-2"><AlignLeft className="w-3 h-3" /> Descrição</label>
              <textarea 
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-background border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-brand-cyan resize-none"
              />
            </div>

            {/* Checklist */}
            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
               <label className="text-xs font-bold text-brand-cyan uppercase ml-1 flex items-center gap-2">
                  <ListTodo className="w-4 h-4" /> Checklist / Subtarefas
               </label>
               
               {/* Input para adicionar */}
               <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addChecklistItem(e)}
                    placeholder="Adicionar item..."
                    className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-cyan"
                  />
                  <button onClick={addChecklistItem} className="bg-brand-cyan text-white p-2 rounded-lg hover:bg-cyan-600"><Plus className="w-4 h-4" /></button>
               </div>

               {/* Lista de Itens Adicionados */}
               <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {formData.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-background/50 p-2 rounded border border-white/5">
                       <span className="text-sm text-gray-300 pl-2">• {item.text}</span>
                       <button onClick={() => removeChecklistItem(idx)} className="text-gray-500 hover:text-red-500 p-1"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                  {formData.checklist.length === 0 && <p className="text-xs text-gray-600 italic pl-1">Nenhum item adicionado.</p>}
               </div>
            </div>

            <button onClick={handleSave} className="w-full bg-primary hover:bg-primary-hover text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3">
              <Check className="w-6 h-6" /> Salvar Tarefa
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}