import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  CheckSquare, 
  Infinity as InfinityIcon, 
  LayoutGrid, 
  Folder, 
  LogOut 
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Estados para o efeito de digitação
  const [displayedText, setDisplayedText] = useState('');
  const fullText = "O que vamos fazer agora?"; 
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Efeito de Máquina de Escrever
  useEffect(() => {
    if (!isMenuOpen) {
      setDisplayedText('');
      let index = 0;
      const typingInterval = setInterval(() => {
        if (index < fullText.length) {
          setDisplayedText((prev) => fullText.slice(0, index + 1));
          index++;
        } else {
          clearInterval(typingInterval);
        }
      }, 50);
      return () => clearInterval(typingInterval);
    }
  }, [isMenuOpen]);

  // Componente de Item do Menu
  const MenuItem = ({ icon: Icon, title, items, side, vertical, onTitleClick, delayClass }) => {
    const isLeft = side === 'left';
    const isTop = vertical === 'top';
    const containerAlignment = isLeft ? 'items-start' : 'items-end';
    const textAlign = isLeft ? 'text-left' : 'text-right';
    const headerDirection = isLeft ? 'flex-row' : 'flex-row-reverse';
    const borderSide = isLeft ? 'border-l-2 pl-3' : 'border-r-2 pr-3';
    const translateX = isLeft ? '-translate-x-[16rem]' : 'translate-x-[16rem]';
    const translateY = isTop ? '-translate-y-[9rem]' : 'translate-y-[9rem]';

    return (
      <div 
        className={`absolute top-1/2 left-1/2 z-20 w-64
          transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${delayClass}
          ${isMenuOpen 
            ? `opacity-100 scale-100 ${translateX} ${translateY}` 
            : 'opacity-0 scale-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none'
          }
        `}
        style={{ marginTop: '-2rem', marginLeft: '-8rem' }}
      >
        <div className={`flex flex-col group cursor-default ${containerAlignment}`}>
          
          {/* Título/Ícone (Clique Geral) */}
          <div 
            onClick={onTitleClick}
            className={`flex items-center gap-3 mb-2 ${headerDirection} cursor-pointer`}
          >
            <Icon className="w-7 h-7 text-gray-100 group-hover:text-brand-cyan transition-colors shadow-lg" />
            <h2 className="text-xl font-bold text-white group-hover:text-brand-cyan transition-colors uppercase tracking-wide drop-shadow-md">
              {title}
            </h2>
          </div>
          
          {/* Lista de Subitens (Links Específicos) */}
          <ul className={`space-y-1 ${textAlign} ${borderSide} border-white/30 w-full`}>
            {items.map((item, idx) => (
              <li 
                key={idx} 
                onClick={(e) => {
                  e.stopPropagation(); // Impede que o clique suba para o título
                  if (item.path) navigate(item.path);
                  else console.log('Rota não definida para:', item.label);
                }}
                className="text-gray-300 text-sm hover:text-white transition-colors font-medium drop-shadow-sm cursor-pointer hover:underline"
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      
      {/* --- VÍDEO DE BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          <source src="/water-flow.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]"></div>
      </div>

      {/* Botão Central + Texto */}
      <div className="relative z-50 flex flex-col items-center justify-center">
        <button 
          onClick={toggleMenu}
          className={`
            bg-brand-cyan w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(8,145,178,0.6)]
            transition-all duration-700 ease-in-out hover:scale-110 active:scale-95 z-50 relative border-2 border-white/10
            ${isMenuOpen ? 'rotate-180' : 'animate-breathing'}
          `}
        >
          <RefreshCw className="w-10 h-10 text-white" strokeWidth={2.5} />
        </button>
        
        <div className={`absolute top-24 transition-all duration-500 w-[400px] flex justify-center pointer-events-none
            ${isMenuOpen ? 'opacity-0 translate-y-4 scale-90' : 'opacity-100 translate-y-0 scale-100'}
        `}>
          <p className="text-lg text-white font-medium text-center h-8 flex items-center justify-center drop-shadow-md tracking-wide">
            {displayedText}
            {!isMenuOpen && displayedText.length < fullText.length && (
              <span className="animate-pulse border-r-2 border-brand-cyan ml-1 h-5 inline-block"></span>
            )}
          </p>
        </div>
      </div>

      {/* --- ITENS DO MENU --- */}

      {/* 1. TAREFAS */}
      <MenuItem 
        side="left" vertical="top" icon={CheckSquare} title="Tarefas"
        onTitleClick={() => navigate('/tarefas/matriz')} // Atualizado para ir direto pra Matriz
        items={[
          { label: 'Matriz de Eisenhower', path: '/tarefas/matriz' }
          // Removido "Adicionar Tarefas"
        ]}
        delayClass="delay-0"
      />

      {/* 2. PROCESSOS */}
      <MenuItem 
        side="right" vertical="top" icon={InfinityIcon} title="Processos"
        onTitleClick={() => navigate('/processos/fechamento')}
        items={[
          { label: 'Fechamento Fiscal', path: '/processos/fechamento' },
          { label: 'Obrigações Acessórias', path: '/processos/obrigacoes' },
          { label: 'Controle de Parcelamentos', path: '/processos/parcelamentos' },
          { label: 'Relatórios', path: '/processos/relatorios' } // <-- NOVO ITEM
        ]}
        delayClass="delay-[50ms]"
      />

      {/* 3. DASHBOARD */}
      <MenuItem 
        side="left" vertical="bottom" icon={LayoutGrid} title="Dashboard"
        onTitleClick={() => navigate('/dashboard/tarefas')}
        items={[
          { label: 'Visão Tarefa/Foco', path: '/dashboard/tarefas' },
          { label: 'Visão Fiscal', path: '/dashboard/fiscal' }
        ]}
        delayClass="delay-[100ms]"
      />

      {/* 4. CADASTROS */}
      <MenuItem 
        side="right" vertical="bottom" icon={Folder} title="Cadastros"
        onTitleClick={() => console.log('Ir para Cadastros')}
        items={[
          { label: 'Categorias de Tarefas', path: '/cadastros/categorias-tarefas' }, // Novo Link
          { label: 'Origem', path: '/cadastros/categorias' }, // Renomeado de Categorias para Origem
          { label: 'Clientes', path: '/cadastros/clientes' },
          { label: 'Guias de Tributos', path: '/cadastros/guias' },
          { label: 'Equipe', path: '/cadastros/usuarios' },
          { label: 'Tipos de Obrigações', path: '/cadastros/obrigacoes' }
        ]}
        delayClass="delay-[150ms]"
      />

      <button 
        onClick={() => navigate('/login')}
        className="absolute bottom-8 right-8 text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 z-50 group font-medium"
      >
        <span className="text-sm group-hover:underline">Sair</span>
        <LogOut className="w-5 h-5" />
      </button>

    </div>
  );
}