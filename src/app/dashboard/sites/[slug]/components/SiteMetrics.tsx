'use client';

import React from 'react';
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
  DollarSign,
  MousePointerClick,
  Share2,
} from 'lucide-react';

export interface ModelPerformance {
  modelSlug: string;
  clicks: number;
  totalValue: number;
}

export interface UtmSourceStat {
  source: string;
  campaign?: string;
  count: number;
}

export interface ButtonClickStat {
  label: string;
  count: number;
}

export interface MetricData {
  summary: {
    totalViews: number;
    totalSessions: number;
    totalLeadsCount: number;
    totalPipelineValue: number; // Soma do valor em R$ dos cliques de interesse
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
  modelPerformance?: ModelPerformance[];
  utmStats?: UtmSourceStat[];
  topButtons?: ButtonClickStat[];
}

interface SiteMetricsProps {
  data: MetricData | null;
  onRefresh: () => void;
}

export function SiteMetrics({ data, onRefresh }: SiteMetricsProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const conversionRate =
    data?.summary.totalSessions && data?.summary.totalSessions > 0
      ? (((data?.summary.totalLeadsCount || 0) / data.summary.totalSessions) * 100).toFixed(1)
      : '0';

  return (
    <div className="space-y-8">
      {/* Botão de Atualizar */}
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar Métricas</span>
        </button>
      </div>

      {/* Grid Superior: Cards de Indicadores Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
            <span className="text-zinc-400 text-xs font-medium">Cliques de Interesse (Leads)</span>
            <MousePointerClick className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-2xl font-extrabold text-white">
              {data?.summary.totalLeadsCount || 0}
            </p>
            <span className="text-xs text-emerald-400 font-semibold">
              ({conversionRate}% conv.)
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800/80 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-medium">Pipeline de Interesse</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold mt-3 text-emerald-400">
            {formatCurrency(data?.summary.totalPipelineValue || 0)}
          </p>
        </div>
      </div>

      {/* Grid Intermediário: Gráficos de Modelos e Engajamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interesse por Modelo de Chalé */}
        <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800/80 shadow-xl">
          <h2 className="text-sm font-semibold mb-4 text-zinc-200 flex items-center gap-2">
            <span>Interesse por Modelo de Chalé</span>
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.modelPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="modelSlug" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '0.75rem',
                  }}
                  labelStyle={{ color: '#f4f4f5' }}
                />
                <Bar dataKey="clicks" fill="#0284c7" radius={[6, 6, 0, 0]} name="Cliques" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profundidade de Scroll */}
        <div className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800/80 shadow-xl">
          <h2 className="text-sm font-semibold mb-4 text-zinc-200">
            Profundidade de Scroll (% da Página)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.scrollDepthStats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="depthPercentage"
                  stroke="#71717a"
                  fontSize={11}
                  tickFormatter={(val) => `${val}%`}
                />
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

      {/* Grid de Seções Auxiliares: Tráfego UTM e Banners/Botões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fontes de Tráfego (UTMs) */}
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800/80 shadow-xl p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-800/80 pb-3">
            <Share2 className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Origens de Tráfego (UTMs)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4">Origem (utm_source)</th>
                  <th className="py-2.5 px-4">Campanha</th>
                  <th className="py-2.5 px-4 text-right">Acessos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {data?.utmStats && data.utmStats.length > 0 ? (
                  data.utmStats.map((utm, i) => (
                    <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">{utm.source || 'Direto / Orgânico'}</td>
                      <td className="py-3 px-4 text-zinc-400">{utm.campaign || '-'}</td>
                      <td className="py-3 px-4 text-right font-bold text-sky-400">{utm.count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-zinc-500">
                      Nenhum dado de UTM registrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botões Mais Clicados */}
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800/80 shadow-xl p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-800/80 pb-3">
            <MousePointerClick className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Botões Mais Clicados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4">Texto do Botão</th>
                  <th className="py-2.5 px-4 text-right">Total de Cliques</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {data?.topButtons && data.topButtons.length > 0 ? (
                  data.topButtons.map((btn, i) => (
                    <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">{btn.label}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">{btn.count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-zinc-500">
                      Nenhum clique em botão registrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tabela Inferior: Permanência por Componente */}
      <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800/80 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800/80">
          <h2 className="text-sm font-semibold text-zinc-200">
            Detalhamento de Permanência por Seção/Componente
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
  );
}