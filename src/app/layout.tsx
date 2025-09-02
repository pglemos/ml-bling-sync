import { Toaster } from "@/components/toaster";
import { AuthLayout } from "@/components/layout/auth-layout";
import "./globals.css";

export const metadata = {
  title: 'SynVolt Saas - Integração ML-Bling',
  description: 'Plataforma de integração entre Mercado Livre e Bling',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50">
        <AuthLayout>
          {children}
        </AuthLayout>
        <Toaster />
      </body>
    </html>
  );
}
