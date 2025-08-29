import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const user_id = req.nextUrl.searchParams.get("state");

  if (!code || !user_id) {
    return NextResponse.json({ error: "Code ou user_id não encontrado" }, { status: 400 });
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/ml/callback`;

    const resp = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.ML_CLIENT_ID!,
        client_secret: process.env.ML_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!resp.ok) {
      return NextResponse.json({ error: await resp.text() }, { status: 400 });
    }

    const tokens = await resp.json();

    await supabase.from("user_tokens").upsert({
      provider: "ml",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
      user_id,
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?ml=ok`);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro na autenticação Mercado Livre" }, { status: 500 });
  }
}
