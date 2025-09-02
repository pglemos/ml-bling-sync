import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ML-Bling Sync - Integração Mercado Livre e Bling',
  description: 'Sistema completo de integração entre Mercado Livre e Bling ERP para sincronização de produtos, pedidos e estoque.',
  keywords: 'mercado livre, bling, integração, ecommerce, erp, sincronização',
  authors: [{ name: 'ML-Bling Sync Team' }],
  creator: 'ML-Bling Sync',
  publisher: 'ML-Bling Sync',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ML-Bling Sync - Integração Mercado Livre e Bling',
    description: 'Sistema completo de integração entre Mercado Livre e Bling ERP',
    url: '/',
    siteName: 'ML-Bling Sync',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ML-Bling Sync',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ML-Bling Sync - Integração Mercado Livre e Bling',
    description: 'Sistema completo de integração entre Mercado Livre e Bling ERP',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ML-Bling Sync',
  },
  applicationName: 'ML-Bling Sync',
  category: 'business',
  classification: 'business',
  referrer: 'origin-when-cross-origin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="ML-Bling Sync" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ML-Bling Sync" />
        <meta name="description" content="Integração entre Mercado Livre e Bling ERP" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167x167.png" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileImage" content="/icons/ms-icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-navbutton-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "ML-Bling Sync",
              "description": "Sistema de integração entre Mercado Livre e Bling ERP",
              "url": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "BRL"
              },
              "author": {
                "@type": "Organization",
                "name": "ML-Bling Sync Team"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} h-full bg-gray-50`}>
        <div id="root" className="h-full">
          {children}
        </div>
        
        {/* PWA Install Prompt */}
        <div id="pwa-install-prompt" className="hidden fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Instalar ML-Bling Sync</h3>
                <p className="text-xs text-gray-500">Acesse rapidamente pelo seu dispositivo</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                id="pwa-install-accept"
                className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors"
              >
                Instalar
              </button>
              <button
                id="pwa-install-dismiss"
                className="px-3 py-1 text-gray-500 text-xs font-medium hover:text-gray-700 transition-colors"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
        
        {/* PWA Update Notification */}
        <div id="pwa-update-notification" className="hidden fixed bottom-4 left-4 right-4 bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-900">Nova versão disponível</h3>
                <p className="text-xs text-green-700">Clique para atualizar o aplicativo</p>
              </div>
            </div>
            <button
              id="pwa-update-reload"
              className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-md hover:bg-green-600 transition-colors"
            >
              Atualizar
            </button>
          </div>
        </div>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                      
                      // Check for updates
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Show update notification
                            document.getElementById('pwa-update-notification').classList.remove('hidden');
                          }
                        });
                      });
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
                
                // Handle PWA install prompt
                let deferredPrompt;
                window.addEventListener('beforeinstallprompt', (e) => {
                  e.preventDefault();
                  deferredPrompt = e;
                  document.getElementById('pwa-install-prompt').classList.remove('hidden');
                });
                
                // Install button click
                document.getElementById('pwa-install-accept')?.addEventListener('click', async () => {
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                      console.log('User accepted the install prompt');
                    }
                    deferredPrompt = null;
                  }
                  document.getElementById('pwa-install-prompt').classList.add('hidden');
                });
                
                // Dismiss button click
                document.getElementById('pwa-install-dismiss')?.addEventListener('click', () => {
                  document.getElementById('pwa-install-prompt').classList.add('hidden');
                });
                
                // Update button click
                document.getElementById('pwa-update-reload')?.addEventListener('click', () => {
                  window.location.reload();
                });
              }
            `
          }}
        />
      </body>
    </html>
  )
}