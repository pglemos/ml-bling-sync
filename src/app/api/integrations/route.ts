import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Retornar dados mock para desenvolvimento
    const mockIntegrations = [
      {
        id: '1',
        provider: 'bling',
        access_token: 'mock_token',
        refresh_token: 'mock_refresh',
        expires_in: 3600,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        provider: 'mercadolivre',
        access_token: 'mock_token_ml',
        refresh_token: 'mock_refresh_ml',
        expires_in: 3600,
        created_at: new Date().toISOString()
      }
    ];
    
    return NextResponse.json({ integrations: mockIntegrations });
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
    const body = await request.json();
    const { provider, blingKey, mlKey } = body;
    
    // Simular salvamento bem-sucedido
    const mockIntegration = {
      id: Math.random().toString(36).substr(2, 9),
      provider: provider || 'unknown',
      access_token: 'mock_token_' + provider,
      refresh_token: 'mock_refresh_' + provider,
      expires_in: 3600,
      created_at: new Date().toISOString()
    };
    
    return NextResponse.json({ 
      success: true,
      integration: mockIntegration
    });
  } catch (error) {
    console.error('Erro ao salvar integrações:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar integrações' },
      { status: 500 }
    );
  }
}
