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

  // Captura tokens da URL e salva no Supabase
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get("bling") ? "bling" : params.get("ml") ? "ml" : null;

    if (provider) {
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const expires_in = params.get("expires_in");

      if (access_token) {
        fetch("/api/integrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            access_token,
            refresh_token,
            expires_in,
          }),
        }).then(() => {
          // limpa a URL após salvar
          window.history.replaceState({}, document.title, "/");
        });
      }
    }
  }, []);

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email: "teste@teste.com",
      password: "123456",
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
