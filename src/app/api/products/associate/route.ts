import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { productId, marketplaceId, marketplaceProductId } = await request.json();
    
    if (!productId || !marketplaceId || !marketplaceProductId) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }
    
    // Verificar se o produto existe
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();
    
    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Criar associação
    const { data, error } = await supabase
      .from('product_marketplace_associations')
      .upsert({
        product_id: productId,
        marketplace_id: marketplaceId,
        marketplace_product_id: marketplaceProductId,
        status: 'associated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'product_id,marketplace_id'
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Produto associado com sucesso',
      association: data
    });
    
  } catch (error: any) {
    console.error('Erro ao associar produto:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
