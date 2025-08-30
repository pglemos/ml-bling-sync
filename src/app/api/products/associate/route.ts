import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const userId = 'user-test-id';
    
    // Obter produtos sem associação
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .is('ml_category_id', null);
    
    if (productsError) throw productsError;
    
    // Obter categorias sincronizadas
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('sync_status', 'synced');
    
    if (categoriesError) throw categoriesError;
    
    // Criar mapa de categorias
    const categoryMap = new Map();
    categories.forEach(cat => {
      if (cat.bling_id) {
        categoryMap.set(cat.bling_id, cat);
      }
    });
    
    // Associar produtos
    const results = await Promise.all(
      products.map(async (product) => {
        const category = categoryMap.get(product.category_id);
        
        if (!category) {
          return { 
            productId: product.id, 
            status: 'no_category',
            message: 'Categoria não encontrada' 
          };
        }
        
        // Atualizar produto
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            ml_category_id: category.provider_id,
            associated_at: new Date().toISOString()
          })
          .eq('id', product.id);
        
        if (updateError) {
          return { 
            productId: product.id, 
            status: 'error',
            message: updateError.message 
          };
        }
        
        return { 
          productId: product.id, 
          status: 'associated',
          categoryId: category.provider_id 
        };
      })
    );
    
    return NextResponse.json({ 
      success: true,
      message: 'Produtos associados com sucesso',
      results,
      total: products.length,
      associated: results.filter(r => r.status === 'associated').length
    });
  } catch (error) {
    console.error('Erro ao associar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao associar produtos' },
      { status: 500 }
    );
  }
}
