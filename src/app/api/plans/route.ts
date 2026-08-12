import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plans } = body;

    if (!Array.isArray(plans)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    for (const plan of plans) {
      // 1. Atualiza os dados de disponibilidade, preço e status em location_chalets
      const { error: chaletError } = await supabaseAdmin
        .from('location_chalets')
        .update({
          price: Number(plan.price),
          total_units: Number(plan.total_units),
          is_active: plan.is_active,
        })
        .eq('id', plan.id);

      if (chaletError) throw chaletError;

      // 2. Se houver um modelo associado, processa a atualização do modelo e imagem
      if (plan.chalet_model_id) {
        let publicImageUrl: string | null = null;

        // A) Se enviou imagem em Base64 (image_data), faz o upload para o Storage
        if (plan.image_data && typeof plan.image_data === 'string' && plan.image_data.startsWith('data:image')) {
          const matches = plan.image_data.match(/^data:(image\/\w+);base64,(.+)$/);
          
          if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const base64String = matches[2];
            const extension = mimeType.split('/')[1] || 'png';
            const buffer = Buffer.from(base64String, 'base64');

            const fileName = `${plan.chalet_model_id}-${Date.now()}.${extension}`;

            const { error: uploadError } = await supabaseAdmin.storage
              .from('chales')
              .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: true,
              });

            if (uploadError) {
              console.error('Erro no upload para o Supabase Storage:', uploadError);
              throw uploadError;
            }

            const { data: publicUrlData } = supabaseAdmin.storage
              .from('chales')
              .getPublicUrl(fileName);

            publicImageUrl = publicUrlData.publicUrl;
          }
        } 
        // B) Se não enviou Base64 mas forneceu uma URL diretamente
        else if (plan.image_url) {
          publicImageUrl = plan.image_url;
        }

        // 3. Monta o objeto com as alterações do modelo chalet_models
        const modelUpdates: Record<string, any> = {
          name: plan.name,
          tag: plan.tag,
          area: plan.area,
          description: plan.description,
          features: plan.features,
          whatsapp_link: plan.whatsapp_link || null, // Atualiza o link do WhatsApp
        };

        // Adiciona/atualiza a imagem apenas se uma nova URL foi gerada ou definida
        if (publicImageUrl) {
          modelUpdates.image_url = publicImageUrl;
          modelUpdates.image_data = null; // Limpa o Base64 do banco
        }

        // Executa a atualização na tabela chalet_models
        const { error: modelError } = await supabaseAdmin
          .from('chalet_models')
          .update(modelUpdates)
          .eq('id', plan.chalet_model_id);

        if (modelError) throw modelError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao atualizar planos:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}