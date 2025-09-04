'use client'

import React, { useState, useEffect } from 'react'
import { useTenant } from '@/hooks/useTenant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card'
import { Switch } from '@/components/shared/switch'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Label } from '@/components/shared/label'
import { Badge } from '@/components/shared/badge'
import { Separator } from '@/components/shared/separator'
import { Alert, AlertDescription } from '@/components/shared/alert'
import { Loader2, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface FeatureConfig {
  key: string
  label: string
  description: string
  type: 'boolean' | 'number'
  category: 'core' | 'advanced' | 'integrations' | 'limits'
  planRequired?: string
  min?: number
  max?: number
}

const FEATURE_CONFIGS: FeatureConfig[] = [
  // Core Features
  {
    key: 'api_access',
    label: 'API Access',
    description: 'Enable REST API access for integrations',
    type: 'boolean',
    category: 'core',
  },
  {
    key: 'bulk_operations',
    label: 'Bulk Operations',
    description: 'Allow bulk import/export and batch operations',
    type: 'boolean',
    category: 'core',
  },
  {
    key: 'data_export',
    label: 'Data Export',
    description: 'Enable CSV/Excel export functionality',
    type: 'boolean',
    category: 'core',
  },
  {
    key: 'multi_user',
    label: 'Multi-User Access',
    description: 'Allow multiple users per tenant',
    type: 'boolean',
    category: 'core',
    planRequired: 'Pro',
  },

  // Advanced Features
  {
    key: 'advanced_reporting',
    label: 'Advanced Reporting',
    description: 'Access to detailed analytics and custom reports',
    type: 'boolean',
    category: 'advanced',
    planRequired: 'Pro',
  },
  {
    key: 'custom_branding',
    label: 'Custom Branding',
    description: 'Customize colors, logos, and themes',
    type: 'boolean',
    category: 'advanced',
    planRequired: 'Pro',
  },
  {
    key: 'webhook_notifications',
    label: 'Webhook Notifications',
    description: 'Real-time notifications via webhooks',
    type: 'boolean',
    category: 'advanced',
    planRequired: 'Pro',
  },
  {
    key: 'priority_support',
    label: 'Priority Support',
    description: 'Access to priority customer support',
    type: 'boolean',
    category: 'advanced',
    planRequired: 'Enterprise',
  },

  // Limits
  {
    key: 'integrations_limit',
    label: 'Integrations Limit',
    description: 'Maximum number of active integrations',
    type: 'number',
    category: 'limits',
    min: 1,
    max: 100,
  },
  {
    key: 'products_limit',
    label: 'Products Limit',
    description: 'Maximum number of products that can be synced',
    type: 'number',
    category: 'limits',
    min: 100,
    max: 100000,
  },
  {
    key: 'orders_limit',
    label: 'Orders Limit',
    description: 'Maximum number of orders per month',
    type: 'number',
    category: 'limits',
    min: 100,
    max: 1000000,
  },
]

const PLAN_COLORS = {
  Basic: 'bg-gray-100 text-gray-800',
  Pro: 'bg-blue-100 text-blue-800',
  Enterprise: 'bg-purple-100 text-purple-800',
}

export default function TenantFeatures() {
  const { tenant, updateFeatures, isLoading } = useTenant()
  const [features, setFeatures] = useState<Record<string, boolean | number>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (tenant?.features) {
      setFeatures(tenant.features)
    }
  }, [tenant])

  const handleFeatureChange = (key: string, value: boolean | number) => {
    setFeatures(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await updateFeatures(features)
      setHasChanges(false)
      toast.success('Features updated successfully')
    } catch (error) {
      toast.error('Failed to update features')
      console.error('Error updating features:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (tenant?.features) {
      setFeatures(tenant.features)
      setHasChanges(false)
    }
  }

  const groupedFeatures = FEATURE_CONFIGS.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = []
    }
    acc[config.category].push(config)
    return acc
  }, {} as Record<string, FeatureConfig[]>)

  const categoryTitles = {
    core: 'Core Features',
    advanced: 'Advanced Features',
    integrations: 'Integration Features',
    limits: 'Usage Limits',
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading features...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Feature Configuration</h2>
          <p className="text-muted-foreground">
            Configure available features and usage limits for your tenant
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
            className="min-w-[100px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Click "Save Changes" to apply them.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {Object.entries(groupedFeatures).map(([category, configs]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{categoryTitles[category as keyof typeof categoryTitles]}</CardTitle>
              <CardDescription>
                {category === 'core' && 'Essential features for basic functionality'}
                {category === 'advanced' && 'Premium features for enhanced capabilities'}
                {category === 'integrations' && 'Features related to third-party integrations'}
                {category === 'limits' && 'Usage quotas and resource limits'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configs.map((config, index) => (
                <div key={config.key}>
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={config.key} className="text-sm font-medium">
                          {config.label}
                        </Label>
                        {config.planRequired && (
                          <Badge 
                            variant="secondary" 
                            className={PLAN_COLORS[config.planRequired as keyof typeof PLAN_COLORS]}
                          >
                            {config.planRequired}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {config.type === 'boolean' ? (
                        <Switch
                          id={config.key}
                          checked={Boolean(features[config.key])}
                          onCheckedChange={(checked) => handleFeatureChange(config.key, checked)}
                        />
                      ) : (
                        <Input
                          id={config.key}
                          type="number"
                          value={features[config.key] || 0}
                          onChange={(e) => handleFeatureChange(config.key, parseInt(e.target.value) || 0)}
                          min={config.min}
                          max={config.max}
                          className="w-24 text-right"
                        />
                      )}
                    </div>
                  </div>
                  {index < configs.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Plan Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Plan</Label>
              <p className="font-medium">{tenant?.plan_id || 'Basic'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Status</Label>
              <p className="font-medium capitalize">{tenant?.status}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Integrations</Label>
              <p className="font-medium">{features.integrations_limit || 'Unlimited'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Products</Label>
              <p className="font-medium">{features.products_limit || 'Unlimited'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
