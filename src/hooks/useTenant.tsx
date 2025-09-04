'use client'

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface TenantBranding {
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  name: string
  domain?: string
}

interface TenantFeatures {
  api_access: boolean
  bulk_operations: boolean
  advanced_reporting: boolean
  custom_branding: boolean
  webhook_notifications: boolean
  priority_support: boolean
  data_export: boolean
  multi_user: boolean
  integrations_limit: number
  products_limit: number
  orders_limit: number
  [key: string]: boolean | number
}

interface TenantSettings {
  [key: string]: any
}

interface Tenant {
  id: string
  name: string
  slug: string
  domain?: string
  status: 'active' | 'inactive' | 'suspended' | 'trial'
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  contact_email?: string
  contact_phone?: string
  address?: string
  settings: TenantSettings
  features: TenantFeatures
  plan_id?: string
  subscription_id?: string
  trial_ends_at?: string
  created_at: string
  updated_at?: string
}

interface TenantStats {
  total_users: number
  total_products: number
  total_orders: number
  total_integrations: number
  active_integrations: number
  last_activity?: string
}

interface TenantContextType {
  tenant: Tenant | null
  branding: TenantBranding | null
  stats: TenantStats | null
  isLoading: boolean
  error: string | null
  refreshTenant: () => Promise<void>
  updateBranding: (branding: Partial<TenantBranding>) => Promise<void>
  updateFeatures: (features: Partial<TenantFeatures>) => Promise<void>
  updateSettings: (settings: Partial<TenantSettings>) => Promise<void>
  checkFeature: (featureName: string) => boolean
  getSetting: (settingName: string, defaultValue?: any) => any
  applyBranding: () => void
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [branding, setBranding] = useState<TenantBranding | null>(null)
  const [stats, setStats] = useState<TenantStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchTenant = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/v1/tenants/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch tenant')
      }

      const tenantData = await response.json()
      setTenant(tenantData)

      // Extract branding information
      setBranding({
        logo_url: tenantData.logo_url,
        primary_color: tenantData.primary_color,
        secondary_color: tenantData.secondary_color,
        accent_color: tenantData.accent_color,
        font_family: tenantData.font_family,
        name: tenantData.name,
        domain: tenantData.domain,
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/tenants/current/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const statsData = await response.json()
        setStats(statsData)
      }
    } catch (err) {
      console.error('Failed to fetch tenant stats:', err)
    }
  }

  const refreshTenant = async () => {
    await fetchTenant()
    await fetchStats()
  }

  const updateBranding = async (brandingData: Partial<TenantBranding>) => {
    try {
      const response = await fetch('/api/v1/tenants/current/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(brandingData),
      })

      if (!response.ok) {
        throw new Error('Failed to update branding')
      }

      // Update local state
      setBranding(prev => prev ? { ...prev, ...brandingData } : null)
      
      // Refresh tenant data
      await fetchTenant()
      
      // Apply new branding
      applyBranding()

    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update branding')
    }
  }

  const updateFeatures = async (features: Partial<TenantFeatures>) => {
    try {
      const response = await fetch('/api/v1/tenants/current/features', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(features),
      })

      if (!response.ok) {
        throw new Error('Failed to update features')
      }

      // Refresh tenant data
      await fetchTenant()

    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update features')
    }
  }

  const updateSettings = async (settings: Partial<TenantSettings>) => {
    try {
      const response = await fetch('/api/v1/tenants/current/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      // Refresh tenant data
      await fetchTenant()

    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update settings')
    }
  }

  const checkFeature = (featureName: string): boolean => {
    if (!tenant?.features) return false
    return Boolean(tenant.features[featureName])
  }

  const getSetting = (settingName: string, defaultValue: any = null): any => {
    if (!tenant?.settings) return defaultValue
    return tenant.settings[settingName] ?? defaultValue
  }

  const applyBranding = () => {
    if (!branding) return

    // Apply CSS custom properties for theming
    const root = document.documentElement
    root.style.setProperty('--tenant-primary', branding.primary_color)
    root.style.setProperty('--tenant-secondary', branding.secondary_color)
    root.style.setProperty('--tenant-accent', branding.accent_color)
    root.style.setProperty('--tenant-font-family', branding.font_family)

    // Update document title if needed
    if (branding.name) {
      document.title = `${branding.name} - ML Bling Sync`
    }

    // Update favicon if logo is available
    if (branding.logo_url) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (favicon) {
        favicon.href = branding.logo_url
      }
    }
  }

  useEffect(() => {
    refreshTenant()
  }, [])

  useEffect(() => {
    if (branding) {
      applyBranding()
    }
  }, [branding])

  const value: TenantContextType = {
    tenant,
    branding,
    stats,
    isLoading,
    error,
    refreshTenant,
    updateBranding,
    updateFeatures,
    updateSettings,
    checkFeature,
    getSetting,
    applyBranding,
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

// Hook for checking feature access
export function useFeature(featureName: string) {
  const { checkFeature } = useTenant()
  return checkFeature(featureName)
}

// Hook for getting tenant settings
export function useTenantSetting(settingName: string, defaultValue?: any) {
  const { getSetting } = useTenant()
  return getSetting(settingName, defaultValue)
}

// Hook for tenant branding
export function useTenantBranding() {
  const { branding, updateBranding, applyBranding } = useTenant()
  return { branding, updateBranding, applyBranding }
}
