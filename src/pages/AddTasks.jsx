import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Conexão com o banco
import { 
  ChevronLeft, Calendar, User, Tag, 
  AlignLeft, AlertCircle, Check, Clock 
} from 'lucide-react';

export default function AddTask() {
  const navigate = useNavigate();
  
  // Listas para os Selects (Vêm do Banco)
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Formulário
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    category_id: '',
    priority: 'Média',
    due_date: ''
  });

  // --- 1. BUSCAR DADOS (Clientes e Categorias) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        
        // Busca Clientes
        const { data: clientsData, error: clientError } = await supabase
          .from('clients')
          .select('id, razao_social')
          .order('razao_social');
        
        if (clientError) throw clientError;

        // Busca Categorias
        const { data: categoriesData, error: catError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');

        if (catError) throw catError;

        setClients(clientsData || []);
        setCategories(categoriesData || []);

      } catch (error) {
        console.error('Erro ao carregar dados:', error.message);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // --- 2. SALVAR TAREFA ---
  const handleSave = async () => {
    // Validação básica
    if (!formData.title.trim()) {
      alert('Por favor, dê um título para a tarefa.');
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        due_date: formData.due_date || null, // Se vazio, envia null
        status: 'todo', // Sempre nasce como "Pendente"
        // Se o ID for string vazia, envia null, senão envia o número
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
      };

      const { error } = await supabase
        .from('tasks')
        .insert([payload]);

      if (error) throw error;

      // Sucesso! Redireciona para o Dashboard
      navigate('/dashboard/tarefas');

    } catch (error) {
      console.error('Erro ao salvar tarefa:', error.message);
      alert('Erro ao salvar: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 font-sans flex flex-col items-center">
      
      {/* Container Centralizado */}
      <div className="w-full max-w-2xl">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="bg-surface hover:bg-surfaceHover p-3 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/5"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Nova Tarefa</h1>
            <p className="text-gray-500">Adicione uma demanda ao quadro</p>
          </div>
        </div>

        {/* Card do Formulário */}
        <div className="bg-surface p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          
          {/* Inputs */}
          <div className="space-y-6 relative z-10">
            
            {/* Título */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-cyan uppercase tracking-wider ml-1">O que precisa ser feito?</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                autoFocus
                placeholder="Ex: Fechamento Fiscal TechSolutions"
                className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-white text-lg outline-none focus:border-brand-cyan transition-colors placeholder-gray-600"
              />
            </div>

            {/* Grid: Cliente e Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Cliente */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <User className="w-3 h-3" /> Cliente Vinculado
                </label>
                <div className="relative">
                  <select 
                    value={formData.client_id}
                    onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-brand-cyan appearance-none cursor-pointer"
                    disabled={loadingData}
                  >
                    <option value="">Sem vínculo</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.razao_social}
                      </option>
                    ))}
                  </select>
                  {/* Seta Customizada */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                  </div>
                </div>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <Tag className="w-3 h-3" /> Categoria
                </label>
                <div className="relative">
                  <select 
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-brand-cyan appearance-none cursor-pointer"
                    disabled={loadingData}
                  >
                    <option value="">Geral</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                  </div>
                </div>
              </div>

            </div>

            {/* Grid: Prioridade e Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Prioridade */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" /> Prioridade
                </label>
                <div className="flex gap-3">
                  {['Baixa', 'Média', 'Alta'].map((prio) => (
                    <button
                      key={prio}
                      onClick={() => setFormData({...formData, priority: prio})}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all
                        ${formData.priority === prio 
                          ? (prio === 'Alta' ? 'bg-red-500/20 border-red-500 text-red-500' : 
                             prio === 'Média' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 
                             'bg-emerald-500/20 border-emerald-500 text-emerald-500')
                          : 'bg-background border-white/10 text-gray-500 hover:bg-white/5'}
                      `}
                    >
                      {prio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data de Entrega */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Prazo Limite
                </label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-brand-cyan [&::-webkit-calendar-picker-indicator]:invert"
                  />
                  {!formData.due_date && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <Calendar className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                <AlignLeft className="w-3 h-3" /> Detalhes
              </label>
              <textarea 
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o que precisa ser feito..."
                className="w-full bg-background border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-brand-cyan transition-colors resize-none placeholder-gray-600"
              />
            </div>

            {/* Botão Salvar */}
            <button 
              onClick={handleSave}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 mt-4"
            >
              <Check className="w-6 h-6" />
              Salvar Tarefa
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}