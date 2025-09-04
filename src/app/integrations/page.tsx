"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/shared/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/card";

type Integration = {
  id: string;
  provider: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  created_at: string;
};

type MarketplaceConfig = {
  id: string;
  name: string;
  description: string;
  logo: string;
  color: string;
  isAvailable: boolean;
};

const MARKETPLACES: MarketplaceConfig[] = [
  {
    id: "bling",
    name: "Bling",
    description: "Conecte sua conta do Bling para sincronizar produtos e estoque",
    logo: "/bling-logo.png",
    color: "bg-blue-500",
    isAvailable: true
  },
  {
    id: "mercadolivre",
    name: "Mercado Livre",
    description: "Conecte sua conta do Mercado Livre para sincronizar produtos e pedidos",
    logo: "/mercadolivre-logo.png",
    color: "bg-yellow-500",
    isAvailable: true
  },
  {
    id: "shopee",
    name: "Shopee",
    description: "Integre com a Shopee para gerenciar seus produtos e vendas",
    logo: "/shopee-logo.svg",
    color: "bg-orange-500",
    isAvailable: false
  },
  {
    id: "shein",
    name: "Shein",
    description: "Conecte com a Shein para expandir suas vendas",
    logo: "/shein-logo.svg",
    color: "bg-black",
    isAvailable: false
  },
  {
    id: "amazon",
    name: "Amazon",
    description: "Integre com a Amazon para alcançar mais clientes",
    logo: "/amazon-logo.svg",
    color: "bg-orange-400",
    isAvailable: false
  },
  {
    id: "magalu",
    name: "Magazine Luiza",
    description: "Conecte com o Magazine Luiza para vender no marketplace",
    logo: "/magalu-logo.svg",
    color: "bg-blue-600",
    isAvailable: false
  }
];

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

  const handleConnect = async (marketplaceId: string) => {
    if (marketplaceId === "bling") {
      // Implementar lógica de conexão com Bling
      console.log("Conectando com Bling...");
    } else if (marketplaceId === "mercadolivre") {
      // Implementar lógica de conexão com Mercado Livre
      console.log("Conectando com Mercado Livre...");
    } else {
      alert(`Integração com ${MARKETPLACES.find(m => m.id === marketplaceId)?.name} em breve!`);
    }
  };

  const isConnected = (marketplaceId: string) => {
    return integrations.some(integration => integration.provider === marketplaceId);
  };

  if (loading) return <p>Carregando integrações...</p>;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integrações</h1>
        <p className="text-muted">Conecte seus marketplaces para sincronizar produtos, pedidos e clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MARKETPLACES.map((marketplace) => {
          const connected = isConnected(marketplace.id);
          const integration = integrations.find(i => i.provider === marketplace.id);
          
          return (
            <Card key={marketplace.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${marketplace.color} flex items-center justify-center`}>
                    <Image
                      src={marketplace.logo}
                      alt={marketplace.name}
                      width={32}
                      height={32}
                      className="rounded"
                      onError={(e) => {
                        // Fallback para quando a imagem não existir
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<span class="text-white font-bold text-lg">${marketplace.name.charAt(0)}</span>`;
                      }}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{marketplace.name}</CardTitle>
                    {connected && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Conectado</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {marketplace.description}
                </CardDescription>
                
                {connected ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted">
                      Conectado em: {new Date(integration!.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => console.log('Configurar', marketplace.id)}
                      >
                        Configurar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemove(integration!.id)}
                      >
                        Desconectar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleConnect(marketplace.id)}
                    disabled={!marketplace.isAvailable}
                  >
                    {marketplace.isAvailable ? 'Conectar' : 'Em breve'}
                  </Button>
                )}
                
                {!marketplace.isAvailable && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                      Em breve
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {integrations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Integrações Ativas</h2>
          <div className="text-sm text-muted">
            Você tem {integrations.length} integração(ões) ativa(s)
          </div>
        </div>
      )}
    </div>
  );
}
