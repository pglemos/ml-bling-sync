"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
      }
    });
  }, []);

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email: "teste@teste.com",   // usuário que você cadastrou no Supabase
      password: "123456",         // senha que você cadastrou no Supabase
    });
    if (!error) {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    } else {
      alert("Erro no login: " + error.message);
    }
  }

  async function connectBling() {
    if (!user) return alert("Faça login primeiro!");
    const authUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_BLING_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/api/auth/bling/callback&state=${user.id}`;
    window.location.href = authUrl;
  }

  async function connectMercadoLivre() {
  if (!user) return alert("Faça login primeiro!");
  const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${process.env.NEXT_PUBLIC_ML_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/api/auth/ml/callback&state=${user.id}`;
  window.location.href = authUrl;
}

  return (
    <main style={{ padding: 40 }}>
      <h1>🚀 ML + Bling Sync</h1>

      {!user ? (
        <button onClick={signIn}>Login teste@teste.com</button>
      ) : (
        <>
          <p>Bem-vindo: {user.email}</p>
          <div style={{ marginTop: 20 }}>
            <button onClick={connectBling} style={{ marginRight: 10 }}>
              Conectar Bling
            </button>
            <button onClick={connectMercadoLivre}>
              Conectar Mercado Livre
            </button>
          </div>
        </>
      )}
    </main>
  );
}
