"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Integration = {
  id: string;
  provider: string;
  created_at: string;
};

export default function Dashboard() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const res = await fetch("/api/integrations");
        const data = await res.json();
        setIntegrations(data.integrations || []);
      } catch (err) {
        console.error("Erro ao carregar integrações", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const handleDisconnect = async (id: string) => {
    if (!confirm("Tem certeza que deseja desconectar esta integração?")) return;

    try {
      const res = await fetch(`/api/integrations/${id}`, { method: "DELETE" });

      if (res.ok) {
        setIntegrations((prev) => prev.filter((i) => i.id !== id));
      } else {
        alert("Erro ao remover integração");
      }
    } catch (err) {
      console.error("Erro ao remover integração", err);
    }
  };

  // Redireciona para o OAuth de cada provedor
  const handleConnect = (provider: "ml" | "bling") => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (provider === "bling") {
      window.location.href = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_BLING_CLIENT_ID}&redirect_uri=${baseUrl}/api/auth/bling/callback`;
    }

    if (provider === "ml") {
      window.location.href = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${process.env.NEXT_PUBLIC_ML_CLIENT_ID}&redirect_uri=${baseUrl}/api/auth/ml/callback`;
    }
  };

  const providerInfo: Record<
    string,
    { name: string; logo: string; color: string }
  > = {
    ml: {
      name: "Mercado Livre",
      logo: "/mercadolivre.png",
      color: "bg-yellow-400",
    },
    bling: { name: "Bling", logo: "/bling.png", color: "bg-green-500" },
  };

  const connectedProviders = integrations.map((i) => i.provider);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Minhas Integrações
      </h1>

      {loading ? (
        <p>Carregando integrações...</p>
      ) : (
        <>
          {/* Lista de integrações já feitas */}
          {integrations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {integrations.map((integration) => {
                const info = providerInfo[integration.provider] || {
                  name: integration.provider,
                  logo: "/default.png",
                  color: "bg-gray-400",
                };

                return (
                  <div
                    key={integration.id}
                    className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-16 h-16 flex items-center justify-center rounded-full ${info.color}`}
                      >
                        <Image
                          src={info.logo}
                          alt={info.name}
                          width={40}
                          height={40}
                        />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">{info.name}</h2>
                        <p className="text-sm text-gray-500">
                          Conectado em:{" "}
                          {new Date(
                            integration.created_at
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Desconectar
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botões para conectar se ainda não tiver */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!connectedProviders.includes("bling") && (
              <button
                onClick={() => handleConnect("bling")}
                className="px-6 py-4 bg-green-500 text-white font-semibold rounded-xl shadow hover:bg-green-600 transition"
              >
                Conectar Bling
              </button>
            )}

            {!connectedProviders.includes("ml") && (
              <button
                onClick={() => handleConnect("ml")}
                className="px-6 py-4 bg-yellow-400 text-gray-900 font-semibold rounded-xl shadow hover:bg-yellow-500 transition"
              >
                Conectar Mercado Livre
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
