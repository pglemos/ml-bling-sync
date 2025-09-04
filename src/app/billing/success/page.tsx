"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card';
import { Button } from '@/components/shared/button';
import { CheckCircle, ArrowRight, Home, CreditCard } from 'lucide-react';
import Link from 'next/link';

const CheckoutSuccessPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    const session_id = searchParams.get('session_id');
    if (session_id) {
      setSessionId(session_id);
      verifySession(session_id);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const verifySession = async (sessionId: string) => {
    try {
      // In a real implementation, you might want to verify the session
      // and get subscription details from your backend
      const response = await fetch('/api/v1/billing/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Error verifying session:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceCents: number, interval: string) => {
    const price = (priceCents / 100).toFixed(2);
    return `$${price}/${interval === 'MONTH' ? 'mês' : 'ano'}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando seu pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="text-center shadow-lg">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">
              Pagamento Realizado com Sucesso!
            </CardTitle>
            <CardDescription className="text-base">
              Sua assinatura foi ativada e você já pode começar a usar todos os recursos.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {subscriptionData && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="font-semibold mb-2">Detalhes da Assinatura:</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Plano:</span>
                    <span className="font-medium">{subscriptionData.plan?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className="font-medium">
                      {subscriptionData.plan && formatPrice(
                        subscriptionData.plan.price_cents, 
                        subscriptionData.plan.interval
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-green-600">Ativo</span>
                  </div>
                  {subscriptionData.trial_end && (
                    <div className="flex justify-between">
                      <span>Teste até:</span>
                      <span className="font-medium">
                        {new Date(subscriptionData.trial_end).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-left">Próximos Passos:</h3>
              <ul className="text-left space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Configure suas integrações no painel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Importe seus produtos e pedidos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Explore os recursos do seu plano</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/dashboard" className="flex items-center justify-center gap-2">
                  <Home className="h-4 w-4" />
                  Ir para o Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/billing" className="flex items-center justify-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Gerenciar Assinatura
                </Link>
              </Button>
            </div>

            {sessionId && (
              <div className="text-xs text-muted-foreground border-t pt-4">
                ID da Sessão: {sessionId}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Precisa de ajuda? Entre em contato com nosso{' '}
            <Link href="/support" className="text-primary hover:underline">
              suporte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
