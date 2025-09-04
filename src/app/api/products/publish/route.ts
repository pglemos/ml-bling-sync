import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { productId, marketplaces } = await request.json();
    
    if (!productId || !marketplaces || !Array.isArray(marketplaces)) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }
    
    // Verificar se o produto existe
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    const results = [];
    
    for (const marketplace of marketplaces) {
      try {
        // Simular publicação no marketplace
        // TODO: Implementar integração real com cada marketplace
        
        const publishResult = {
          marketplace,
          status: 'published',
          marketplace_product_id: `${marketplace}_${productId}_${Date.now()}`,
          published_at: new Date().toISOString()
        };
        
        // Salvar resultado no banco
        const { error: saveError } = await supabase
          .from('product_publications')
          .upsert({
            product_id: productId,
            marketplace,
            marketplace_product_id: publishResult.marketplace_product_id,
            status: 'published',
            published_at: publishResult.published_at,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'product_id,marketplace'
          });
        
        if (saveError) {
          throw saveError;
        }
        
        results.push(publishResult);
        
      } catch (error: any) {
        results.push({
          marketplace,
          status: 'error',
          error: error.message
        });
      }
    }
    
    const summary = {
      total: marketplaces.length,
      published: results.filter(r => r.status === 'published').length,
      errors: results.filter(r => r.status === 'error').length
    };
    
    return NextResponse.json({
      success: true,
      message: 'Publicação concluída',
      summary,
      results
    });
    
  } catch (error: any) {
    console.error('Erro ao publicar produto:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
