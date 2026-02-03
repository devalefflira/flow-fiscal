import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <--- Importação corrigida
import { format, intervalToDuration } from 'date-fns';
import { 
  ChevronLeft, FileText, Calendar, Download, Printer, Loader2 
} from 'lucide-react';

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // --- LÓGICA DE DADOS ---
  const fetchReportData = async () => {
    setLoading(true);
    try {
      // 1. DADOS DAS TAREFAS (Filtrar por data de conclusão = data selecionada)
      const startOfDay = `${selectedDate}T00:00:00`;
      const endOfDay = `${selectedDate}T23:59:59`;

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          clients (razao_social),
          categories (name)
        `)
        .eq('status', 'done')
        .gte('completed_at', startOfDay)
        .lte('completed_at', endOfDay)
        .order('completed_at', { ascending: true });

      if (tasksError) throw tasksError;

      // 2. DADOS DO FECHAMENTO FISCAL (Pela competência da data selecionada)
      const competence = selectedDate.slice(0, 7) + '-01';
      
      const { data: closings, error: closingsError } = await supabase
        .from('fiscal_closings')
        .select(`
          *,
          clients (razao_social, regime)
        `)
        .eq('competence', competence);

      if (closingsError) throw closingsError;

      return { tasks, closings };

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao buscar dados: " + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER TEMPO ---
  const calculateNetTime = (task) => {
    if (!task.started_at || !task.completed_at) return '-';
    const start = new Date(task.started_at).getTime();
    const end = new Date(task.completed_at).getTime();
    const totalPause = task.total_pause || 0;
    const netMs = Math.max(0, (end - start) - totalPause);
    
    if (netMs === 0) return '0 min';
    
    const duration = intervalToDuration({ start: 0, end: netMs });
    const hours = duration.hours || 0;
    const minutes = duration.minutes || 0;
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  // --- GERAÇÃO DO PDF ---
  const generatePDF = async () => {
    const data = await fetchReportData();
    if (!data) return;

    const { tasks, closings } = data;
    const doc = new jsPDF();

    // -- CABEÇALHO --
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("Relatório Diário de Tarefas e Fechamento", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data de Referência: ${format(new Date(selectedDate), 'dd/MM/yyyy')}`, 14, 28);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 33);

    let finalY = 40;

    // -- SEÇÃO 1: TAREFAS EXECUTADAS --
    doc.setFontSize(14);
    doc.setTextColor(0); // Preto
    doc.text("1. Tarefas Executadas (Neste Dia)", 14, finalY);
    
    // Preparar dados da tabela
    const tasksTableBody = tasks.map(t => [
        format(new Date(t.completed_at), 'HH:mm'), // Hora Fim
        t.title,
        t.clients?.razao_social || 'Geral',
        calculateNetTime(t),
        t.categories?.name || '-'
    ]);

    // CORREÇÃO AQUI: autoTable(doc, options)
    autoTable(doc, {
        startY: finalY + 5,
        head: [['Hora', 'Título', 'Cliente', 'Tempo', 'Origem']],
        body: tasksTableBody,
        theme: 'grid',
        headStyles: { fillColor: [8, 145, 178] }, // Brand Cyan
        styles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 20 }, 3: { cellWidth: 25 } }
    });

    finalY = doc.lastAutoTable.finalY + 15;

    // -- SEÇÃO 2: FECHAMENTO FISCAL --
    doc.setFontSize(14);
    doc.text(`2. Fechamento Fiscal (Competência ${format(new Date(selectedDate), 'MM/yyyy')})`, 14, finalY);

    // Filtros e Totais
    const doneClosings = closings.filter(c => c.status === 'done');
    const manualImports = closings.filter(c => c.import_type === 'manual').length;
    const autoImports = closings.filter(c => c.import_type === 'automatic').length;
    const totalClients = closings.length;
    const pendingClients = totalClients - doneClosings.length;

    // Tabela de Concluídos
    const closingsTableBody = doneClosings.map(c => [
        c.clients?.razao_social,
        c.clients?.regime,
        c.import_type === 'automatic' ? 'Auto' : 'Manual',
        c.completed_at ? format(new Date(c.completed_at), 'dd/MM HH:mm') : '-'
    ]);

    if (doneClosings.length > 0) {
        // CORREÇÃO AQUI: autoTable(doc, options)
        autoTable(doc, {
            startY: finalY + 5,
            head: [['Cliente', 'Regime', 'Importação', 'Conclusão']],
            body: closingsTableBody,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] }, // Emerald Green
            styles: { fontSize: 8 }
        });
        finalY = doc.lastAutoTable.finalY + 10;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Nenhum fechamento concluído nesta competência ainda.", 14, finalY + 10);
        finalY += 20;
    }

    // -- RESUMO TOTALIZADOR --
    // Verifica se cabe na página, senão cria nova
    if (finalY > 250) {
        doc.addPage();
        finalY = 20;
    }

    doc.setFillColor(245, 245, 245);
    doc.rect(14, finalY, 180, 40, 'F'); // Box cinza
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Resumo do Fechamento", 20, finalY + 10);

    doc.setFontSize(10);
    doc.text(`Total de Clientes na Competência: ${totalClients}`, 20, finalY + 20);
    doc.text(`Pendentes/Em Andamento: ${pendingClients}`, 20, finalY + 26);
    doc.text(`Finalizados: ${doneClosings.length}`, 100, finalY + 20);
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`(Importações: ${autoImports} Auto / ${manualImports} Manuais)`, 100, finalY + 26);

    // -- OPEN IN NEW TAB (PREVIEW) --
    window.open(doc.output('bloburl'), '_blank');
  };

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={() => navigate('/home')} className="bg-surface hover:bg-surfaceHover p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Relatórios</h1>
              <p className="text-gray-500 text-sm">Central de exportação de dados</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* CARD DE RELATÓRIO DIÁRIO */}
          <div className="bg-surface border border-white/10 rounded-2xl p-6 hover:border-brand-cyan/50 transition-all shadow-lg group">
              <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-brand-cyan/10 rounded-xl text-brand-cyan group-hover:bg-brand-cyan group-hover:text-white transition-colors">
                      <FileText className="w-8 h-8" />
                  </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Relatório Diário</h3>
              <p className="text-gray-400 text-sm mb-6">
                  Tarefas executadas no dia e status do fechamento fiscal da competência atual.
              </p>

              <div className="space-y-4">
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data de Referência</label>
                      <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg p-2 focus-within:border-brand-cyan">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <input 
                              type="date" 
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className="bg-transparent text-white outline-none w-full text-sm [&::-webkit-calendar-picker-indicator]:invert"
                          />
                      </div>
                  </div>

                  <button 
                    onClick={generatePDF}
                    disabled={loading}
                    className="w-full bg-brand-cyan hover:bg-cyan-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                      Visualizar e Gerar PDF
                  </button>
              </div>
          </div>

          {/* PLACEHOLDER PARA FUTUROS RELATÓRIOS */}
          <div className="bg-surface/30 border border-white/5 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-50">
              <div className="p-3 bg-white/5 rounded-xl mb-4">
                  <Download className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-400 mb-1">Novos Relatórios</h3>
              <p className="text-gray-600 text-xs">Em breve: Relatórios de Omissos e Parcelamentos.</p>
          </div>

      </div>
    </div>
  );
}