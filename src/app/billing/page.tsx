"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card';
import { CreditCard, Package, TrendingUp } from 'lucide-react';
import PricingPlans from '@/components/admin/PricingPlans';
import SubscriptionManager from '@/components/admin/SubscriptionManager';
import { useTenant } from '@/hooks/useTenant';

const BillingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('subscription');
  const { tenant } = useTenant();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Faturamento e Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura, visualize o uso e explore planos disponíveis
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Assinatura
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Uso Detalhado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionManager />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Planos Disponíveis</CardTitle>
              <CardDescription>
                Escolha o plano que melhor atende às suas necessidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PricingPlans currentPlanId={tenant?.plan_id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <UsageDetails />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Component for detailed usage analytics
const UsageDetails: React.FC = () => {
  const [usageData, setUsageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchUsageDetails();
  }, []);

  const fetchUsageDetails = async () => {
    try {
      const response = await fetch('/api/v1/billing/usage/summary');
      if (response.ok) {
        const data = await response.json();
        setUsageData(data);
      }
    } catch (error) {
      console.error('Error fetching usage details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricDescription = (metric: string) => {
    const descriptions: Record<string, string> = {
      products: 'Número total de produtos sincronizados em sua conta',
      orders_per_month: 'Pedidos processados no mês atual',
      api_calls_per_month: 'Chamadas à API realizadas no mês atual',
      integrations: 'Integrações ativas configuradas',
      users: 'Usuários ativos em sua organização'
    };
    return descriptions[metric] || 'Métrica de uso do sistema';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detalhes de Uso</CardTitle>
          <CardDescription>
            Análise detalhada do seu uso atual em relação aos limites do plano
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usageData.map((item) => {
          const isUnlimited = item.quota === -1;
          const isNearLimit = item.percentage >= 80;
          const isOverLimit = item.percentage >= 100;

          return (
            <Card key={item.metric} className={`${
              isOverLimit ? 'border-red-500 bg-red-50' :
              isNearLimit ? 'border-yellow-500 bg-yellow-50' :
              'border-gray-200'
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {getMetricName(item.metric)}
                </CardTitle>
                <CardDescription className="text-sm">
                  {getMetricDescription(item.metric)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">
                      {item.current_usage.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground mb-1">
                      / {isUnlimited ? '∞' : item.quota.toLocaleString()}
                    </span>
                  </div>
                  
                  {!isUnlimited && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isOverLimit ? 'bg-red-500' :
                            isNearLimit ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className={`font-medium ${
                          isOverLimit ? 'text-red-600' :
                          isNearLimit ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {item.percentage.toFixed(1)}% usado
                        </span>
                        
                        {isOverLimit && (
                          <span className="text-red-600 font-semibold">
                            Limite excedido!
                          </span>
                        )}
                        {isNearLimit && !isOverLimit && (
                          <span className="text-yellow-600 font-semibold">
                            Próximo do limite
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {isUnlimited && (
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Uso ilimitado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BillingPage;
