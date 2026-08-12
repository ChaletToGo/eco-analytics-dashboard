'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('E-mail ou senha incorretos.');
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError('Ocorreu um erro ao realizar o login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-stone-950 font-sans text-stone-100 select-none overflow-hidden">
      {/* ----------------- COLUNA ESQUERDA: Formulário (30%) ----------------- */}
      <div className="w-full lg:w-[30%] min-h-screen flex flex-col justify-between p-8 sm:p-10 z-20 bg-zinc-950/95 border-r border-zinc-800/80 shrink-0 shadow-2xl">
        {/* Topo / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-lg">Chalé to Go</span>
            <span className="text-xs ml-2 text-emerald-400 font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              Admin
            </span>
          </div>
        </div>

        {/* Formulário Central */}
        <div className="my-auto py-6">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Login</h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1.5">
              Entre com suas credenciais para acessar o sistema.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                E-mail
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@chaletogo.com"
                  className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl py-3 pl-10 pr-10 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* Rodapé */}
        <div className="text-zinc-600 text-xs">
          &copy; {new Date().getFullYear()} Chalé to Go.
        </div>
      </div>

      {/* ----------------- COLUNA DIREITA: Imagem + Vidro de Janela Elegante (70%) ----------------- */}
      <div className="hidden lg:block w-[70%] relative min-h-screen overflow-hidden">
        {/* 1. Imagem Nítida e Otimizada */}
        <Image
          src="/login-bg.png"
          alt="Vista Chalé to Go"
          fill
          priority
          className="object-cover"
        />

        {/* 2. Camada de Efeito Vidro/Janela */}
        <div className="absolute inset-0 bg-stone-950/20 backdrop-blur-[3px] border-l border-white/20 shadow-[inset_0_0_80px_rgba(255,255,255,0.08)] pointer-events-none" />

        {/* 3. Brilho/Reflexo de Vidro Diagonal */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}