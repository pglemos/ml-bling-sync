"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shared/card';
import { Button } from '@/components/shared/button';
import { Badge } from '@/components/shared/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  interval: 'MONTH' | 'YEAR';
  trial_days: number;
  features: Record<string, boolean>;
  quotas: Record<string, number>;
  is_popular: boolean;
  sort_order: number;
}

interface PricingPlansProps {
  onSelectPlan?: (planId: string) => void;
  currentPlanId?: string;
}

const PricingPlans: React.FC<PricingPlansProps> = ({ onSelectPlan, currentPlanId }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { tenant } = useTenant();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/v1/billing/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceCents: number, interval: string) => {
    if (priceCents === 0) return 'Gratuito';
    const price = (priceCents / 100).toFixed(2);
    return `$${price}/${interval === 'MONTH' ? 'mês' : 'ano'}`;
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter':
        return <Zap className="h-6 w-6" />;
      case 'professional':
        return <Star className="h-6 w-6" />;
      case 'enterprise':
        return <Crown className="h-6 w-6" />;
      default:
        return <Check className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter':
        return 'from-blue-500 to-blue-600';
      case 'professional':
        return 'from-purple-500 to-purple-600';
      case 'enterprise':
        return 'from-gold-500 to-gold-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getFeatureList = (features: Record<string, boolean>) => {
    const featureNames: Record<string, string> = {
      basic_sync: 'Sincronização básica',
      email_support: 'Suporte por email',
      api_access: 'Acesso à API',
      advanced_analytics: 'Analytics avançado',
      white_label: 'White label',
      priority_support: 'Suporte prioritário',
      custom_integrations: 'Integrações customizadas',
      dedicated_support: 'Suporte dedicado'
    };

    return Object.entries(features)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => featureNames[key] || key);
  };

  const getQuotaList = (quotas: Record<string, number>) => {
    const quotaNames: Record<string, string> = {
      products: 'Produtos',
      orders_per_month: 'Pedidos/mês',
      api_calls_per_month: 'Chamadas API/mês',
      integrations: 'Integrações',
      users: 'Usuários'
    };

    return Object.entries(quotas).map(([key, value]) => {
      const name = quotaNames[key] || key;
      const displayValue = value === -1 ? 'Ilimitado' : value.toLocaleString();
      return `${displayValue} ${name}`;
    });
  };

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    if (onSelectPlan) {
      onSelectPlan(planId);
    } else {
      // Default behavior: create checkout session
      try {
        const response = await fetch('/api/v1/billing/checkout/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_id: planId,
            success_url: `${window.location.origin}/billing/success`,
            cancel_url: `${window.location.origin}/billing/cancel`
          })
        });

        if (response.ok) {
          const { url } = await response.json();
          window.location.href = url;
        }
      } catch (error) {
        console.error('Error creating checkout session:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrentPlan = currentPlanId === plan.id;
        const isPopular = plan.is_popular;
        const features = getFeatureList(plan.features);
        const quotas = getQuotaList(plan.quotas);

        return (
          <Card 
            key={plan.id} 
            className={`relative transition-all duration-200 hover:shadow-lg ${
              isPopular ? 'ring-2 ring-purple-500 scale-105' : ''
            } ${
              isCurrentPlan ? 'ring-2 ring-green-500' : ''
            }`}
          >
            {isPopular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-500">
                Mais Popular
              </Badge>
            )}
            
            {isCurrentPlan && (
              <Badge className="absolute -top-2 right-4 bg-green-500">
                Plano Atual
              </Badge>
            )}

            <CardHeader className="text-center">
              <div className={`mx-auto p-3 rounded-full bg-gradient-to-r ${getPlanColor(plan.name)} text-white mb-4`}>
                {getPlanIcon(plan.name)}
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="text-3xl font-bold mt-4">
                {formatPrice(plan.price_cents, plan.interval)}
              </div>
              {plan.trial_days > 0 && (
                <p className="text-sm text-muted-foreground">
                  {plan.trial_days} dias de teste grátis
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Recursos inclusos:</h4>
                <ul className="space-y-1">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Limites:</h4>
                <ul className="space-y-1">
                  {quotas.map((quota, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                      {quota}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full" 
                variant={isCurrentPlan ? "outline" : "default"}
                disabled={isCurrentPlan || selectedPlan === plan.id}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {isCurrentPlan ? 'Plano Atual' : 
                 selectedPlan === plan.id ? 'Processando...' : 
                 plan.price_cents === 0 ? 'Começar Grátis' : 'Assinar Plano'}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default PricingPlans;
