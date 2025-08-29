"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Integration = {
  id: string;
  provider: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  created_at: string;
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const res = await fetch("/api/integrations");
        const data = await res.json();

        if (data.integrations) {
          setIntegrations(data.integrations);
        }
      } catch (error) {
        console.error("Erro ao buscar integrações:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/integrations/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        // Atualiza a lista no frontend sem recarregar
        setIntegrations((prev) => prev.filter((i) => i.id !== id));
      } else {
        console.error("Erro ao remover integração:", data.error);
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
    }
  };

  if (loading) return <p>Carregando integrações...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Minhas Integrações</h1>

      {integrations.length === 0 ? (
        <p>Nenhuma integração encontrada.</p>
      ) : (
        <div className="grid gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between border p-4 rounded-lg shadow-sm bg-white"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={
                    integration.provider === "bling"
                      ? "/bling-logo.png"
                      : "/mercadolivre-logo.png"
                  }
                  alt={integration.provider}
                  width={40}
                  height={40}
                />
                <div>
                  <p className="font-semibold capitalize">
                    {integration.provider}
                  </p>
                  <p className="text-sm text-gray-500">
                    Conectado em:{" "}
                    {new Date(integration.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(integration.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
