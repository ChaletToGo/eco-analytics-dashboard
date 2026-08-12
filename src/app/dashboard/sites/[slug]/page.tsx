'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Globe, RefreshCw } from 'lucide-react';

import { SiteMetrics, MetricData } from './components/SiteMetrics';
import { SitePlans, ChaletPlan, LocationDetails } from './components/SitePlans';

export default function SiteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [activeTab, setActiveTab] = useState<'metrics' | 'plans'>('metrics');
  const [data, setData] = useState<MetricData | null>(null);
  const [plans, setPlans] = useState<ChaletPlan[]>([]);
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  const siteName = slug
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  useEffect(() => {
    async function checkAuthAndFetch() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      fetchAllData();
    }

    checkAuthAndFetch();
  }, [slug, router]);

  async function fetchAllData() {
    setLoading(true);
    await Promise.all([fetchSiteMetrics(), fetchPlans()]);
    setLoading(false);
  }

  async function fetchSiteMetrics() {
    try {
      const res = await fetch(`/api/metrics?slug=${slug}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Erro ao carregar métricas:', e);
    }
  }

  async function fetchPlans() {
    try {
      // 1. Busca os dados da localização (usando os campos reais: phone e phone_formatted)
      const { data: locData, error: locError } = await supabase
        .from('locations')
        .select('id, phone, phone_formatted')
        .eq('slug', slug)
        .maybeSingle();

      if (locError) {
        console.error('Erro na consulta da localização:', locError);
        return;
      }

      if (!locData) {
        console.warn(`Localização não encontrada para o slug: "${slug}"`);
        return;
      }

      setLocationDetails({
        id: locData.id,
        phone_number: locData.phone || '',
        whatsapp_number: locData.phone_formatted || '',
      });

      // 2. Busca os chalés vinculados usando o relacionamento explícito do Supabase (!inner)
      const { data: chaletData, error: chaletError } = await supabase
        .from('location_chalets')
        .select(`
          id,
          price,
          total_units,
          is_active,
          chalet_model_id,
          chalet_models!inner (
            id,
            name,
            tag,
            area,
            description,
            features,
            image_data,
            image_url,
            whatsapp_link
          )
        `)
        .eq('location_id', locData.id);

      if (chaletError) {
        console.error('Erro ao carregar chalés vinculados:', chaletError);
        throw chaletError;
      }

      if (!chaletData || chaletData.length === 0) {
        setPlans([]);
        return;
      }

      // 3. Mapeia com desestruturação segura
      const formattedPlans: ChaletPlan[] = chaletData.map((item: any) => {
        const model = item.chalet_models || {};
        return {
          id: item.id,
          chalet_model_id: item.chalet_model_id,
          name: model.name || 'Plano sem nome',
          tag: model.tag || 'EXCLUSIVO',
          area: model.area || '',
          description: model.description || '',
          features: Array.isArray(model.features) ? model.features : [],
          price: item.price || 0,
          total_units: item.total_units || 0,
          image_data: model.image_data || '',
          image_url: model.image_url || '',
          whatsapp_link: model.whatsapp_link || '',
          is_active: item.is_active ?? true,
        };
      });

      setPlans(formattedPlans);
    } catch (e) {
      console.error('Erro ao carregar planos:', e);
    }
  }

  async function handleSavePlans() {
    setSaving(true);
    try {
      if (locationDetails) {
        // Atualiza usando as colunas corretas do banco: phone e phone_formatted
        const { error: locErr } = await supabase
          .from('locations')
          .update({
            phone: locationDetails.phone_number,
            phone_formatted: locationDetails.whatsapp_number,
          })
          .eq('id', locationDetails.id);

        if (locErr) throw locErr;
      }

      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar');

      alert('Configurações atualizadas com sucesso!');
      await fetchPlans();
    } catch (e: any) {
      console.error('Erro ao salvar alterações:', e);
      alert('Erro ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-950">
        <div className="flex items-center gap-3 text-zinc-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Carregando painel de {siteName}...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-stone-950 min-h-screen text-zinc-100">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-mono font-medium">Landing Page</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{siteName}</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Métricas consolidadas de engajamento e gerenciamento de planos desta página.
          </p>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'metrics'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Métricas
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'plans'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Planos & Preços ({plans.length})
          </button>
        </div>
      </div>

      {/* RENDERIZAÇÃO DAS ABAS */}
      {activeTab === 'metrics' ? (
        <SiteMetrics data={data} onRefresh={fetchSiteMetrics} />
      ) : (
        <SitePlans
          plans={plans}
          setPlans={setPlans}
          locationDetails={locationDetails}
          setLocationDetails={setLocationDetails}
          saving={saving}
          onSave={handleSavePlans}
          onRefreshPlans={fetchPlans}
        />
      )}
    </div>
  );
}