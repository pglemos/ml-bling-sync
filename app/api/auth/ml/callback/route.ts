import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  console.log('Callback ML recebido:', { code: !!code, error });
  
  if (error) {
    console.error('Erro na autenticação ML:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=ml&message=${encodeURIComponent(error)}`
    );
  }
  
  if (!code) {
    console.error('Código não recebido no callback ML');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=ml&message=Código não fornecido`
    );
  }
  
  try {
    // Trocar o código por um token de acesso
    const tokenResponse = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'authorization_code',
      code,
      client_id: process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
      redirect_uri: process.env.NEXT_PUBLIC_ML_REDIRECT_URI,
    });
    
    const { access_token, refresh_token, user_id } = tokenResponse.data;
    
    console.log('Tokens ML recebidos:', {
      access_token: access_token ? `${access_token.substring(0, 10)}...` : 'undefined',
      refresh_token: refresh_token ? `${refresh_token.substring(0, 10)}...` : 'undefined',
      user_id
    });
    
    // Aqui você deve salvar os tokens no banco de dados
    // Exemplo usando Supabase:
    // const { error } = await supabase
    //   .from('user_integrations')
    //   .upsert({
    //     user_id: userId,
    //     ml_access_token: access_token,
    //     ml_refresh_token: refresh_token,
    //     updated_at: new Date().toISOString()
    //   });
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=ml`
    );
    
  } catch (error) {
    console.error('Erro ao trocar código por token ML:', error.response?.data || error.message);
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=ml&message=${encodeURIComponent('Erro ao autenticar com Mercado Livre')}`
    );
  }
}