import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  CheckSquare, 
  Infinity as InfinityIcon, 
  LayoutGrid, 
  Folder, 
  LogOut,
  ChevronDown // Adicionado para indicar expansão
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null); // Controla qual menu está expandido
  
  // Estados para o efeito de digitação
  const [displayedText, setDisplayedText] = useState('');
  const fullText = "O que vamos fazer agora?"; 
  
  const toggleMenu = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    if (!newState) setActiveCategory(null); // Fecha submenus se o menu principal fechar
  };

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
  const MenuItem = ({ icon: Icon, title, items, side, vertical, delayClass }) => {
    const isLeft = side === 'left';
    const isTop = vertical === 'top';
    
    // Identifica se este menu específico está aberto
    const isOpen = activeCategory === title;

    // Função para alternar este menu
    const handleToggle = (e) => {
      e.stopPropagation();
      // Se já estiver aberto, fecha (null). Se não, abre este (title).
      setActiveCategory(isOpen ? null : title);
    };

    // Estilização de Posição
    const containerAlignment = isLeft ? 'items-start' : 'items-end';
    const textAlign = isLeft ? 'text-left' : 'text-right';
    const headerDirection = isLeft ? 'flex-row' : 'flex-row-reverse';
    const borderSide = isLeft ? 'border-l-2 pl-3' : 'border-r-2 pr-3';
    
    // Transições de entrada do Menu Principal
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
          
          {/* --- TÍTULO/ÍCONE (Botão de Expandir) --- */}
          <button 
            onClick={handleToggle}
            className={`flex items-center gap-3 mb-2 ${headerDirection} group/btn outline-none`}
          >
            {/* Ícone Principal com Animação */}
            <div className={`
                transition-all duration-500 ease-in-out
                ${isOpen ? 'rotate-12 scale-110 text-brand-cyan drop-shadow-[0_0_8px_rgba(8,145,178,0.5)]' : 'text-gray-100 rotate-0 scale-100'}
            `}>
                <Icon className="w-7 h-7" />
            </div>

            <div className={`flex items-center gap-2 ${headerDirection}`}>
                <h2 className={`
                    text-xl font-bold uppercase tracking-wide drop-shadow-md transition-colors duration-300
                    ${isOpen ? 'text-brand-cyan' : 'text-white group-hover/btn:text-brand-cyan'}
                `}>
                {title}
                </h2>
                
                {/* Seta indicativa (Pequena animação extra) */}
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-500 ${isOpen ? 'rotate-180 text-brand-cyan' : 'rotate-0'}`} />
            </div>
          </button>
          
          {/* --- SUBMENUS (Lista com Animação de Altura) --- */}
          <div 
            className={`
                grid transition-all duration-500 ease-in-out w-full
                ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
            `}
          >
            <div className="overflow-hidden">
                <ul className={`space-y-2 py-2 ${textAlign} ${borderSide} border-white/30`}>
                    {items.map((item, idx) => (
                    <li 
                        key={idx} 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (item.path) navigate(item.path);
                        }}
                        className="
                            text-gray-400 text-sm font-medium drop-shadow-sm cursor-pointer 
                            hover:text-white hover:translate-x-1 transition-all duration-200 block
                        "
                    >
                        {item.label}
                    </li>
                    ))}
                </ul>
            </div>
          </div>

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
        items={[
          { label: 'Matriz de Eisenhower', path: '/tarefas/matriz' },
          { label: 'Kanban / Dashboard', path: '/dashboard/tarefas' } // Adicionei um link útil aqui
        ]}
        delayClass="delay-0"
      />

      {/* 2. PROCESSOS */}
      <MenuItem 
        side="right" vertical="top" icon={InfinityIcon} title="Processos"
        items={[
          { label: 'Fechamento Fiscal', path: '/processos/fechamento' },
          { label: 'Obrigações Acessórias', path: '/processos/obrigacoes' },
          { label: 'Controle de Parcelamentos', path: '/processos/parcelamentos' },
          { label: 'Relatórios', path: '/processos/relatorios' }
        ]}
        delayClass="delay-[50ms]"
      />

      {/* 3. DASHBOARD */}
      <MenuItem 
        side="left" vertical="bottom" icon={LayoutGrid} title="Dashboard"
        items={[
          { label: 'Visão Tarefa/Foco', path: '/dashboard/tarefas' },
          { label: 'Visão Fiscal', path: '/dashboard/fiscal' }
        ]}
        delayClass="delay-[100ms]"
      />

      {/* 4. CADASTROS */}
      <MenuItem 
        side="right" vertical="bottom" icon={Folder} title="Cadastros"
        items={[
          { label: 'Categorias de Tarefas', path: '/cadastros/categorias-tarefas' },
          { label: 'Origem', path: '/cadastros/categorias' },
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