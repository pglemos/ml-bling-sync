"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/shared/button";
import { Sidebar, SidebarItem } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { MainContent } from "@/components/shared/main-content";
import { LayoutDashboard, Eye, Users, Building2, CreditCard, FileText, Shield, Plug, Package, ShoppingCart, BarChart3, Settings, HelpCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { canAccessAdminPanel, getRoleByEmail } from "@/shared/utils/user-roles";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Função para verificar se o usuário tem permissões administrativas
  const hasAdminPermissions = () => {
    if (!userProfile || !user) return false;
    
    // Criar objeto de perfil para verificação
    const profileForCheck = {
      id: userProfile.id || user.id,
      email: userProfile.email || user.email,
      role: userProfile.role || 
            userProfile.user_metadata?.role ||
            userProfile.app_metadata?.role ||
            getRoleByEmail(userProfile.email || user.email)
    };
    
    return canAccessAdminPanel(profileForCheck);
  };

  // Mapeamento das páginas
  const getPageInfo = (path: string) => {
    const pageMap: Record<string, { title: string; description: string }> = {
      '/dashboard': {
        title: 'Dashboard',
        description: 'Visão geral do seu negócio em tempo real'
      },
      '/admin': {
        title: 'Visão Geral Administrativa',
        description: 'Painel administrativo completo do sistema'
      },
      '/admin/users': {
        title: 'Gerenciamento de Usuários',
        description: 'Gerencie usuários, permissões e acessos do sistema'
      },
      '/admin/suppliers': {
        title: 'Gerenciamento de Fornecedores',
        description: 'Gerencie fornecedores e integrações com o Bling'
      },
      '/admin/billing': {
        title: 'Controle de Faturamento',
        description: 'Gerencie planos, assinaturas e faturamento'
      },
      '/admin/reports': {
        title: 'Relatórios e Analytics',
        description: 'Relatórios detalhados e análises do sistema'
      },
      '/admin/security': {
        title: 'Configurações de Segurança',
        description: 'Logs, auditoria e controles de segurança'
      },
      '/products': {
        title: 'Gerenciamento de Produtos',
        description: 'Gerencie seus produtos e sincronize com marketplaces'
      },
      '/orders': {
        title: 'Pedidos',
        description: 'Gerencie todos os pedidos dos seus marketplaces integrados'
      },
      '/customers': {
        title: 'Clientes',
        description: 'Visualize e gerencie informações dos seus clientes'
      },
      '/integrations': {
        title: 'Integrações',
        description: 'Configure e gerencie suas integrações com marketplaces'
      },
      '/analytics': {
        title: 'Analytics',
        description: 'Análises e relatórios do seu negócio'
      },
      '/settings': {
        title: 'Configurações',
        description: 'Configurações da sua conta e preferências'
      },
      '/help': {
        title: 'Ajuda & Suporte',
        description: 'Central de ajuda e suporte técnico'
      }
    };
    
    return pageMap[path] || {
      title: 'Dashboard',
      description: 'Visão geral do seu negócio em tempo real'
    };
  };

  const currentPageInfo = getPageInfo(pathname);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Buscar perfil do usuário com permissões
        try {
          // Primeiro tentar buscar na tabela profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setUserProfile(profile);
          } else {
            // Se não encontrar profile, usar user metadata
            setUserProfile({
              ...user.user_metadata,
              ...user.app_metadata,
              email: user.email,
              id: user.id
            });
          }
        } catch (error) {
          console.log('Profile not found, using user metadata');
          // Fallback para user metadata
          setUserProfile({
            ...user.user_metadata,
            ...user.app_metadata,
            email: user.email,
            id: user.id
          });
        }
      }
      
      setLoading(false);

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setUser(session?.user || null);
          
          if (session?.user) {
             // Atualizar perfil quando sessão muda
             supabase
               .from('profiles')
               .select('*')
               .eq('id', session.user.id)
               .single()
               .then(({ data: profile }) => {
                 if (profile) {
                   setUserProfile(profile);
                 } else {
                   setUserProfile({
                     ...session.user.user_metadata,
                     ...session.user.app_metadata,
                     email: session.user.email,
                     id: session.user.id
                   });
                 }
               })
               .catch(() => {
                 setUserProfile({
                   ...session.user.user_metadata,
                   ...session.user.app_metadata,
                   email: session.user.email,
                   id: session.user.id
                 });
               });
           } else {
             setUserProfile(null);
           }
          
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-700"></div>
      </div>
    );
  }

  // Public pages that don't require authentication
  const publicPages = ['/', '/login', '/register'];
  const isPublicPage = publicPages.includes(pathname || '/');

  if (!user && !isPublicPage) {
    router.push('/login');
    return null;
  }

  if (user && isPublicPage && pathname !== '/') {
    router.push('/dashboard');
    return null;
  }

  return (
    <>
      {user ? (
        <>
          <Sidebar>
            <SidebarItem href="/dashboard" icon={<LayoutDashboard />} page="dashboard">
              Dashboard
            </SidebarItem>
            {/* Menu Administrativo - Apenas para usuários com permissões */}
            {hasAdminPermissions() && (
              <>
                <SidebarItem href="/admin" icon={<Eye />} page="admin">
                  Visão Geral
                </SidebarItem>
                <SidebarItem href="/admin/users" icon={<Users />} page="users">
                  Usuários
                </SidebarItem>
                <SidebarItem href="/admin/suppliers" icon={<Building2 />} page="suppliers">
                  Fornecedores
                </SidebarItem>
                <SidebarItem href="/admin/billing" icon={<CreditCard />} page="billing">
                  Faturamento
                </SidebarItem>
                <SidebarItem href="/admin/reports" icon={<FileText />} page="reports">
                  Relatórios
                </SidebarItem>
                <SidebarItem href="/admin/security" icon={<Shield />} page="security">
                  Segurança
                </SidebarItem>
              </>
            )}
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
            
            <div className="border-t border-gray-200 my-6"></div>
            
            <SidebarItem href="/settings" icon={<Settings />} page="settings">
              Configurações
            </SidebarItem>
            <SidebarItem href="/help" icon={<HelpCircle />} page="help">
              Ajuda & Suporte
            </SidebarItem>
          </Sidebar>
          
          <MainContent>
            <Header title={currentPageInfo.title} description={currentPageInfo.description} />
            <main>{children}</main>
          </MainContent>
          
          <div className="fixed bottom-4 right-4 z-50">
            <Button size="lg" className="rounded-full shadow-lg fab btn-animate bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </Button>
          </div>
        </>
      ) : (
        <>
          <header className="bg-surface shadow-theme p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/">
                <div className="flex items-center gap-2">
                  <Image src="/bling-logo.png" width={40} height={40} alt="SynVolt" />
                  <h1 className="text-xl font-bold text-sky-700">SynVolt Saas</h1>
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Registrar</Button>
              </Link>
            </nav>
          </header>
          <main>{children}</main>
        </>
      )}
    </>
  );
}
