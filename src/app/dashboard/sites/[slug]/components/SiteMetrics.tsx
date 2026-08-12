'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Users, Eye, Clock, ArrowDownCircle, RefreshCw } from 'lucide-react';

export interface MetricData {
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

interface SiteMetricsProps {
  data: MetricData | null;
  onRefresh: () => void;
}

export function SiteMetrics({ data, onRefresh }: SiteMetricsProps) {
  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar Métricas</span>
        </button>
      </div>

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
  );
}