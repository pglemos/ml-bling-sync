import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    console.log("🔑 Código recebido:", code);

    if (!code) {
      return NextResponse.json({ error: "Código não encontrado" }, { status: 400 });
    }

    // Troca o código por token no Bling
    const response = await fetch("https://bling.com.br/Api/v3/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.BLING_CLIENT_ID!,
        client_secret: process.env.BLING_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/bling/callback`,
      }),
    });

    const tokenData = await response.json();
    console.log("📡 Token recebido do Bling:", tokenData);

    if (tokenData.error) {
      console.error("❌ Erro ao trocar código por token:", tokenData);
      return NextResponse.json({ error: tokenData }, { status: 400 });
    }

    // Pega usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    console.log("👤 Usuário logado:", user);

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    // Salva integração no Supabase
    const { data, error } = await supabase.from("integrations").insert({
      user_id: user.id,
      provider: "bling",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      created_at: new Date(),
      updated_at: new Date(),
    }).select();

    if (error) {
      console.error("❌ Erro ao salvar integração no Supabase:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    console.log("💾 Integração salva no Supabase:", data);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?bling=ok`);
  } catch (err: any) {
    console.error("🔥 Erro inesperado:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
