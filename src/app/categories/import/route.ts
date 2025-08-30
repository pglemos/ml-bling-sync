import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const userId = 'user-test-id';
    
    // Obter token do ML do banco
    const { data: integration, error: integrationError } = await supabaseServer
      .from('user_integrations')
      .select('ml_access_token')
      .eq('user_id', userId)
      .single();
    
    if (integrationError || !integration?.ml_access_token) {
      throw new Error('Token do Mercado Livre não encontrado');
    }
    
    // Buscar categorias do ML
    const response = await axios.get('https://api.mercadolibre.com/sites/MLB/categories', {
      headers: {
        'Authorization': `Bearer ${integration.ml_access_token}`
      }
    });
    
    const categories = response.data;
    
    // Salvar no banco
    const { error: saveError } = await supabaseServer
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
  } catch (error) {
    console.error('Erro ao importar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao importar categorias' },
      { status: 500 }
    );
  }
}
