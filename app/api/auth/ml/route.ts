import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_ML_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_ML_REDIRECT_URI;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // Verificar se as variáveis estão definidas
  if (!clientId || !redirectUri || !appUrl) {
    console.error('Variáveis de ambiente não configuradas:', {
      clientId: !!clientId,
      redirectUri: !!redirectUri,
      appUrl: !!appUrl
    });
    return NextResponse.json({ 
      error: 'Configuração incompleta',
      details: {
        clientId: !!clientId,
        redirectUri: !!redirectUri,
        appUrl: !!appUrl
      }
    }, { status: 500 });
  }
  
  // Construir a URL de autorização
  const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', 'read write offline_access');
  
  console.log('URL de autorização ML:', authUrl.toString());
  
  return NextResponse.redirect(authUrl);
}