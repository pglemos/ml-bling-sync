'use client'

import React, { useState } from 'react'
import { TenantProvider, useTenant } from '@/hooks/useTenant'
import TenantBranding from '@/components/admin/TenantBranding'
import TenantFeatures from '@/components/admin/TenantFeatures'
import TenantSettings from '@/components/admin/TenantSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/tabs'
import { Badge } from '@/components/shared/badge'
import { Button } from '@/components/shared/button'
import { Separator } from '@/components/shared/separator'
import { Alert, AlertDescription } from '@/components/shared/alert'
import { 
  Building2, 
  Palette, 
  Settings, 
  Zap, 
  Users, 
  Package, 
  ShoppingCart, 
  Activity,
  Calendar,
  Crown,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

function TenantOverview() {
  const { tenant, stats, isLoading } = useTenant()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded mb-1" />
              <div className="h-3 w-24 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'trial': return 'bg-blue-100 text-blue-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'trial': return <Clock className="h-4 w-4" />
      case 'suspended': return <AlertTriangle className="h-4 w-4" />
      case 'inactive': return <AlertTriangle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Tenant Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{tenant?.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>@{tenant?.slug}</span>
                  {tenant?.domain && (
                    <>
                      <span>•</span>
                      <span>{tenant.domain}</span>
                    </>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(tenant?.status || 'inactive')}>
                {getStatusIcon(tenant?.status || 'inactive')}
                <span className="ml-1 capitalize">{tenant?.status}</span>
              </Badge>
              {tenant?.plan_id && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  {tenant.plan_id}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        {tenant?.trial_ends_at && tenant.status === 'trial' && (
          <CardContent>
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Trial ends on {new Date(tenant.trial_ends_at).toLocaleDateString()}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_products || 0}</div>
            <p className="text-xs text-muted-foreground">
              Synced products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total orders processed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.active_integrations || 0}/{stats?.total_integrations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active integrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Palette className="h-5 w-5 mb-2" />
              <span className="font-medium">Update Branding</span>
              <span className="text-sm text-muted-foreground">Customize colors and logo</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Zap className="h-5 w-5 mb-2" />
              <span className="font-medium">Manage Features</span>
              <span className="text-sm text-muted-foreground">Enable/disable features</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Settings className="h-5 w-5 mb-2" />
              <span className="font-medium">Configure Settings</span>
              <span className="text-sm text-muted-foreground">Update preferences</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {stats?.last_activity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Last Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Last activity: {new Date(stats.last_activity).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TenantAdminContent() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Administration</h1>
          <p className="text-muted-foreground">
            Manage your tenant configuration, branding, and settings
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <TenantOverview />
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <TenantBranding />
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <TenantFeatures />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <TenantSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function TenantAdminPage() {
  return (
    <TenantProvider>
      <TenantAdminContent />
    </TenantProvider>
  )
}
