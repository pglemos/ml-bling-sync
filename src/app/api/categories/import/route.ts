import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const userId = 'user-test-id';
    
    // Obter token do ML do banco
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('ml_access_token')
      .eq('user_id', userId)
      .single();
    
    if (integrationError || !integration?.ml_access_token) {
      throw new Error('Token do Mercado Livre não encontrado');
    }
    
    // Buscar categorias do ML
    const response = await fetch('https://api.mercadolibre.com/sites/MLB/categories', {
      headers: {
        'Authorization': `Bearer ${integration.ml_access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar categorias do Mercado Livre');
    }
    
    const categories = await response.json();
    
    // Salvar no banco
    const { error: saveError } = await supabase
      .from('categories')
      .upsert(
        categories.map((cat: any) => ({
          user_id: userId,
          provider: 'ml',
          provider_id: cat.id,
          name: cat.name,
          permalink: cat.permalink
        })),
        { onConflict: 'user_id,provider,provider_id' }
      );
    
    if (saveError) throw saveError;
    
    return NextResponse.json({ 
      success: true,
      message: 'Categorias importadas com sucesso',
      count: categories.length
    });
    
  } catch (error: any) {
    console.error('Erro ao importar categorias:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
