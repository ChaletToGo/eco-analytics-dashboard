'use client';

import { useEffect, useState, use, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Users,
  Eye,
  Clock,
  ArrowDownCircle,
  RefreshCw,
  Globe,
  Layers,
  DollarSign,
  Save,
  Upload,
  Plus,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';

interface MetricData {
  summary: {
    totalViews: number;
    totalSessions: number;
  };
  componentEngagement: Array<{
    componentName: string;
    totalViews: number;
    avgTimeSeconds: number;
    maxTimeSeconds: number;
  }>;
  scrollDepthStats: Array<{
    depthPercentage: number;
    count: number;
  }>;
}

interface ChaletPlan {
  id: string; // ID em location_chalets
  chalet_model_id: string; // ID do modelo em chalet_models
  name: string;
  tag: string;
  area: string;
  description: string;
  features: string[];
  price: number;
  total_units: number;
  image_data: string; // Base64 se houver
  image_url: string; // URL pública se houver
  is_active: boolean;
}

export default function SiteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [activeTab, setActiveTab] = useState<'metrics' | 'plans'>('metrics');
  const [data, setData] = useState<MetricData | null>(null);
  const [plans, setPlans] = useState<ChaletPlan[]>([]);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado para Modal de Novo Plano
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    tag: 'OPÇÃO',
    area: '40 m²',
    description: '',
    featuresStr: '1 Quarto, Varanda, Banheiro',
    price: 150000,
    total_units: 10,
    image_data: '',
  });

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
      const { data: locData, error: locError } = await supabase
        .from('locations')
        .select('id')
        .eq('slug', slug)
        .single();

      if (locError || !locData) return;
      setLocationId(locData.id);

      const { data: chaletData, error: chaletError } = await supabase
        .from('location_chalets')
        .select(`
          id,
          price,
          total_units,
          is_active,
          chalet_model_id,
          chalet_models (
            id,
            name,
            tag,
            area,
            description,
            features,
            image_data,
            image_url
          )
        `)
        .eq('location_id', locData.id);

      if (chaletError) throw chaletError;

      const formattedPlans: ChaletPlan[] = chaletData.map((item: any) => ({
        id: item.id,
        chalet_model_id: item.chalet_model_id,
        name: item.chalet_models?.name || 'Plano sem nome',
        tag: item.chalet_models?.tag || 'EXCLUSIVO',
        area: item.chalet_models?.area || '30 m²',
        description: item.chalet_models?.description || '',
        features: item.chalet_models?.features || [],
        price: item.price || 0,
        total_units: item.total_units || 0,
        image_data: item.chalet_models?.image_data || '',
        image_url: item.chalet_models?.image_url || '',
        is_active: item.is_active ?? true,
      }));

      setPlans(formattedPlans);
    } catch (e) {
      console.error('Erro ao carregar planos:', e);
    }
  }

  // Converter o arquivo de imagem selecionado em Base64
  function handleImageUpload(index: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const updatedPlans = [...plans];
      updatedPlans[index].image_data = base64String;
      setPlans(updatedPlans);
    };
    reader.readAsDataURL(file);
  }

  function handleNewPlanImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPlan((prev) => ({ ...prev, image_data: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSavePlans() {
    setSaving(true);
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar');

      alert('Planos atualizados com sucesso!');
      fetchPlans();
    } catch (e: any) {
      console.error('Erro ao salvar planos:', e);
      alert('Erro ao salvar planos: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateNewPlan() {
    if (!locationId) {
      alert('Erro: ID da localização não encontrado.');
      return;
    }

    if (!newPlan.name.trim()) {
      alert('Por favor, informe o nome do plano.');
      return;
    }

    setSaving(true);
    try {
      const featuresArray = newPlan.featuresStr
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      const modelSlug = newPlan.name.toLowerCase().replace(/[^a-z0-0]/g, '-');

      // 1. Criar na tabela chalet_models
      const { data: modelData, error: modelError } = await supabase
        .from('chalet_models')
        .insert({
          slug: `${modelSlug}-${Date.now()}`,
          name: newPlan.name,
          tag: newPlan.tag,
          area: newPlan.area,
          description: newPlan.description,
          features: featuresArray,
          image_data: newPlan.image_data || null,
        })
        .select()
        .single();

      if (modelError) throw modelError;

      // 2. Criar o vínculo em location_chalets
      const { error: locChaletError } = await supabase
        .from('location_chalets')
        .insert({
          location_id: locationId,
          chalet_model_id: modelData.id,
          price: Number(newPlan.price),
          total_units: Number(newPlan.total_units),
          available_units: Number(newPlan.total_units),
          is_active: true,
        });

      if (locChaletError) throw locChaletError;

      alert('Novo plano adicionado com sucesso!');
      setIsModalOpen(false);
      setNewPlan({
        name: '',
        tag: 'OPÇÃO',
        area: '40 m²',
        description: '',
        featuresStr: '1 Quarto, Varanda, Banheiro',
        price: 150000,
        total_units: 10,
        image_data: '',
      });
      fetchPlans();
    } catch (e: any) {
      console.error('Erro ao criar modelo:', e);
      alert('Erro ao criar plano: ' + e.message);
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

      {/* ABA MÉTRICAS */}
      {activeTab === 'metrics' && (
        <div className="space-y-8">
          <div className="flex justify-end">
            <button
              onClick={fetchSiteMetrics}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar Métricas</span>
            </button>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800/80 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-xs font-medium">Page Views</span>
                <Eye className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold mt-3 text-white">
                {data?.summary.totalViews || 0}
              </p>
            </div>

            <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800/80 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-xs font-medium">Sessões Únicas</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold mt-3 text-white">
                {data?.summary.totalSessions || 0}
              </p>
            </div>

            <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800/80 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-xs font-medium">Componentes Medidos</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold mt-3 text-white">
                {data?.componentEngagement.length || 0}
              </p>
            </div>

            <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800/80 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-xs font-medium">Marcos de Scroll</span>
                <ArrowDownCircle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-extrabold mt-3 text-white">
                {data?.scrollDepthStats.reduce((acc, curr) => acc + curr.count, 0) || 0}
              </p>
            </div>
          </div>

          {/* Gráficos em Duas Colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800/80 shadow-xl">
              <h2 className="text-sm font-semibold mb-4 text-zinc-200">
                Tempo Médio de Permanência por Componente (Segundos)
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.componentEngagement || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="componentName" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                      }}
                      labelStyle={{ color: '#f4f4f5' }}
                    />
                    <Bar dataKey="avgTimeSeconds" fill="#10b981" radius={[6, 6, 0, 0]} name="Média (s)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800/80 shadow-xl">
              <h2 className="text-sm font-semibold mb-4 text-zinc-200">
                Profundidade de Scroll (% da Página)
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.scrollDepthStats || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="depthPercentage" stroke="#71717a" fontSize={11} tickFormatter={(val) => `${val}%`} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                      }}
                      labelStyle={{ color: '#f4f4f5' }}
                    />
                    <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} name="Usuários" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabela Detalhada por Componente */}
          <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800/80 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800/80">
              <h2 className="text-sm font-semibold text-zinc-200">
                Detalhamento por Componente
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-6">Nome do Componente</th>
                    <th className="py-3 px-6">Visualizações</th>
                    <th className="py-3 px-6">Tempo Médio</th>
                    <th className="py-3 px-6">Tempo Máximo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {data?.componentEngagement.map((row) => (
                    <tr key={row.componentName} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-white">{row.componentName}</td>
                      <td className="py-3.5 px-6 text-zinc-400">{row.totalViews}</td>
                      <td className="py-3.5 px-6 text-zinc-400">{row.avgTimeSeconds}s</td>
                      <td className="py-3.5 px-6 text-zinc-400">{row.maxTimeSeconds}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA PLANOS & PREÇOS */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Configuração de Planos</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Altere preços, estoque e envie fotos para otimizar os cards da sua Landing Page.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-all border border-zinc-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Novo Plano</span>
              </button>

              <button
                onClick={handleSavePlans}
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.length === 0 ? (
              <div className="col-span-full p-12 text-center text-zinc-500 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                Nenhum plano cadastrado nesta localização.
              </div>
            ) : (
              plans.map((plan, index) => {
                const currentImg =
                  plan.image_data && plan.image_data.trim() !== ''
                    ? plan.image_data
                    : plan.image_url || `/chales/${plan.name.toLowerCase()}.png`;

                return (
                  <div
                    key={plan.id}
                    className="bg-zinc-900/90 rounded-2xl border border-zinc-800/80 shadow-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Banner de Visualização da Imagem */}
                      <div className="relative w-full h-44 bg-zinc-950 border-b border-zinc-800/80 group overflow-hidden">
                        <img
                          src={currentImg}
                          alt={plan.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                          {plan.tag}
                        </span>

                        <label className="absolute bottom-3 right-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 px-3 py-1.5 rounded-lg text-[11px] text-white flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-md transition-all">
                          <Upload className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Alterar Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(index, e)}
                          />
                        </label>
                      </div>

                      {/* Conteúdo do Card */}
                      <div className="p-5 space-y-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white">{plan.name}</h3>
                            <span className="text-xs text-zinc-400 font-mono">{plan.area}</span>
                          </div>
                          {plan.description && (
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{plan.description}</p>
                          )}
                        </div>

                        {/* Configurações de Edição */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60">
                          <div>
                            <label className="text-[10px] uppercase font-semibold text-zinc-500">
                              Preço (R$)
                            </label>
                            <div className="relative mt-1">
                              <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                              <input
                                type="number"
                                value={plan.price}
                                onChange={(e) => {
                                  const newPlans = [...plans];
                                  newPlans[index].price = Number(e.target.value);
                                  setPlans(newPlans);
                                }}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 pl-7 pr-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-semibold text-zinc-500">
                              Total Unidades
                            </label>
                            <input
                              type="number"
                              value={plan.total_units}
                              onChange={(e) => {
                                const newPlans = [...plans];
                                newPlans[index].total_units = Number(e.target.value);
                                setPlans(newPlans);
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white mt-1 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-semibold text-zinc-500">Status</label>
                          <select
                            value={plan.is_active ? 'true' : 'false'}
                            onChange={(e) => {
                              const newPlans = [...plans];
                              newPlans[index].is_active = e.target.value === 'true';
                              setPlans(newPlans);
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white mt-1 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="true">Ativo na Landing Page</option>
                            <option value="false">Inativo / Oculto</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: NOVO PLANO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Criar Novo Plano / Chalé
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400">Nome do Modelo</label>
                  <input
                    type="text"
                    placeholder="Ex: Master Luxe"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Tag / Destaque</label>
                  <input
                    type="text"
                    placeholder="Ex: POPULAR, ESSENCIAL"
                    value={newPlan.tag}
                    onChange={(e) => setNewPlan({ ...newPlan, tag: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-zinc-400">Área (m²)</label>
                  <input
                    type="text"
                    placeholder="Ex: 50 m²"
                    value={newPlan.area}
                    onChange={(e) => setNewPlan({ ...newPlan, area: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400">Preço (R$)</label>
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400">Unidades</label>
                  <input
                    type="number"
                    value={newPlan.total_units}
                    onChange={(e) => setNewPlan({ ...newPlan, total_units: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">Descrição Breve</label>
                <textarea
                  rows={2}
                  placeholder="Descrição sobre o chalé..."
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400">Características (Separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="Ex: 2 quartos, Varanda Gourmet, Deck"
                  value={newPlan.featuresStr}
                  onChange={(e) => setNewPlan({ ...newPlan, featuresStr: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400">Foto do Chalé</label>
                <div className="flex items-center gap-3 mt-1">
                  {newPlan.image_data && (
                    <img
                      src={newPlan.image_data}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-zinc-700"
                    />
                  )}
                  <label className="cursor-pointer bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Carregar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleNewPlanImageUpload}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewPlan}
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20"
              >
                {saving ? 'Criando...' : 'Salvar e Criar Plano'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}