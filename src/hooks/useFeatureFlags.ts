"use client";
/* eslint-disable */

import React, { useState, useEffect, useCallback } from 'react';
import { useTenant } from './useTenant';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  plan_required?: string;
}

interface FeatureFlagsResponse {
  features: Record<string, boolean>;
  plan_features: Record<string, boolean>;
  quotas: Record<string, number>;
}

export const useFeatureFlags = () => {
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [quotas, setQuotas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenant } = useTenant();

  const fetchFeatureFlags = useCallback(async () => {
    if (!tenant?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/v1/billing/features');
      
      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }

      const data: FeatureFlagsResponse = await response.json();
      setFeatures({ ...data.features, ...data.plan_features });
      setQuotas(data.quotas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching feature flags:', err);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    fetchFeatureFlags();
  }, [fetchFeatureFlags]);

  // Helper functions
  const hasFeature = useCallback((featureKey: string): boolean => {
    return features[featureKey] === true;
  }, [features]);

  const getQuota = useCallback((quotaKey: string): number => {
    return quotas[quotaKey] || 0;
  }, [quotas]);

  const isUnlimited = useCallback((quotaKey: string): boolean => {
    return quotas[quotaKey] === -1;
  }, [quotas]);

  const checkQuotaUsage = useCallback(async (quotaKey: string): Promise<{
    current: number;
    limit: number;
    percentage: number;
    canUse: boolean;
  }> => {
    try {
      const response = await fetch(`/api/v1/billing/quota/${quotaKey}`);
      if (!response.ok) {
        throw new Error('Failed to check quota');
      }
      return await response.json();
    } catch (err) {
      console.error('Error checking quota:', err);
      return {
        current: 0,
        limit: getQuota(quotaKey),
        percentage: 0,
        canUse: false
      };
    }
  }, [getQuota]);

  // Common feature checks
  const canUseAdvancedAnalytics = hasFeature('advanced_analytics');
  const canUseWhiteLabel = hasFeature('white_label');
  const canUseCustomIntegrations = hasFeature('custom_integrations');
  const canUseApiAccess = hasFeature('api_access');
  const canUsePrioritySupport = hasFeature('priority_support');
  const canUseDedicatedSupport = hasFeature('dedicated_support');
  const canUseEmailSupport = hasFeature('email_support');
  const canUseBasicSync = hasFeature('basic_sync');

  // Common quota checks
  const maxProducts = getQuota('products');
  const maxOrdersPerMonth = getQuota('orders_per_month');
  const maxApiCallsPerMonth = getQuota('api_calls_per_month');
  const maxIntegrations = getQuota('integrations');
  const maxUsers = getQuota('users');

  const hasUnlimitedProducts = isUnlimited('products');
  const hasUnlimitedOrders = isUnlimited('orders_per_month');
  const hasUnlimitedApiCalls = isUnlimited('api_calls_per_month');
  const hasUnlimitedIntegrations = isUnlimited('integrations');
  const hasUnlimitedUsers = isUnlimited('users');

  return {
    // State
    features,
    quotas,
    loading,
    error,
    
    // Helper functions
    hasFeature,
    getQuota,
    isUnlimited,
    checkQuotaUsage,
    refetch: fetchFeatureFlags,
    
    // Common feature flags
    canUseAdvancedAnalytics,
    canUseWhiteLabel,
    canUseCustomIntegrations,
    canUseApiAccess,
    canUsePrioritySupport,
    canUseDedicatedSupport,
    canUseEmailSupport,
    canUseBasicSync,
    
    // Common quotas
    maxProducts,
    maxOrdersPerMonth,
    maxApiCallsPerMonth,
    maxIntegrations,
    maxUsers,
    
    // Unlimited checks
    hasUnlimitedProducts,
    hasUnlimitedOrders,
    hasUnlimitedApiCalls,
    hasUnlimitedIntegrations,
    hasUnlimitedUsers,
  };
};

// HOC for feature-gated components
export const withFeatureFlag = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredFeature: string,
  fallback?: React.ComponentType<P> | React.ReactElement | null
) => {
  return (props: P) => {
    const { hasFeature, loading } = useFeatureFlags();
    
    if (loading) {
      return <div className="animate-pulse bg-gray-200 rounded h-8 w-full"></div>;
    }
    
    if (!hasFeature(requiredFeature)) {
      if (fallback) {
        if (React.isValidElement(fallback)) {
          return fallback;
        }
        const FallbackComponent = fallback as React.ComponentType<P>;
        return <FallbackComponent {...props} />;
      }
      return null;
    }
    
    return <WrappedComponent {...props} />;
  };
};

// Component for feature-gated content
interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgrade = false
}) => {
  const { hasFeature, loading } = useFeatureFlags();
  
  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded h-8 w-full"></div>;
  }
  
  if (!hasFeature(feature)) {
    if (showUpgrade) {
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="text-gray-500 mb-2">
            Este recurso requer um plano superior
          </div>
          <button 
            onClick={() => window.location.href = '/billing'}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Fazer upgrade do plano →
          </button>
        </div>
      );
    }
    return fallback || null;
  }
  
  return <>{children}</>;
};

export default useFeatureFlags;
