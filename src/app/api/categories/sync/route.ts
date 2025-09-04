import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const userId = 'user-test-id';
    
    // Obter categorias do ML
    const { data: mlCategories, error: mlError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'ml');
    
    if (mlError) throw mlError;
    
    // Obter token do Bling
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('bling_access_token')
      .eq('user_id', userId)
      .single();
    
    if (integrationError || !integration?.bling_access_token) {
      throw new Error('Token do Bling não encontrado');
    }
    
    // Sincronizar categorias com Bling
    const results = await Promise.all(
      mlCategories.map(async (category) => {
        try {
          // Verificar se categoria já existe no Bling
          const existingResponse = await fetch(
            `https://bling.com.br/Api/v3/categorias?descricao=${encodeURIComponent(category.name)}`,
            {
              headers: {
                'Authorization': `Bearer ${integration.bling_access_token}`
              }
            }
          );
          
          if (existingResponse.ok) {
            const existingData = await existingResponse.json();
            if (existingData.data && existingData.data.length > 0) {
              return { ...category, status: 'exists' };
            }
          }
          
          // Criar nova categoria
          const createResponse = await fetch('https://bling.com.br/Api/v3/categorias', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${integration.bling_access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              descricao: category.name
            })
          });
          
          if (createResponse.ok) {
            const createData = await createResponse.json();
            
            // Atualizar categoria com ID do Bling
            await supabase
              .from('categories')
              .update({ bling_id: createData.data.id })
              .eq('id', category.id);
            
            return { ...category, status: 'created', bling_id: createData.data.id };
          } else {
            return { ...category, status: 'error', error: 'Erro ao criar no Bling' };
          }
          
        } catch (error) {
          return { ...category, status: 'error', error: error.message };
        }
      })
    );
    
    const summary = {
      total: results.length,
      created: results.filter(r => r.status === 'created').length,
      exists: results.filter(r => r.status === 'exists').length,
      errors: results.filter(r => r.status === 'error').length
    };
    
    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída',
      summary,
      results
    });
    
  } catch (error: any) {
    console.error('Erro ao sincronizar categorias:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
