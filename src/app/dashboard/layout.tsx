'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  Building2,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Search,
  RefreshCw,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  slug: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initLayout() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      setUserEmail(session.user.email || null);
      fetchSites();
    }

    initLayout();
  }, [router]);

  async function fetchSites() {
    setLoadingSites(true);
    try {
      // 1. Busca os locais oficiais diretamente da tabela `locations`
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, slug')
        .eq('active', true);

      if (locationsError) throw locationsError;

      const uniqueSitesMap = new Map<string, Site>();

      // Adiciona as localizações cadastradas (incluindo a Matriz)
      locationsData?.forEach((item) => {
        if (item.slug && !uniqueSitesMap.has(item.slug)) {
          uniqueSitesMap.set(item.slug, {
            id: item.id || item.slug,
            name: item.name,
            slug: item.slug,
          });
        }
      });

      // 2. Fallback: Busca slugs em `site_events` para garantir que qualquer outro evento antigo também apareça
      const { data: eventsData } = await supabase
        .from('site_events')
        .select('landing_page_slug')
        .not('landing_page_slug', 'is', null);

      eventsData?.forEach((item) => {
        const slug = item.landing_page_slug;
        if (slug && !uniqueSitesMap.has(slug)) {
          const formattedName = slug
            .split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          uniqueSitesMap.set(slug, {
            id: slug,
            name: formattedName,
            slug: slug,
          });
        }
      });

      setSites(Array.from(uniqueSitesMap.values()));
    } catch (err) {
      console.error('Erro ao carregar sites:', err);
    } finally {
      setLoadingSites(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const filteredSites = sites.filter((site) =>
    site.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex font-sans">
      {/* ----------------- SIDEBAR LATERAL ----------------- */}
      <aside className="w-72 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Header da Sidebar */}
          <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold tracking-tight text-white text-base leading-none">
                  Chalé to Go
                </h2>
                <span className="text-[10px] text-emerald-400 font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 inline-block mt-1">
                  Admin
                </span>
              </div>
            </div>
          </div>

          {/* Navegação Geral */}
          <div className="p-4 space-y-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2 block">
              Geral
            </span>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Visão Geral</span>
            </Link>
          </div>

          {/* Seção de Landing Pages */}
          <div className="p-4 pt-2 space-y-3">
            <div className="flex items-center justify-between px-3">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Landing Pages & Sites
              </span>
              <button
                onClick={fetchSites}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Atualizar lista"
              >
                <RefreshCw className={`w-3 h-3 ${loadingSites ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Campo de Busca */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar projeto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/80 transition-all"
              />
            </div>

            {/* Lista de Sites */}
            <div className="space-y-1 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
              {loadingSites ? (
                <div className="p-4 text-center text-xs text-zinc-600 animate-pulse">
                  Carregando páginas...
                </div>
              ) : filteredSites.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-600">
                  Nenhuma página registrada.
                </div>
              ) : (
                filteredSites.map((site) => {
                  const isActive = pathname === `/dashboard/sites/${site.slug}`;
                  return (
                    <Link
                      key={site.id}
                      href={`/dashboard/sites/${site.slug}`}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Building2 className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                        <span className="truncate">{site.name}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500" />
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Rodapé do Menu Lateral */}
        <div className="p-4 border-t border-zinc-900 space-y-3 bg-zinc-950/50">
          <div className="px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Usuário</p>
            <p className="text-xs font-medium text-zinc-300 truncate mt-0.5">{userEmail}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 rounded-xl text-xs font-medium transition-colors flex items-center justify-between group"
          >
            <span>Encerrar Sessão</span>
            <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </aside>

      {/* ----------------- ÁREA DE CONTEÚDO PRINCIPAL ----------------- */}
      <main className="flex-1 overflow-y-auto bg-stone-950">
        {children}
      </main>
    </div>
  );
}