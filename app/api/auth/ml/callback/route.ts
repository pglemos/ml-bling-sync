import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Código não encontrado" }, { status: 400 });
    }

    // Troca o código por token no Mercado Livre
    const response = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.ML_CLIENT_ID!,
        client_secret: process.env.ML_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/ml/callback`,
      }),
    });

    const tokenData = await response.json();

    if (tokenData.error) {
      return NextResponse.json({ error: tokenData }, { status: 400 });
    }

    // Pega usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    // Salva integração no Supabase (agora em `integrations`)
    await supabase.from("integrations").insert({
      user_id: user.id,
      provider: "ml",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?ml=ok`);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
