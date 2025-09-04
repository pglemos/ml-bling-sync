"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card';
import { Button } from '@/components/shared/button';
import { Badge } from '@/components/shared/badge';
import { Progress } from '@/components/shared/progress';
import { Alert, AlertDescription } from '@/components/shared/alert';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';

interface Subscription {
  id: string;
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'UNPAID' | 'TRIALING';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
  plan: {
    id: string;
    name: string;
    price_cents: number;
    interval: 'MONTH' | 'YEAR';
    quotas: Record<string, number>;
  };
}

interface UsageSummary {
  metric: string;
  current_usage: number;
  quota: number;
  percentage: number;
}

const SubscriptionManager: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { tenant } = useTenant();

  useEffect(() => {
    fetchSubscription();
    fetchUsage();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/v1/billing/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/v1/billing/usage/summary');
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription || !confirm('Tem certeza que deseja cancelar sua assinatura?')) {
      return;
    }

    setActionLoading('cancel');
    try {
      const response = await fetch(`/api/v1/billing/subscription/${subscription.id}/cancel`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchSubscription();
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading('portal');
    try {
      const response = await fetch('/api/v1/billing/portal/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: window.location.href
        })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-500', icon: CheckCircle, text: 'Ativo' },
      TRIALING: { color: 'bg-blue-500', icon: Calendar, text: 'Período de Teste' },
      CANCELED: { color: 'bg-gray-500', icon: XCircle, text: 'Cancelado' },
      PAST_DUE: { color: 'bg-yellow-500', icon: AlertTriangle, text: 'Vencido' },
      UNPAID: { color: 'bg-red-500', icon: XCircle, text: 'Não Pago' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (priceCents: number, interval: string) => {
    const price = (priceCents / 100).toFixed(2);
    return `$${price}/${interval === 'MONTH' ? 'mês' : 'ano'}`;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getMetricName = (metric: string) => {
    const names: Record<string, string> = {
      products: 'Produtos',
      orders_per_month: 'Pedidos/mês',
      api_calls_per_month: 'Chamadas API/mês',
      integrations: 'Integrações',
      users: 'Usuários'
    };
    return names[metric] || metric;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscription) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma assinatura ativa encontrada. Escolha um plano para começar.
        </AlertDescription>
      </Alert>
    );
  }

  const isTrialing = subscription.status === 'TRIALING';
  const isCanceled = subscription.cancel_at_period_end;
  const needsAttention = ['PAST_DUE', 'UNPAID'].includes(subscription.status);

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Assinatura Atual
              </CardTitle>
              <CardDescription>
                Gerencie sua assinatura e faturamento
              </CardDescription>
            </div>
            {getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-lg">{subscription.plan.name}</h4>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(subscription.plan.price_cents, subscription.plan.interval)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Período atual:</span>
                <span>{formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}</span>
              </div>
              {isTrialing && subscription.trial_end && (
                <div className="flex justify-between text-sm">
                  <span>Teste termina em:</span>
                  <span className="font-semibold">{formatDate(subscription.trial_end)}</span>
                </div>
              )}
            </div>
          </div>

          {needsAttention && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {subscription.status === 'PAST_DUE' 
                  ? 'Seu pagamento está em atraso. Atualize seu método de pagamento para evitar interrupção do serviço.'
                  : 'Pagamento não processado. Entre em contato com o suporte ou atualize seu método de pagamento.'}
              </AlertDescription>
            </Alert>
          )}

          {isCanceled && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Sua assinatura será cancelada em {formatDate(subscription.current_period_end)}. 
                Você ainda pode usar o serviço até esta data.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleManageBilling}
              disabled={actionLoading === 'portal'}
              className="flex items-center gap-2"
            >
              {actionLoading === 'portal' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Gerenciar Faturamento
            </Button>
            
            {!isCanceled && subscription.status === 'ACTIVE' && (
              <Button 
                variant="outline"
                onClick={handleCancelSubscription}
                disabled={actionLoading === 'cancel'}
                className="flex items-center gap-2"
              >
                {actionLoading === 'cancel' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Cancelar Assinatura
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Uso Atual
          </CardTitle>
          <CardDescription>
            Acompanhe seu uso em relação aos limites do plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usage.map((item) => {
              const displayQuota = item.quota === -1 ? 'Ilimitado' : item.quota.toLocaleString();
              const isUnlimited = item.quota === -1;
              
              return (
                <div key={item.metric} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{getMetricName(item.metric)}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.current_usage.toLocaleString()} / {displayQuota}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <div className="space-y-1">
                      <Progress 
                        value={Math.min(item.percentage, 100)} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.percentage.toFixed(1)}% usado</span>
                        {item.percentage >= 90 && (
                          <span className="text-red-600 font-semibold">
                            Próximo do limite!
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManager;
