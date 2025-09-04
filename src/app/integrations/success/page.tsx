"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function IntegrationSuccess() {
  const searchParams = useSearchParams();
  const provider = searchParams?.get("provider");

  const providers: Record<
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
      color: "bg-green-500",
    },
  };

  const integration = provider ? providers[provider] : null;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-surface p-10 rounded-2xl shadow-lg max-w-md w-full text-center">
        {integration && (
          <div className="flex flex-col items-center">
            <div
              className={`w-20 h-20 flex items-center justify-center rounded-full mb-4 ${integration.color}`}
            >
              <Image
                src={integration.logo}
                alt={integration.name}
                width={60}
                height={60}
              />
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Integração concluída! 🎉
            </h1>
            <p className="text-gray-600 mb-6">
              Sua conta <b>{integration.name}</b> foi conectada com sucesso 🚀
            </p>
          </div>
        )}

        {!integration && (
          <p className="text-red-500">Erro: Provedor não identificado.</p>
        )}

        <a
          href="/dashboard"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition"
        >
          Voltar ao painel
        </a>
      </div>
    </div>
  );
}
