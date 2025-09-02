import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // Se o usuário não está autenticado e tenta acessar uma rota protegida
  if (!token && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se o usuário está autenticado e tenta acessar a página de login
  if (token && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Executa o middleware em todas as rotas, exceto as de API, Next.js e arquivos estáticos
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logos|.*\\.png$).*)'],
};