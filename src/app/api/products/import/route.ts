import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const userId = 'user-test-id';
    
    // Obter token do Bling
    const { data: integration, error: integrationError } = await supabaseServer
      .from('user_integrations')
      .select('bling_access_token')
      .eq('user_id', userId)
      .single();
    
    if (integrationError || !integration?.bling_access_token) {
      throw new Error('Token do Bling não encontrado');
    }
    
    // Buscar produtos do Bling (paginação)
    let page = 1;
    let hasMore = true;
    const allProducts = [];
    
    while (hasMore) {
      const response = await axios.get(
        `https://bling.com.br/Api/v3/produtos?pagina=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${integration.bling_access_token}`
          }
        }
      );
      
      const products = response.data.data || [];
      allProducts.push(...products);
      
      hasMore = products.length > 0;
      page++;
    }
    
    // Salvar no banco
    const { error: saveError } = await supabaseServer
      .from('products')
      .upsert(
        allProducts.map((product: any) => ({
          user_id: userId,
          provider: 'bling',
          provider_id: product.id,
          sku: product.codigo,
          name: product.descricao,
          price: product.preco,
          stock: product.estoqueAtual,
          category_id: product.idCategoria,
          data: product
        })),
        { onConflict: 'user_id,provider,provider_id' }
      );
    
    if (saveError) throw saveError;
    
    return NextResponse.json({ 
      success: true,
      message: 'Produtos importados com sucesso',
      count: allProducts.length
    });
  } catch (error) {
    console.error('Erro ao importar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao importar produtos' },
      { status: 500 }
    );
  }
}
