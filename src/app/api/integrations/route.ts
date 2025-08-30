import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Obter o usuário autenticado (vamos implementar isso depois)
    // Por enquanto, vamos usar um ID fixo para teste
    const userId = 'user-test-id';
    
    const { data: integrations, error } = await supabaseServer
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return NextResponse.json({ integrations: integrations || [] });
  } catch (error) {
    console.error('Erro ao buscar integrações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar integrações' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { blingKey, mlKey } = await request.json();
    const userId = 'user-test-id'; // Vamos implementar autenticação depois
    
    const updates: any = { user_id: userId, updated_at: new Date().toISOString() };
    
    if (blingKey) updates.bling_api_key = blingKey;
    if (mlKey) updates.ml_api_key = mlKey;
    
    const { data, error } = await supabaseServer
      .from('user_integrations')
      .upsert(updates, { onConflict: 'user_id' })
      .select();
    
    if (error) throw error;
    
    return NextResponse.json({ 
      success: true,
      integrations: data 
    });
  } catch (error) {
    console.error('Erro ao salvar integrações:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar integrações' },
      { status: 500 }
    );
  }
}
