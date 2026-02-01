import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react'; 

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulação de login
    if (email && password) {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      
      {/* --- VÍDEO DE BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60" // Opacidade base do vídeo
        >
          <source src="/task-check.mp4" type="video/mp4" />
        </video>
        {/* Camada Escura (Overlay) para garantir leitura */}
        <div className="absolute inset-0 bg-background/85 backdrop-blur-[2px]"></div>
      </div>

      {/* --- CONTEÚDO (Z-INDEX ALTO) --- */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        
        {/* Logo Badge */}
        <div className="mb-12 flex flex-col items-center animate-fade-in-down">
          <div className="bg-brand-cyan/90 backdrop-blur-md px-8 py-3 rounded-full shadow-[0_0_30px_rgba(8,145,178,0.4)] flex items-center gap-3 transform hover:scale-105 transition-transform duration-300 border border-white/10">
            <RefreshCw className="w-8 h-8 text-white animate-spin-slow" strokeWidth={2.5} />
            <span className="text-2xl font-bold text-white tracking-tight">
              Flow Fiscal
            </span>
          </div>
        </div>

        {/* Card de Login */}
        <div className="w-full bg-surface/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-400 ml-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input/50 text-gray-100 p-4 rounded-xl border border-white/5 focus:border-brand-cyan outline-none transition-all placeholder-gray-600 focus:bg-input"
                placeholder="exemplo@flowfiscal.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-400 ml-1">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input/50 text-gray-100 p-4 rounded-xl border border-white/5 focus:border-brand-cyan outline-none transition-all placeholder-gray-600 focus:bg-input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="mt-4 bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40 active:scale-95 border border-white/5"
            >
              Entrar
            </button>

          </form>
        </div>
        
        {/* Rodapé discreto */}
        <p className="mt-8 text-sm text-gray-500 font-medium">
          Gerencie seus processos com fluidez.
        </p>

      </div>
    </div>
  );
}