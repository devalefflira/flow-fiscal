import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ChevronLeft, Plus, Search, Hash, Tag } from 'lucide-react';

export default function TaskCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form para nova categoria
  const [newCat, setNewCat] = useState('');
  const [newSub, setNewSub] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('task_categories')
      .select('*')
      .order('categoria_task', { ascending: true });
    
    if (error) console.error(error);
    else setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newCat.trim() || !newSub.trim()) return alert("Preencha ambos os campos.");

    const { error } = await supabase
      .from('task_categories')
      .insert([{ categoria_task: newCat, subcategoria_task: newSub }]);

    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      setNewCat('');
      setNewSub('');
      fetchCategories();
    }
  };

  const filtered = categories.filter(c => 
    c.categoria_task.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subcategoria_task.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8 font-sans flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Categorias de Tarefas</h1>
              <p className="text-gray-500 text-sm">Padronização de títulos para métricas</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 items-start">
        {/* Formulário de Criação */}
        <div className="bg-surface p-6 rounded-2xl border border-white/10 shadow-lg">
           <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <Plus className="w-5 h-5 text-brand-cyan" /> Nova Padronização
           </h2>
           <form onSubmit={handleSave} className="space-y-4">
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Categoria da Tarefa</label>
                 <input 
                    type="text" 
                    placeholder="Ex: Fiscal, Contábil..." 
                    value={newCat}
                    onChange={e => setNewCat(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan mt-1"
                 />
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Título Padrão (Subcategoria)</label>
                 <input 
                    type="text" 
                    placeholder="Ex: Apuração ICMS, Fechamento..." 
                    value={newSub}
                    onChange={e => setNewSub(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-cyan mt-1"
                 />
              </div>
              <button type="submit" className="w-full bg-brand-cyan hover:bg-cyan-600 text-white font-bold py-2 rounded-xl transition-colors shadow-lg mt-2">
                 Adicionar
              </button>
           </form>
           <p className="text-xs text-gray-500 mt-4 italic text-center">
             * Itens criados não podem ser editados ou excluídos para garantir integridade histórica.
           </p>
        </div>

        {/* Tabela de Listagem */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-white/10 flex flex-col overflow-hidden h-full max-h-[80vh]">
            <div className="p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3 bg-background px-4 py-2 rounded-lg border border-white/10 focus-within:border-brand-cyan w-full max-w-md">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Buscar categoria ou título..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-white w-full outline-none text-sm placeholder-gray-600"
                    />
                </div>
            </div>
            
            <div className="overflow-auto custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-surface z-10">
                        <tr className="text-xs font-bold text-gray-500 uppercase border-b border-white/10">
                            <th className="p-4 w-1/3">Categoria</th>
                            <th className="p-4">Título Padrão</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map(item => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 text-brand-cyan font-bold text-sm">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-3 h-3" /> {item.categoria_task}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-300 text-sm">
                                    {item.subcategoria_task}
                                </td>
                            </tr>
                        ))}
                         {filtered.length === 0 && (
                            <tr>
                                <td colSpan="2" className="p-8 text-center text-gray-500">Nenhum registro encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}