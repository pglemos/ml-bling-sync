import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/toaster";
import { Sidebar, SidebarItem } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MainContent } from "@/components/layout/main-content";
import { LayoutDashboard, Plug, Package, ShoppingCart, Users, BarChart3, Settings, HelpCircle } from "lucide-react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setUser(session?.user || null);
          
          // Se o usuário fizer logout, redirecionar para a página inicial
          if (event === 'SIGNED_OUT') {
            router.push('/');
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50">
        {user ? (
          <>
            <Sidebar>
              <SidebarItem href="/dashboard" icon={<LayoutDashboard />} page="dashboard" currentPage="dashboard">
                Dashboard
              </SidebarItem>
              <SidebarItem href="/integrations" icon={<Plug />} page="integrations" badge={2}>
                Integrações
              </SidebarItem>
              <SidebarItem href="/products" icon={<Package />} page="products" badge={856}>
                Produtos
              </SidebarItem>
              <SidebarItem href="/orders" icon={<ShoppingCart />} page="orders" badge={47} badgeVariant="success">
                Pedidos
              </SidebarItem>
              <SidebarItem href="/customers" icon={<Users />} page="customers">
                Clientes
              </SidebarItem>
              <SidebarItem href="/analytics" icon={<BarChart3 />} page="analytics">
                Analytics
              </SidebarItem>
              
              {/* Divider */}
              <div className="border-t border-gray-200 my-6"></div>
              
              <SidebarItem href="/settings" icon={<Settings />} page="settings">
                Configurações
              </SidebarItem>
              <SidebarItem href="/help" icon={<HelpCircle />} page="help">
                Ajuda & Suporte
              </SidebarItem>
            </Sidebar>
            
            <MainContent>
              <Header />
              <main>{children}</main>
            </MainContent>
            
            <div className="fixed bottom-4 right-4 z-50">
              <Button size="lg" className="rounded-full shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </Button>
            </div>
          </>
        ) : (
          <>
            <header className="bg-white shadow p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link href="/">
                  <div className="flex items-center gap-2">
                    <img src="/bling-logo.png" width={40} height={40} alt="SynVolt" />
                    <h1 className="text-xl font-bold text-sky-700">SynVolt Saas</h1>
                  </div>
                </Link>
              </div>
              <nav className="flex items-center gap-4">
                <Link href="/login">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline">Registrar</Button>
                </Link>
              </nav>
            </header>
            <main>{children}</main>
          </>
        )}
        <Toaster />
      </body>
    </html>
  );
}
