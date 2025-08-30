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
              descricao: category.name,
              idCategoriaPai: null
            })
          });
          
          if (!createResponse.ok) {
            throw new Error('Erro ao criar categoria no Bling');
          }
          
          const createData = await createResponse.json();
          
          return { 
            ...category, 
            status: 'created',
            blingId: createData.data.id
          };
        } catch (error) {
          console.error('Erro ao sincronizar categoria:', category.name, error);
          return { ...category, status: 'error', error: error.message };
        }
      })
    );
    
    // Atualizar status no banco
    await Promise.all(
      results.map(async (result) => {
        if (result.status === 'created') {
          await supabase
            .from('categories')
            .update({ 
              bling_id: result.blingId,
              sync_status: 'synced',
              synced_at: new Date().toISOString()
            })
            .eq('id', result.id);
        }
      })
    );
    
    return NextResponse.json({ 
      success: true,
      message: 'Categorias sincronizadas com sucesso',
      results
    });
  } catch (error) {
    console.error('Erro ao sincronizar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao sincronizar categorias' },
      { status: 500 }
    );
  }
}
