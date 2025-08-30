import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Criar cliente Supabase para middleware
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  // Verificar se o usuário está autenticado
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Se não houver sessão e o usuário não estiver na página de login ou registro, redirecionar para login
  if (!session) {
    const { pathname } = req.nextUrl;
    if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return res;
  }

  // Verificar se a sessão expirou (2 horas = 7200 segundos)
  const currentTime = Math.floor(Date.now() / 1000);
  const sessionTime = Math.floor(new Date(session.expires_at).getTime() / 1000);
  const timeRemaining = sessionTime - currentTime;

  // Se a sessão expirou ou está prestes a expirar (menos de 5 minutos), redirecionar para login
  if (timeRemaining <= 300) { // 5 minutos em segundos
    await supabase.auth.signOut();
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('message', 'session_expired');
    return NextResponse.redirect(url);
  }

  // Adicionar cabeçalho para renovar a sessão
  const response = NextResponse.next();
  response.headers.set('x-middleware-refresh', 'true');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
