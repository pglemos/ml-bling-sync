"use client";

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/shared/alert';
import { Button } from '@/components/shared/button';
import { Progress } from '@/components/shared/progress';
import { 
  AlertTriangle, 
  TrendingUp, 
  X, 
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import Link from 'next/link';

interface QuotaStatus {
  metric: string;
  current: number;
  limit: number;
  percentage: number;
  canUse: boolean;
}

interface QuotaAlertProps {
  metric?: string;
  threshold?: number; // Percentage threshold to show alert (default: 80)
  showProgress?: boolean;
  dismissible?: boolean;
  compact?: boolean;
}

const QuotaAlert: React.FC<QuotaAlertProps> = ({
  metric,
  threshold = 80,
  showProgress = true,
  dismissible = true,
  compact = false
}) => {
  const [quotaStatuses, setQuotaStatuses] = useState<QuotaStatus[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { quotas, checkQuotaUsage } = useFeatureFlags();

  useEffect(() => {
    fetchQuotaStatuses();
  }, [quotas]);

  const fetchQuotaStatuses = async () => {
    if (Object.keys(quotas).length === 0) {
      setLoading(false);
      return;
    }

    try {
      const statuses: QuotaStatus[] = [];
      const metricsToCheck = metric ? [metric] : Object.keys(quotas);
      
      for (const metricKey of metricsToCheck) {
        if (quotas[metricKey] !== -1) { // Skip unlimited quotas
          const status = await checkQuotaUsage(metricKey);
          statuses.push({
            metric: metricKey,
            ...status
          });
        }
      }
      
      setQuotaStatuses(statuses);
    } catch (error) {
      console.error('Error fetching quota statuses:', error);
    } finally {
      setLoading(false);
    }
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

  const getAlertVariant = (percentage: number) => {
    if (percentage >= 100) return 'destructive';
    if (percentage >= 90) return 'destructive';
    if (percentage >= threshold) return 'default';
    return 'default';
  };

  const getAlertIcon = (percentage: number) => {
    if (percentage >= 100) return <AlertTriangle className="h-4 w-4" />;
    if (percentage >= 90) return <AlertTriangle className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  const getAlertTitle = (percentage: number, metricName: string) => {
    if (percentage >= 100) return `Limite de ${metricName} excedido`;
    if (percentage >= 90) return `Limite de ${metricName} quase atingido`;
    return `Uso de ${metricName} elevado`;
  };

  const getAlertMessage = (status: QuotaStatus) => {
    const metricName = getMetricName(status.metric);
    
    if (status.percentage >= 100) {
      return `Você atingiu o limite de ${status.limit.toLocaleString()} ${metricName.toLowerCase()}. Faça upgrade do seu plano para continuar.`;
    }
    
    if (status.percentage >= 90) {
      return `Você está usando ${status.current.toLocaleString()} de ${status.limit.toLocaleString()} ${metricName.toLowerCase()} (${status.percentage.toFixed(1)}%). Considere fazer upgrade do seu plano.`;
    }
    
    return `Você está usando ${status.percentage.toFixed(1)}% do seu limite de ${metricName.toLowerCase()}.`;
  };

  const handleDismiss = (metric: string) => {
    setDismissedAlerts(prev => new Set([...prev, metric]));
  };

  const alertsToShow = quotaStatuses.filter(status => 
    status.percentage >= threshold && 
    !dismissedAlerts.has(status.metric)
  );

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-16 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (alertsToShow.length === 0) {
    return null;
  }

  if (compact) {
    const highestUsage = alertsToShow.reduce((max, current) => 
      current.percentage > max.percentage ? current : max
    );
    
    return (
      <Alert className={`border-l-4 ${
        highestUsage.percentage >= 100 ? 'border-l-red-500 bg-red-50' :
        highestUsage.percentage >= 90 ? 'border-l-yellow-500 bg-yellow-50' :
        'border-l-blue-500 bg-blue-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getAlertIcon(highestUsage.percentage)}
            <span className="text-sm font-medium">
              {getMetricName(highestUsage.metric)}: {highestUsage.percentage.toFixed(1)}% usado
            </span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/billing">
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {alertsToShow.map((status) => {
        const metricName = getMetricName(status.metric);
        const variant = getAlertVariant(status.percentage);
        
        return (
          <Alert 
            key={status.metric} 
            className={`${
              status.percentage >= 100 ? 'border-red-500 bg-red-50' :
              status.percentage >= 90 ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getAlertIcon(status.percentage)}
                  <h4 className="font-semibold">
                    {getAlertTitle(status.percentage, metricName)}
                  </h4>
                </div>
                
                <AlertDescription className="mb-3">
                  {getAlertMessage(status)}
                </AlertDescription>
                
                {showProgress && (
                  <div className="space-y-2">
                    <Progress 
                      value={Math.min(status.percentage, 100)} 
                      className={`h-2 ${
                        status.percentage >= 100 ? 'bg-red-200' :
                        status.percentage >= 90 ? 'bg-yellow-200' :
                        'bg-blue-200'
                      }`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{status.current.toLocaleString()} usado</span>
                      <span>{status.limit.toLocaleString()} limite</span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 mt-3">
                  <Button size="sm" asChild>
                    <Link href="/billing">
                      Fazer Upgrade
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchQuotaStatuses}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Atualizar
                  </Button>
                </div>
              </div>
              
              {dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(status.metric)}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Alert>
        );
      })}
    </div>
  );
};

export default QuotaAlert;
