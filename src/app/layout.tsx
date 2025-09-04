import { Toaster } from "@/components/shared/toaster";
import { AuthLayout } from "@/components/shared/auth-layout";
import { ThemeProvider } from "@/components/shared/theme-provider";
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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <AuthLayout>
            {children}
          </AuthLayout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
