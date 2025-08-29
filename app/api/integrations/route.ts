import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

// GET -> lista integrações do usuário
export async function GET() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ integrations: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST -> salva uma nova integração
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const { provider, access_token, refresh_token, expires_in } = body;

    const { data, error } = await supabase
      .from("integrations")
      .insert([
        {
          user_id: user.id,
          provider,
          access_token,
          refresh_token,
          expires_in,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ integration: data[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
