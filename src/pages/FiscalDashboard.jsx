import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// --- SUB-COMPONENTES VISUAIS ---

// Card Simples de Contagem (Usado em Fechamento e Parcelamentos)
const CountCard = ({ value, label, color = "text-white", subColor = "text-gray-400" }) => (
  <div className="flex flex-col items-center justify-center p-6 border-r border-white/5 last:border-r-0">
    <span className={`text-4xl font-bold ${color} mb-2`}>{value}</span>
    <span className={`${subColor} text-sm font-medium text-center`}>{label}</span>
  </div>
);

// Card de Fração (Usado em Obrigações - ex: 5/15)
const FractionCard = ({ current, total, label }) => (
  <div className="flex flex-col items-center justify-center p-6 border-r border-white/5 last:border-r-0">
    <div className="flex items-baseline gap-1 mb-2">
      <span className="text-4xl font-bold text-primary">{current}</span>
      <span className="text-2xl font-bold text-gray-500">/{total}</span>
    </div>
    <span className="text-gray-400 text-sm font-medium text-center max-w-[180px]">{label}</span>
  </div>
);

// Seletor de Competência (Fixo no topo das abas)
const CompetenceSelector = () => (
  <div className="bg-surface inline-flex items-center rounded-lg p-1 pr-4 mb-8 border border-white/5">
    <span className="bg-white/5 text-gray-400 px-3 py-1 rounded-md text-sm font-medium mr-3">
      Competência
    </span>
    <span className="text-white font-bold">01/2026</span>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function FiscalDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fechamento'); // fechamento, obrigacoes, parcelamentos

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      
      {/* --- HEADER --- */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Visão Fiscal</h1>
        
        {/* Navegação de Abas */}
        <div className="bg-surface rounded-full p-1 flex items-center">
          <button 
            onClick={() => setActiveTab('fechamento')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'fechamento' ? 'bg-surfaceHover text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Fechamento
          </button>
          <button 
            onClick={() => setActiveTab('obrigacoes')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'obrigacoes' ? 'bg-surfaceHover text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Obrigações
          </button>
          <button 
            onClick={() => setActiveTab('parcelamentos')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'parcelamentos' ? 'bg-surfaceHover text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Parcelamentos
          </button>
        </div>

        <button 
          onClick={() => navigate('/home')}
          className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Voltar
        </button>
      </header>

      {/* --- CONTEÚDO DINÂMICO --- */}
      
      {/* 1. ABA FECHAMENTO */}
      {activeTab === 'fechamento' && (
        <div className="bg-surface rounded-2xl p-8 border border-white/5 animate-fade-in-up">
          <CompetenceSelector />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Esquerda: Status Geral */}
            <div className="flex-1 grid grid-cols-2 gap-y-12 pr-8 lg:border-r border-white/5">
              <CountCard value="15" label="Apurações Finalizadas" color="text-emerald-500" />
              <CountCard value="45" label="Guias enviadas" color="text-emerald-500" />
              
              <CountCard value="115" label="Apurações pendentes" color="text-red-500" />
              <CountCard value="250" label="Guias pendentes" color="text-red-500" />
            </div>

            {/* Direita: Por Regime */}
            <div className="flex-1 pl-4 flex flex-col items-center justify-center">
               <h3 className="text-white text-lg mb-8 font-medium">Apurações Finalizadas por Regime</h3>
               <div className="space-y-10 w-full max-w-xs">
                 <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold text-primary mb-1">10</span>
                    <span className="text-gray-400">Simples Nacional</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold text-primary mb-1">3</span>
                    <span className="text-gray-400">Lucro Presumido</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold text-primary mb-1">2</span>
                    <span className="text-gray-400">Lucro Real</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ABA OBRIGAÇÕES */}
      {activeTab === 'obrigacoes' && (
        <div className="bg-surface rounded-2xl p-8 border border-white/5 animate-fade-in-up">
          <CompetenceSelector />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12">
            <FractionCard current="5" total="15" label="SPED EFD Contribuições transmitidos" />
            <FractionCard current="14" total="30" label="EFD REINF enviadas" />
            <FractionCard current="8" total="15" label="MIT transmitidos" />
            
            <FractionCard current="2" total="4" label="SPED ICMS IPI transmitidos" />
            <FractionCard current="3" total="4" label="Declarações Estaduais enviadas" />
            {/* Item vazio para completar o grid visualmente se necessário, ou apenas deixar fluir */}
          </div>
        </div>
      )}

      {/* 3. ABA PARCELAMENTOS */}
      {activeTab === 'parcelamentos' && (
        <div className="bg-surface rounded-2xl p-8 border border-white/5 animate-fade-in-up">
          <CompetenceSelector />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-16 gap-x-8 px-8 py-4">
             <CountCard value="20" label="Parcelamentos do Simples enviados" color="text-primary" />
             <CountCard value="46" label="Parcelamentos da PGFN enviados" color="text-primary" />
             
             {/* Destaque visual (borda roxa) mencionado em uma das imagens */}
             <div className="relative rounded-xl border border-purple-500/50 bg-purple-500/5">
                <CountCard value="32" label="Parcelamentos do Simplificado enviados" color="text-primary" />
             </div>

             <CountCard value="12" label="Outros Parcelamentos (ISS, MEI, PERT, PAEX)" color="text-primary" />
          </div>
        </div>
      )}

    </div>
  );
}