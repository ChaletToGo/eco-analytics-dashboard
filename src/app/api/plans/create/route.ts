import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location_id, name, tag, area, description, features, price, total_units, whatsapp_link, image_data } = body;

    if (!location_id || !name) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const modelSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // 1. Cria o modelo em chalet_models via Admin Client
    const { data: modelData, error: modelError } = await supabaseAdmin
      .from('chalet_models')
      .insert({
        slug: `${modelSlug}-${Date.now()}`,
        name,
        tag,
        area,
        description,
        features,
        whatsapp_link: whatsapp_link || null,
        image_data: image_data || null,
      })
      .select()
      .single();

    if (modelError) throw modelError;

    // 2. Vincula à localização em location_chalets
    const { error: locChaletError } = await supabaseAdmin
      .from('location_chalets')
      .insert({
        location_id,
        chalet_model_id: modelData.id,
        price: Number(price),
        total_units: Number(total_units),
        available_units: Number(total_units),
        is_active: true,
      });

    if (locChaletError) throw locChaletError;

    return NextResponse.json({ success: true, model: modelData });
  } catch (error: any) {
    console.error('Erro ao criar plano via API:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}