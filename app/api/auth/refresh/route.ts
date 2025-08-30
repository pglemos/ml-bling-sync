import { NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";

export async function POST(req: Request) {
  try {
    const { provider } = await req.json();

    if (!provider) {
      return NextResponse.json({ error: "Provider é obrigatório" }, { status: 400 });
    }

    // 🔑 Usuário autenticado no Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    // 🔎 Busca a integração no Supabase
    const { data: integrations, error: integrationError } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .single();

    if (integrationError || !integrations) {
      return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 });
    }

    const { refresh_token } = integrations;

    // 🔄 Atualiza token conforme o provider
    let tokenUrl = "";
    let bodyParams: Record<string, string> = {};

    if (provider === "bling") {
      tokenUrl = "https://www.bling.com.br/Api/v3/oauth/token";
      bodyParams = {
        grant_type: "refresh_token",
        refresh_token,
        client_id: process.env.BLING_CLIENT_ID!,
        client_secret: process.env.BLING_CLIENT_SECRET!,
      };
    } else if (provider === "mercadolivre") {
      tokenUrl = "https://api.mercadolibre.com/oauth/token";
      bodyParams = {
        grant_type: "refresh_token",
        client_id: process.env.ML_CLIENT_ID!,
        client_secret: process.env.ML_CLIENT_SECRET!,
        refresh_token,
      };
    } else {
      return NextResponse.json({ error: "Provider inválido" }, { status: 400 });
    }

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(bodyParams),
    });

    const tokens = await response.json();

    if (!tokens.access_token) {
      return NextResponse.json({ error: tokens }, { status: 400 });
    }

    // ✅ Atualiza tokens no Supabase
    const { error: updateError } = await supabase
      .from("integrations")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? refresh_token,
        expires_in: tokens.expires_in,
        updated_at: new Date(),
      })
      .eq("id", integrations.id);

    if (updateError) {
      return NextResponse.json({ error: updateError }, { status: 500 });
    }

    return NextResponse.json({ success: true, tokens });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
