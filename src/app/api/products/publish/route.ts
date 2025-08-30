import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const userId = 'user-test-id';
    
    // Obter produtos associados mas não publicados
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .not('ml_category_id', 'is', null)
      .is('ml_product_id', null);
    
    if (productsError) throw productsError;
    
    // Obter token do ML
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('ml_access_token')
      .eq('user_id', userId)
      .single();
    
    if (integrationError || !integration?.ml_access_token) {
      throw new Error('Token do Mercado Livre não encontrado');
    }
    
    // Publicar produtos
    const results = await Promise.all(
      products.map(async (product) => {
        try {
          // Preparar dados do produto para ML
          const mlProduct = {
            title: product.name,
            category_id: product.ml_category_id,
            price: product.price,
            currency_id: 'BRL',
            available_quantity: product.stock,
            buying_mode: 'buy_it_now',
            listing_type_id: 'gold_special',
            condition: 'new',
            description: product.data?.descricao || product.name,
            pictures: product.data?.imagemUrl ? [
              {
                source: product.data.imagemUrl
              }
            ] : []
          };
          
          // Publicar no ML
          const response = await fetch('https://api.mercadolibre.com/items', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${integration.ml_access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(mlProduct)
          });
          
          if (!response.ok) {
            throw new Error('Erro ao publicar produto no ML');
          }
          
          const responseData = await response.json();
          const mlProductId = responseData.id;
          
          // Atualizar produto no banco
          await supabase
            .from('products')
            .update({ 
              ml_product_id: mlProductId,
              published_at: new Date().toISOString(),
              ml_status: 'active'
            })
            .eq('id', product.id);
          
          return { 
            productId: product.id, 
            status: 'published',
            mlProductId 
          };
        } catch (error) {
          console.error('Erro ao publicar produto:', product.id, error);
          
          // Atualizar status de erro
          await supabase
            .from('products')
            .update({ 
              ml_status: 'error',
              last_error: error.message
            })
            .eq('id', product.id);
          
          return { 
            productId: product.id, 
            status: 'error',
            message: error.message 
          };
        }
      })
    );
    
    return NextResponse.json({ 
      success: true,
      message: 'Produtos publicados com sucesso',
      results,
      total: products.length,
      published: results.filter(r => r.status === 'published').length
    });
  } catch (error) {
    console.error('Erro ao publicar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao publicar produtos' },
      { status: 500 }
    );
  }
}
