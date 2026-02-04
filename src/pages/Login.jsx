import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate('/home'); // Redireciona ao sucesso
    } catch (error) {
      setErrorMsg('Falha ao entrar. Verifique suas credenciais.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-cyan/20 via-background to-background"></div>
      </div>

      <div className="bg-surface border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-cyan/20">
            <Lock className="w-8 h-8 text-brand-cyan" />
          </div>
          <h1 className="text-2xl font-bold text-white">Flow Fiscal</h1>
          <p className="text-gray-500 text-sm mt-1">Acesse sua conta para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">E-mail</label>
            <div className="flex items-center gap-3 bg-black/20 border border-white/10 rounded-xl p-3 mt-1 focus-within:border-brand-cyan transition-colors">
              <Mail className="w-5 h-5 text-gray-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-transparent text-white outline-none w-full text-sm placeholder-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Senha</label>
            <div className="flex items-center gap-3 bg-black/20 border border-white/10 rounded-xl p-3 mt-1 focus-within:border-brand-cyan transition-colors">
              <Lock className="w-5 h-5 text-gray-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent text-white outline-none w-full text-sm placeholder-gray-600"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-bold">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-cyan hover:bg-cyan-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Entrar <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">Não tem acesso? Contate o administrador.</p>
        </div>
      </div>
    </div>
  );
}