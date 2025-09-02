"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        router.push("/dashboard");
      }
    };

    checkAuth();
  }, [router]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/bling-logo.png" width={80} height={80} alt="SynVolt" />
          </div>
          <CardTitle className="text-3xl font-bold text-sky-700">SynVolt Saas</CardTitle>
          <p className="text-gray-600 mt-2">
            Plataforma de integração entre Mercado Livre e Bling
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Link href="/login">
              <Button className="w-full">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full">Criar conta</Button>
            </Link>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Ao continuar, você concorda com nossos termos de serviço e política de privacidade.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
