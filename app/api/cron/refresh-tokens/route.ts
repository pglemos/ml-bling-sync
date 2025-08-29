import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

async function refreshToken(integration: any) {
  const { provider, refresh_token, id } = integration;

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
      refresh_token,
      client_id: process.env.ML_CLIENT_ID!,
      client_secret: process.env.ML_CLIENT_SECRET!,
    };
  } else {
    return null;
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(bodyParams),
  });

  const tokens = await response.json();

  if (!tokens.access_token) {
    console.error("❌ Erro ao renovar token:", tokens);
    return null;
  }

  // ✅ Atualiza no Supabase
  await supabase
    .from("integrations")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? refresh_token,
      expires_in: tokens.expires_in,
      updated_at: new Date(),
    })
    .eq("id", id);

  console.log(`🔄 Token atualizado para ${provider} (integration_id: ${id})`);
  return tokens;
}

export async function GET() {
  try {
    const { data: integrations, error } = await supabase
      .from("integrations")
      .select("*");

    if (error) throw error;

    const now = Date.now();
    const expiringSoon = integrations.filter((i) => {
      const updatedAt = new Date(i.updated_at).getTime();
      const expiresAt = updatedAt + i.expires_in * 1000;
      return expiresAt - now < 5 * 60 * 1000; // faltam menos de 5 minutos
    });

    for (const integration of expiringSoon) {
      await refreshToken(integration);
    }

    return NextResponse.json({
      success: true,
      total: integrations.length,
      refreshed: expiringSoon.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
