import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    // Monta as consultas base usando o client admin para evitar bloqueios de RLS
    let pvQuery = supabaseAdmin
      .from('site_events')
      .select('session_id, landing_page_slug')
      .eq('event_name', 'page_view');

    let engQuery = supabaseAdmin
      .from('site_events')
      .select('component_name, metadata, landing_page_slug')
      .eq('event_name', 'component_engagement');

    let scrollQuery = supabaseAdmin
      .from('site_events')
      .select('metadata, landing_page_slug')
      .eq('event_name', 'scroll_depth');

    // Se um slug foi fornecido, filtra os dados considerando case-insensitive
    const { data: pageViews, error: pvError } = await pvQuery;
    if (pvError) throw pvError;

    const { data: engagements, error: engError } = await engQuery;
    if (engError) throw engError;

    const { data: scrolls, error: scrollError } = await scrollQuery;
    if (scrollError) throw scrollError;

    // Filtra localmente por slug (ignorando diferenças de maiúsculas/minúsculas)
    const filteredPv = slug
      ? pageViews?.filter(
          (item) =>
            item.landing_page_slug &&
            item.landing_page_slug.toLowerCase() === slug.toLowerCase()
        )
      : pageViews;

    const filteredEng = slug
      ? engagements?.filter(
          (item) =>
            item.landing_page_slug &&
            item.landing_page_slug.toLowerCase() === slug.toLowerCase()
        )
      : engagements;

    const filteredScrolls = slug
      ? scrolls?.filter(
          (item) =>
            item.landing_page_slug &&
            item.landing_page_slug.toLowerCase() === slug.toLowerCase()
        )
      : scrolls;

    // Processamento dos dados
    const totalPageViews = filteredPv?.length || 0;
    const uniqueSessions = new Set(filteredPv?.map((pv) => pv.session_id)).size;

    const componentStatsMap: Record<string, { totalViews: number; totalTime: number; maxTime: number }> = {};
    filteredEng?.forEach((item) => {
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

    const scrollStatsMap: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 };
    filteredScrolls?.forEach((item) => {
      const depth = Number(item.metadata?.depth_percentage);
      if (depth in scrollStatsMap) {
        scrollStatsMap[depth] += 1;
      }
    });

    const scrollDepthStats = Object.entries(scrollStatsMap).map(([depth, count]) => ({
      depthPercentage: Number(depth),
      count,
    }));

    return NextResponse.json({
      summary: {
        totalViews: totalPageViews,
        totalSessions: uniqueSessions,
      },
      componentEngagement,
      scrollDepthStats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}