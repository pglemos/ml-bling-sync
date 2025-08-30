"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Integration = {
  id: string;
  provider: string;
  created_at: string;
};

export default function Dashboard() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [blingKey, setBlingKey] = useState("");
  const [mlKey, setMlKey] = useState("");

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

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Tem certeza que deseja desconectar esta integração?")) return;
    try {
      const res = await fetch(`/api/integrations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setIntegrations((prev) => prev.filter((i) => i.id !== id));
        showMessage("Integração removida com sucesso!", "success");
      } else {
        showMessage("Erro ao remover integração", "error");
      }
    } catch (err) {
      console.error("Erro ao remover integração", err);
      showMessage("Erro ao remover integração", "error");
    }
  };

  // Redireciona para o OAuth de cada provedor
  const handleConnect = (provider: "ml" | "bling") => {
    // Em desenvolvimento, usamos localhost; em produção, usamos a URL do Vercel
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL 
      : 'http://localhost:3000';

    if (provider === "bling") {
      const redirectUri = `${baseUrl}/api/auth/bling/callback`;
      window.location.href = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_BLING_CLIENT_ID}&redirect_uri=${redirectUri}`;
    }
    if (provider === "ml") {
      const redirectUri = `${baseUrl}/api/auth/ml/callback`;
      window.location.href = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${process.env.NEXT_PUBLIC_ML_CLIENT_ID}&redirect_uri=${redirectUri}`;
    }
  };

  const handleSaveIntegrations = async () => {
    setActionLoading("save");
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blingKey, mlKey }),
      });
      
      if (res.ok) {
        showMessage("Integrações salvas com sucesso!", "success");
        // Recarregar integrações
        const integrationsRes = await fetch("/api/integrations");
        const integrationsData = await integrationsRes.json();
        setIntegrations(integrationsData.integrations || []);
      } else {
        showMessage("Erro ao salvar integrações", "error");
      }
    } catch (err) {
      console.error("Erro ao salvar integrações", err);
      showMessage("Erro ao salvar integrações", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleImportCategories = async () => {
    setActionLoading("import-categories");
    try {
      const res = await fetch("/api/categories/import", { method: "POST" });
      if (res.ok) {
        showMessage("Categorias importadas com sucesso!", "success");
      } else {
        showMessage("Erro ao importar categorias", "error");
      }
    } catch (err) {
      console.error("Erro ao importar categorias", err);
      showMessage("Erro ao importar categorias", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncCategories = async () => {
    setActionLoading("sync-categories");
    try {
      const res = await fetch("/api/categories/sync", { method: "POST" });
      if (res.ok) {
        showMessage("Categorias sincronizadas com sucesso!", "success");
      } else {
        showMessage("Erro ao sincronizar categorias", "error");
      }
    } catch (err) {
      console.error("Erro ao sincronizar categorias", err);
      showMessage("Erro ao sincronizar categorias", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleImportProducts = async () => {
    setActionLoading("import-products");
    try {
      const res = await fetch("/api/products/import", { method: "POST" });
      if (res.ok) {
        showMessage("Produtos importados com sucesso!", "success");
      } else {
        showMessage("Erro ao importar produtos", "error");
      }
    } catch (err) {
      console.error("Erro ao importar produtos", err);
      showMessage("Erro ao importar produtos", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssociateProducts = async () => {
    setActionLoading("associate-products");
    try {
      const res = await fetch("/api/products/associate", { method: "POST" });
      if (res.ok) {
        showMessage("Produtos associados com sucesso!", "success");
      } else {
        showMessage("Erro ao associar produtos", "error");
      }
    } catch (err) {
      console.error("Erro ao associar produtos", err);
      showMessage("Erro ao associar produtos", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishProducts = async () => {
    setActionLoading("publish-products");
    try {
      const res = await fetch("/api/products/publish", { method: "POST" });
      if (res.ok) {
        showMessage("Produtos publicados com sucesso!", "success");
      } else {
        showMessage("Erro ao publicar produtos", "error");
      }
    } catch (err) {
      console.error("Erro ao publicar produtos", err);
      showMessage("Erro ao publicar produtos", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const providerInfo: Record<
    string,
    { name: string; logo: string; color: string }
  > = {
    ml: {
      name: "Mercado Livre",
      logo: "/mercadolivre-logo.png",
      color: "bg-yellow-400",
    },
    bling: { 
      name: "Bling", 
      logo: "/bling-logo.png", 
      color: "bg-green-500" 
    },
  };

  const connectedProviders = integrations.map((i) => i.provider);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Topbar */}
      <header className="bg-white shadow p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/bling-logo.png" width={40} height={40} alt="SynVolt" />
          <h1 className="text-xl font-bold text-sky-700">SynVolt Saas</h1>
        </div>
        <Button variant="outline">Sair</Button>
      </header>

      {/* Mensagem de feedback */}
      {message.text && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-md ${
          message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Tabs */}
      <main className="p-6">
        <Tabs defaultValue="integracoes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="integracoes">🔑 Integrações</TabsTrigger>
            <TabsTrigger value="catalogo">📦 Catálogo</TabsTrigger>
            <TabsTrigger value="produtos">🛒 Produtos</TabsTrigger>
          </TabsList>

          {/* Integrações */}
          <TabsContent value="integracoes">
            <div className="space-y-6">
              {/* Formulário para chaves de API */}
              <Card>
                <CardHeader>
                  <CardTitle>Cadastro de Integrações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bling">🔑 Token Bling</Label>
                    <Input
                      id="bling"
                      placeholder="Cole seu token Bling"
                      value={blingKey}
                      onChange={(e) => setBlingKey(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ml">🔑 Token Mercado Livre</Label>
                    <Input
                      id="ml"
                      placeholder="Cole seu token Mercado Livre"
                      value={mlKey}
                      onChange={(e) => setMlKey(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleSaveIntegrations}
                    disabled={actionLoading === "save"}
                  >
                    {actionLoading === "save" ? "Salvando..." : "💾 Salvar Integrações"}
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de integrações já feitas */}
              {integrations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </TabsContent>

          {/* Catálogo */}
          <TabsContent value="catalogo">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Catálogo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={handleImportCategories}
                  disabled={actionLoading === "import-categories"}
                >
                  {actionLoading === "import-categories" ? "Importando..." : "📥 Importar Categorias do Mercado Livre"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSyncCategories}
                  disabled={actionLoading === "sync-categories"}
                >
                  {actionLoading === "sync-categories" ? "Sincronizando..." : "🔄 Sincronizar Categorias com Bling"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Produtos */}
          <TabsContent value="produtos">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Produtos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={handleImportProducts}
                  disabled={actionLoading === "import-products"}
                >
                  {actionLoading === "import-products" ? "Importando..." : "📥 Importar Produtos do Bling"}
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleAssociateProducts}
                  disabled={actionLoading === "associate-products"}
                >
                  {actionLoading === "associate-products" ? "Associando..." : "🔗 Associar Produtos às Categorias"}
                </Button>
                <Button 
                  className="w-full"
                  onClick={handlePublishProducts}
                  disabled={actionLoading === "publish-products"}
                >
                  {actionLoading === "publish-products" ? "Publicando..." : "⬆️ Publicar em Massa no Mercado Livre"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}