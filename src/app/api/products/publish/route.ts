import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const userId = 'user-test-id';
    
    const { data: products, error: productsError } = await supabaseServer
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .not('ml_category_id', 'is', null)
      .is('ml_product_id', null);
    
    if (productsError) throw productsError;
    
    const { data: integration, error: integrationError } = await supabaseServer
      .from('user_integrations')
      .select('ml_access_token')
      .eq('user_id', userId)
      .single();
    
    if (integrationError || !integration?.ml_access_token) {
      throw new Error('Token do Mercado Livre não encontrado');
    }
    
    const results = await Promise.all(
      products.map(async (product) => {
        try {
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
          
          const response = await axios.post(
            'https://api.mercadolibre.com/items',
            mlProduct,
            {
              headers: {
                'Authorization': `Bearer ${integration.ml_access_token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const mlProductId = response.data.id;
          
          await supabaseServer
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
          
          await supabaseServer
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
