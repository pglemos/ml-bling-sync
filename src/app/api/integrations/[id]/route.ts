import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userId = 'user-test-id'; // Vamos implementar autenticação depois
    
    const { error } = await supabaseServer
      .from('user_integrations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover integração:', error);
    return NextResponse.json(
      { error: 'Erro ao remover integração' },
      { status: 500 }
    );
  }
}
