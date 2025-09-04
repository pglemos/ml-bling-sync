import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Simular remoção bem-sucedida
    console.log(`Simulando remoção da integração ${id}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover integração:', error);
    return NextResponse.json(
      { error: 'Erro ao remover integração' },
      { status: 500 }
    );
  }
}
