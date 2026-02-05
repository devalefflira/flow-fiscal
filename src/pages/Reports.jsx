import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { 
  ChevronLeft, FileText, Calendar, Download, Printer, Loader2, Activity, Filter, Infinity as InfinityIcon
} from 'lucide-react';

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Estados para Relatório Diário / Performance
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Estados para Relatório de Fechamento Fiscal (Período)
  const [fiscalStartDate, setFiscalStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [fiscalEndDate, setFiscalEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // --- HELPER: Formatar Data ---
  const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm');
  };

  const formatDateSimple = (dateStr) => {
      if (!dateStr) return '-';
      return format(new Date(dateStr), 'dd/MM/yyyy');
  };

  // --- 1. RELATÓRIO DIÁRIO SIMPLES ---
  const generateDailyPDF = async () => {
    setLoading(true);
    try {
        const startOfDay = `${selectedDate}T00:00:00`;
        const endOfDay = `${selectedDate}T23:59:59`;

        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select(`*, clients (razao_social), categories (name)`)
            .eq('status', 'done')
            .gte('completed_at', startOfDay)
            .lte('completed_at', endOfDay)
            .order('completed_at', { ascending: true });

        if (tasksError) throw tasksError;

        const competence = selectedDate.slice(0, 7) + '-01';
        const { data: closings, error: closingsError } = await supabase
            .from('fiscal_closings')
            .select(`*, clients (razao_social, regime)`)
            .eq('competence', competence);

        if (closingsError) throw closingsError;

        const doc = new jsPDF();
        doc.setFontSize(18); doc.text("Relatório Diário de Tarefas", 14, 20);
        doc.setFontSize(10); doc.text(`Data: ${format(new Date(selectedDate), 'dd/MM/yyyy')}`, 14, 28);
        
        let finalY = 40;
        doc.setFontSize(14); doc.text("Tarefas Executadas", 14, finalY);
        
        const tasksBody = (tasks || []).map(t => [
            format(new Date(t.completed_at), 'HH:mm'), 
            t.title, 
            t.clients?.razao_social || 'Geral'
        ]);
        autoTable(doc, { startY: finalY + 5, head: [['Hora', 'Título', 'Cliente']], body: tasksBody });
        
        finalY = doc.lastAutoTable.finalY + 15;
        doc.text("Status Fechamento Fiscal", 14, finalY);
        
        const doneClosings = (closings || []).filter(c => c.status === 'done');
        const closingsBody = doneClosings.map(c => [
            c.clients?.razao_social, 
            c.clients?.regime, 
            formatDate(c.completed_at)
        ]);
        autoTable(doc, { startY: finalY + 5, head: [['Cliente', 'Regime', 'Conclusão']], body: closingsBody });

        window.open(doc.output('bloburl'), '_blank');

    } catch (error) {
        alert("Erro: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  // --- 2. RELATÓRIO DE PERFORMANCE ---
  const generatePerformancePDF = async () => {
    setLoading(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const userName = user?.user_metadata?.full_name || user?.email || 'Usuário';

        const currentDayStart = `${selectedDate}T00:00:00`;
        const currentDayEnd = `${selectedDate}T23:59:59`;
        
        const prevDateObj = subDays(new Date(selectedDate), 1);
        const prevDateStr = prevDateObj.toISOString().split('T')[0];
        const prevDayStart = `${prevDateStr}T00:00:00`;
        const prevDayEnd = `${prevDateStr}T23:59:59`;

        const competence = selectedDate.slice(0, 7) + '-01';

        // Dados Fiscal
        const { data: fiscalTodayData } = await supabase.from('fiscal_closings')
            .select(`*, clients(razao_social, regime)`)
            .eq('status', 'done')
            .gte('completed_at', currentDayStart).lte('completed_at', currentDayEnd);
        const fiscalToday = fiscalTodayData || [];

        const { count: fiscalYesterdayCount } = await supabase.from('fiscal_closings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'done')
            .gte('completed_at', prevDayStart).lte('completed_at', prevDayEnd);

        const { data: fiscalTotalData } = await supabase.from('fiscal_closings')
            .select('status')
            .eq('competence', competence);
        const fiscalTotal = fiscalTotalData || [];

        // Dados Tarefas
        const { data: tasksTodayData } = await supabase.from('tasks')
            .select(`*, clients(razao_social), categories(name)`) 
            .eq('status', 'done')
            .gte('completed_at', currentDayStart).lte('completed_at', currentDayEnd);
        const tasksToday = tasksTodayData || [];

        const { count: tasksYesterdayCount } = await supabase.from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'done')
            .gte('completed_at', prevDayStart).lte('completed_at', prevDayEnd);

        const { data: tasksTotalData } = await supabase.from('tasks').select('status');
        const tasksTotal = tasksTotalData || [];

        // Cálculos
        const calcVariation = (today, yesterday) => {
            const diff = today - yesterday;
            let percent = 0;
            if (yesterday > 0) percent = ((diff / yesterday) * 100).toFixed(1);
            else if (today > 0) percent = 100;
            const signal = diff > 0 ? '+' : '';
            return { diff: `${signal}${diff}`, percent: `${signal}${percent}%` };
        };

        const fiscalStats = calcVariation(fiscalToday.length, fiscalYesterdayCount || 0);
        const tasksStats = calcVariation(tasksToday.length, tasksYesterdayCount || 0);

        const totalFiscalCount = fiscalTotal.length;
        const doneFiscal = fiscalTotal.filter(f => f.status === 'done').length;
        const pendingFiscal = totalFiscalCount - doneFiscal;
        const percentFiscal = totalFiscalCount > 0 ? ((doneFiscal / totalFiscalCount) * 100).toFixed(1) : 0;

        const totalTasksCount = tasksTotal.length;
        const doneTasks = tasksTotal.filter(t => t.status === 'done').length;
        const percentTasks = totalTasksCount > 0 ? ((doneTasks / totalTasksCount) * 100).toFixed(1) : 0;

        // PDF Generation
        const doc = new jsPDF();
        doc.setFillColor(8, 145, 178);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text("Relatório Diário de Performance", 14, 18);
        
        doc.setFontSize(9);
        doc.text(`Data Referência: ${format(new Date(selectedDate), 'dd/MM/yyyy')}`, 150, 12);
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 150, 17);
        doc.text(`Usuário: ${userName}`, 150, 22);

        let finalY = 40;

        // Seção Fiscal
        doc.setTextColor(0);
        doc.setFontSize(14); doc.text("1. Performance Fechamento Fiscal", 14, finalY);
        doc.setDrawColor(200); doc.setFillColor(245, 245, 245); doc.roundedRect(14, finalY + 5, 180, 20, 3, 3, 'FD');
        doc.setFontSize(11); doc.text(`Concluídos Hoje: ${fiscalToday.length}`, 20, finalY + 17);
        if (parseInt(fiscalStats.diff) >= 0) doc.setTextColor(0, 150, 0); else doc.setTextColor(200, 0, 0);
        doc.text(`(${fiscalStats.diff} / ${fiscalStats.percent} vs ontem)`, 70, finalY + 17);
        doc.setTextColor(0);
        
        const fiscalBody = fiscalToday.map(f => [f.clients?.razao_social || 'Cliente não identificado', f.clients?.regime || '-', formatDate(f.completed_at)]);
        if (fiscalBody.length > 0) {
            autoTable(doc, { startY: finalY + 30, head: [['Cliente', 'Regime', 'Data Conclusão']], body: fiscalBody, theme: 'striped', headStyles: { fillColor: [8, 145, 178] }, styles: { fontSize: 9 } });
            finalY = doc.lastAutoTable.finalY + 15;
        } else {
            doc.setFontSize(10); doc.setTextColor(150); doc.text("Nenhum fechamento concluído nesta data.", 14, finalY + 40); finalY += 50;
        }

        // Seção Tarefas
        doc.setTextColor(0); doc.setFontSize(14); doc.text("2. Performance de Tarefas", 14, finalY);
        doc.setDrawColor(200); doc.setFillColor(245, 245, 245); doc.roundedRect(14, finalY + 5, 180, 20, 3, 3, 'FD');
        doc.setFontSize(11); doc.text(`Concluídas Hoje: ${tasksToday.length}`, 20, finalY + 17);
        if (parseInt(tasksStats.diff) >= 0) doc.setTextColor(0, 150, 0); else doc.setTextColor(200, 0, 0);
        doc.text(`(${tasksStats.diff} / ${tasksStats.percent} vs ontem)`, 70, finalY + 17);
        doc.setTextColor(0);

        const tasksBody = tasksToday.map(t => [t.title || 'Sem título', '-', t.clients?.razao_social || 'Geral', t.categories?.name || 'Manual', formatDate(t.completed_at)]);
        if (tasksBody.length > 0) {
            autoTable(doc, { startY: finalY + 30, head: [['Título', 'Categoria', 'Cliente', 'Origem', 'Conclusão']], body: tasksBody, theme: 'striped', headStyles: { fillColor: [234, 179, 8] }, styles: { fontSize: 8 }, columnStyles: { 0: { cellWidth: 50 } } });
            finalY = doc.lastAutoTable.finalY + 15;
        } else {
            doc.setFontSize(10); doc.setTextColor(150); doc.text("Nenhuma tarefa concluída nesta data.", 14, finalY + 40); finalY += 50;
        }

        // Resumos
        if (finalY > 230) { doc.addPage(); finalY = 20; }
        doc.setFillColor(240, 240, 240); doc.rect(14, finalY, 180, 50, 'F');
        doc.setFontSize(14); doc.setTextColor(0); doc.text("Resumo Geral", 20, finalY + 10);
        doc.setFontSize(12); doc.text("Fechamento Fiscal (Competência)", 20, finalY + 20);
        doc.setFontSize(10); doc.text(`• Total Clientes Pendentes: ${pendingFiscal}`, 20, finalY + 28); doc.text(`• Total Concluídos (Mês): ${doneFiscal}`, 20, finalY + 34); doc.text(`• Progresso: ${percentFiscal}%`, 20, finalY + 40);
        doc.setFontSize(12); doc.text("Tarefas (Geral do Sistema)", 110, finalY + 20);
        doc.setFontSize(10); doc.text(`• Total Tarefas: ${totalTasksCount}`, 110, finalY + 28); doc.text(`• Total Concluídas: ${doneTasks}`, 110, finalY + 34); doc.text(`• Taxa de Conclusão: ${percentTasks}%`, 110, finalY + 40);

        window.open(doc.output('bloburl'), '_blank');
    } catch (error) {
        alert("Erro ao gerar relatório: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  // --- 3. RELATÓRIO DE FECHAMENTO FISCAL (PERÍODO) ---
  const generateFiscalClosingPDF = async () => {
    setLoading(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const userName = user?.user_metadata?.full_name || user?.email || 'Usuário';

        const startRange = `${fiscalStartDate}T00:00:00`;
        const endRange = `${fiscalEndDate}T23:59:59`;

        // Busca dados concluídos no período
        const { data: closings, error } = await supabase
            .from('fiscal_closings')
            .select(`*, clients(razao_social, regime)`)
            .eq('status', 'done')
            .gte('completed_at', startRange)
            .lte('completed_at', endRange)
            .order('completed_at', { ascending: true });

        if (error) throw error;

        // Agrupamento por Data
        const groupedByDate = (closings || []).reduce((acc, item) => {
            const dateKey = formatDateSimple(item.completed_at);
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(item);
            return acc;
        }, {});

        // Estatísticas
        const totalConcluded = (closings || []).length;
        
        // Por Regime
        const byRegime = (closings || []).reduce((acc, item) => {
            const regime = item.clients?.regime || 'Não Informado';
            acc[regime] = (acc[regime] || 0) + 1;
            return acc;
        }, {});

        // Melhor/Pior Dia
        let bestDay = { date: '-', count: -1 };
        let worstDay = { date: '-', count: 999999 };
        
        Object.entries(groupedByDate).forEach(([date, items]) => {
            if (items.length > bestDay.count) bestDay = { date, count: items.length };
            if (items.length < worstDay.count) worstDay = { date, count: items.length };
        });
        
        if (totalConcluded === 0) {
            bestDay = { date: '-', count: 0 };
            worstDay = { date: '-', count: 0 };
        }

        // --- GERAÇÃO PDF ---
        const doc = new jsPDF();

        // Cabeçalho
        doc.setFillColor(124, 58, 237); // Purple/Violet
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text("Relatório de Fechamento Fiscal", 14, 18);
        
        doc.setFontSize(9);
        doc.text(`Período Filtrado: ${format(new Date(fiscalStartDate), 'dd/MM/yyyy')} a ${format(new Date(fiscalEndDate), 'dd/MM/yyyy')}`, 14, 28);
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 150, 15);
        doc.text(`Usuário: ${userName}`, 150, 20);

        let finalY = 45;

        // Loop pelos dias
        const dates = Object.keys(groupedByDate).sort((a,b) => {
            // Conversão para ordenar DD/MM/YYYY corretamente
            const [da, ma, ya] = a.split('/');
            const [db, mb, yb] = b.split('/');
            return new Date(`${ya}-${ma}-${da}`) - new Date(`${yb}-${mb}-${db}`);
        });

        if (dates.length === 0) {
            doc.setTextColor(0);
            doc.setFontSize(12);
            doc.text("Nenhum fechamento encontrado neste período.", 14, finalY);
            finalY += 10;
        }

        dates.forEach(dateStr => {
            const items = groupedByDate[dateStr];
            
            // Check page break
            if (finalY > 250) { doc.addPage(); finalY = 20; }

            // Header do Dia
            doc.setFillColor(240, 240, 240);
            doc.rect(14, finalY, 182, 8, 'F');
            doc.setTextColor(0);
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(`${dateStr}`, 16, finalY + 5.5);
            doc.setFont(undefined, 'normal');

            // Tabela do dia
            const body = items.map(i => [i.clients?.razao_social, i.clients?.regime]);
            
            autoTable(doc, {
                startY: finalY + 10,
                head: [['Cliente', 'Regime']],
                body: body,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 1 },
                columnStyles: { 0: { cellWidth: 120 } }, // Cliente maior
                margin: { left: 14 }
            });

            finalY = doc.lastAutoTable.finalY + 2;
            
            // Total do dia
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(`Total no dia: ${items.length}`, 160, finalY + 4);
            doc.setFont(undefined, 'normal');
            
            finalY += 15;
        });

        // --- RODAPÉ / RESUMO ---
        if (finalY > 200) { doc.addPage(); finalY = 20; }
        
        doc.setDrawColor(200);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(14, finalY, 180, 60, 3, 3, 'FD');
        
        doc.setFontSize(14);
        doc.setTextColor(124, 58, 237); // Purple title
        doc.text("Resumo do Período", 20, finalY + 10);
        doc.setTextColor(0);

        doc.setFontSize(11);
        doc.text(`Total de Clientes Concluídos: ${totalConcluded}`, 20, finalY + 20);
        
        doc.text("Totais por Regime:", 20, finalY + 30);
        let yRegime = finalY + 36;
        Object.entries(byRegime).forEach(([regime, count]) => {
            doc.setFontSize(10);
            doc.text(`- ${regime}: ${count}`, 25, yRegime);
            yRegime += 5;
        });

        doc.setFontSize(11);
        doc.text(`Melhor dia: ${bestDay.date} (${bestDay.count} finalizados)`, 110, finalY + 20);
        doc.text(`Pior dia: ${worstDay.date} (${worstDay.count} finalizados)`, 110, finalY + 30);

        window.open(doc.output('bloburl'), '_blank');

    } catch (error) {
        alert("Erro ao gerar relatório: " + error.message);
    } finally {
        setLoading(false);
    }
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
          
          {/* CARD 1: RELATÓRIO DIÁRIO */}
          <div className="bg-surface border border-white/10 rounded-2xl p-6 hover:border-brand-cyan/50 transition-all shadow-lg group">
              <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-brand-cyan/10 rounded-xl text-brand-cyan group-hover:bg-brand-cyan group-hover:text-white transition-colors">
                      <FileText className="w-8 h-8" />
                  </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Relatório Diário</h3>
              <p className="text-gray-400 text-sm mb-6">Tarefas executadas no dia e status do fechamento fiscal.</p>
              
              <div className="space-y-4">
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data de Referência</label>
                      <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg p-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-white outline-none w-full text-sm [&::-webkit-calendar-picker-indicator]:invert" />
                      </div>
                  </div>
                  <button onClick={generateDailyPDF} disabled={loading} className="w-full bg-brand-cyan hover:bg-cyan-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                      Visualizar PDF
                  </button>
              </div>
          </div>

          {/* CARD 2: RELATÓRIO DE PERFORMANCE */}
          <div className="bg-surface border border-white/10 rounded-2xl p-6 hover:border-yellow-500/50 transition-all shadow-lg group">
              <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                      <Activity className="w-8 h-8" />
                  </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Performance Diária</h3>
              <p className="text-gray-400 text-sm mb-6">
                  Comparativo de produtividade e resumos gerais.
              </p>

              <div className="space-y-4">
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data de Referência</label>
                      <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg p-2 focus-within:border-yellow-500">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-white outline-none w-full text-sm [&::-webkit-calendar-picker-indicator]:invert" />
                      </div>
                  </div>

                  <button onClick={generatePerformancePDF} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                      Gerar Relatório
                  </button>
              </div>
          </div>

          {/* CARD 3: RELATÓRIO DE FECHAMENTO FISCAL (NOVO) */}
          <div className="bg-surface border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all shadow-lg group">
              <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <InfinityIcon className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold bg-purple-500/20 text-purple-500 px-2 py-1 rounded">NOVO</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Fechamento Fiscal</h3>
              <p className="text-gray-400 text-sm mb-6">
                  Relatório detalhado de clientes fechados por período e regime.
              </p>

              <div className="space-y-4">
                  <div className="flex gap-2">
                      <div className="flex-1">
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">De</label>
                          <input type="date" value={fiscalStartDate} onChange={(e) => setFiscalStartDate(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-xs outline-none [&::-webkit-calendar-picker-indicator]:invert" />
                      </div>
                      <div className="flex-1">
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Até</label>
                          <input type="date" value={fiscalEndDate} onChange={(e) => setFiscalEndDate(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-xs outline-none [&::-webkit-calendar-picker-indicator]:invert" />
                      </div>
                  </div>

                  <button onClick={generateFiscalClosingPDF} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                      Gerar Relatório
                  </button>
              </div>
          </div>

      </div>
    </div>
  );
}