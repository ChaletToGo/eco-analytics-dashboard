import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    // 1. Busca todos os eventos da tabela site_events
    let query = supabaseAdmin
      .from('site_events')
      .select('event_name, session_id, component_name, button_label, model_slug, value, utm_source, utm_campaign, metadata, landing_page_slug');

    // Se o slug for informado, filtra no banco
    if (slug) {
      query = query.ilike('landing_page_slug', slug);
    }

    const { data: events, error } = await query;
    if (error) throw error;

    const allEvents = events || [];

    // --- A. SUMMARY & LEADS / PIPELINE ---
    const pageViews = allEvents.filter((e) => e.event_name === 'page_view');
    const totalViews = pageViews.length;
    const totalSessions = new Set(pageViews.map((e) => e.session_id).filter(Boolean)).size;

    // Eventos de clique de interesse (Leads)
    const leadEvents = allEvents.filter((e) => e.event_name === 'click_book_interest');
    const totalLeadsCount = leadEvents.length;

    // Calcula o valor total do pipeline (considera a coluna 'value' ou o valor dentro do 'metadata')
    const totalPipelineValue = leadEvents.reduce((acc, curr) => {
      const val = curr.value ?? curr.metadata?.value ?? 0;
      return acc + Number(val);
    }, 0);

    // --- B. DESEMPENHO POR MODELO DE CHALÉ (model_slug) ---
    const modelStatsMap: Record<string, { clicks: number; totalValue: number }> = {};

    leadEvents.forEach((item) => {
      const model = item.model_slug || 'Outros';
      const val = Number(item.value ?? item.metadata?.value) || 0;

      if (!modelStatsMap[model]) {
        modelStatsMap[model] = { clicks: 0, totalValue: 0 };
      }

      modelStatsMap[model].clicks += 1;
      modelStatsMap[model].totalValue += val;
    });

    const modelPerformance = Object.entries(modelStatsMap).map(([modelSlug, stats]) => ({
      modelSlug,
      clicks: stats.clicks,
      totalValue: stats.totalValue,
    }));

    // --- C. ENGAJAMENTO DE COMPONENTES ---
    const componentStatsMap: Record<string, { totalViews: number; totalTime: number; maxTime: number }> = {};
    
    allEvents
      .filter((e) => e.event_name === 'component_engagement')
      .forEach((item) => {
        const comp = item.component_name || 'Desconhecido';
        const time = Number(item.metadata?.time_visible_seconds) || 0;

        if (!componentStatsMap[comp]) {
          componentStatsMap[comp] = { totalViews: 0, totalTime: 0, maxTime: 0 };
        }

        componentStatsMap[comp].totalViews += 1;
        componentStatsMap[comp].totalTime += time;
        if (time > componentStatsMap[comp].maxTime) {
          componentStatsMap[comp].maxTime = time;
        }
      });

    const componentEngagement = Object.entries(componentStatsMap).map(([componentName, stats]) => ({
      componentName,
      totalViews: stats.totalViews,
      avgTimeSeconds: Math.round(stats.totalTime / (stats.totalViews || 1)),
      maxTimeSeconds: stats.maxTime,
    }));

    // --- D. PROFUNDIDADE DE SCROLL ---
    const scrollStatsMap: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 };
    
    allEvents
      .filter((e) => e.event_name === 'scroll_depth')
      .forEach((item) => {
        const depth = Number(item.metadata?.depth_percentage);
        if (depth in scrollStatsMap) {
          scrollStatsMap[depth] += 1;
        }
      });

    const scrollDepthStats = Object.entries(scrollStatsMap).map(([depth, count]) => ({
      depthPercentage: Number(depth),
      count,
    }));

    // --- E. ORIGENS DE TRÁFEGO (UTMs) ---
    const utmStatsMap: Record<string, { source: string; campaign: string; count: number }> = {};

    pageViews.forEach((item) => {
      const source = item.utm_source || 'Direto / Orgânico';
      const campaign = item.utm_campaign || '-';
      const key = `${source}_${campaign}`;

      if (!utmStatsMap[key]) {
        utmStatsMap[key] = { source, campaign, count: 0 };
      }

      utmStatsMap[key].count += 1;
    });

    const utmStats = Object.values(utmStatsMap).sort((a, b) => b.count - a.count);

    // --- F. BOTÕES MAIS CLICADOS (button_label) ---
    const buttonStatsMap: Record<string, number> = {};

    allEvents
      .filter((e) => e.button_label)
      .forEach((item) => {
        const label = item.button_label || 'Botão sem nome';
        buttonStatsMap[label] = (buttonStatsMap[label] || 0) + 1;
      });

    const topButtons = Object.entries(buttonStatsMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    // Retorno final estruturado compatível com o componente SiteMetrics
    return NextResponse.json({
      summary: {
        totalViews,
        totalSessions,
        totalLeadsCount,
        totalPipelineValue,
      },
      componentEngagement,
      scrollDepthStats,
      modelPerformance,
      utmStats,
      topButtons,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}