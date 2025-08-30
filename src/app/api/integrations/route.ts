import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { data: integrations, error: dbError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id);
    
    if (dbError) throw dbError;
    
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
    // Verificar se o usuário está autenticado
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { blingKey, mlKey } = await request.json();
    
    const updates: any = { user_id: user.id, updated_at: new Date().toISOString() };
    
    if (blingKey) updates.bling_api_key = blingKey;
    if (mlKey) updates.ml_api_key = mlKey;
    
    const { data, error: dbError } = await supabase
      .from('user_integrations')
      .upsert(updates, { onConflict: 'user_id' })
      .select();
    
    if (dbError) throw dbError;
    
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
