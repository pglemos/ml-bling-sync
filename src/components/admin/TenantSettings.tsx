'use client'

import React, { useState, useEffect } from 'react'
import { useTenant } from '@/hooks/useTenant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Label } from '@/components/shared/label'
import { Textarea } from '@/components/shared/textarea'
import { Switch } from '@/components/shared/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/select'
import { Separator } from '@/components/shared/separator'
import { Alert, AlertDescription } from '@/components/shared/alert'
import { Loader2, Save, AlertCircle, Globe, Mail, Phone, MapPin, Clock, Bell } from 'lucide-react'
import { toast } from 'sonner'

interface TenantSettingsForm {
  // Contact Information
  contact_email: string
  contact_phone: string
  address: string
  
  // Localization
  timezone: string
  language: string
  currency: string
  date_format: string
  
  // Notifications
  email_notifications: boolean
  webhook_notifications: boolean
  notification_frequency: string
  
  // Integration Settings
  auto_sync_enabled: boolean
  sync_interval: number
  retry_attempts: number
  
  // Security
  session_timeout: number
  require_2fa: boolean
  password_policy: string
  
  // Data Retention
  data_retention_days: number
  auto_cleanup_enabled: boolean
  
  // Custom Settings
  custom_settings: Record<string, any>
}

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Sao_Paulo', label: 'Brasília Time (BRT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
]

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
]

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'BRL', label: 'Brazilian Real (BRL)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
]

const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
]

const NOTIFICATION_FREQUENCY_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
]

const PASSWORD_POLICY_OPTIONS = [
  { value: 'basic', label: 'Basic (8+ characters)' },
  { value: 'medium', label: 'Medium (8+ chars, numbers)' },
  { value: 'strong', label: 'Strong (8+ chars, numbers, symbols)' },
  { value: 'enterprise', label: 'Enterprise (12+ chars, complex)' },
]

export default function TenantSettings() {
  const { tenant, updateSettings, isLoading } = useTenant()
  const [settings, setSettings] = useState<TenantSettingsForm>({
    contact_email: '',
    contact_phone: '',
    address: '',
    timezone: 'UTC',
    language: 'en',
    currency: 'USD',
    date_format: 'MM/DD/YYYY',
    email_notifications: true,
    webhook_notifications: false,
    notification_frequency: 'daily',
    auto_sync_enabled: true,
    sync_interval: 60,
    retry_attempts: 3,
    session_timeout: 480,
    require_2fa: false,
    password_policy: 'medium',
    data_retention_days: 365,
    auto_cleanup_enabled: false,
    custom_settings: {},
  })
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (tenant) {
      setSettings({
        contact_email: tenant.contact_email || '',
        contact_phone: tenant.contact_phone || '',
        address: tenant.address || '',
        timezone: tenant.settings?.timezone || 'UTC',
        language: tenant.settings?.language || 'en',
        currency: tenant.settings?.currency || 'USD',
        date_format: tenant.settings?.date_format || 'MM/DD/YYYY',
        email_notifications: tenant.settings?.email_notifications ?? true,
        webhook_notifications: tenant.settings?.webhook_notifications ?? false,
        notification_frequency: tenant.settings?.notification_frequency || 'daily',
        auto_sync_enabled: tenant.settings?.auto_sync_enabled ?? true,
        sync_interval: tenant.settings?.sync_interval || 60,
        retry_attempts: tenant.settings?.retry_attempts || 3,
        session_timeout: tenant.settings?.session_timeout || 480,
        require_2fa: tenant.settings?.require_2fa ?? false,
        password_policy: tenant.settings?.password_policy || 'medium',
        data_retention_days: tenant.settings?.data_retention_days || 365,
        auto_cleanup_enabled: tenant.settings?.auto_cleanup_enabled ?? false,
        custom_settings: tenant.settings?.custom_settings || {},
      })
    }
  }, [tenant])

  const handleChange = (key: keyof TenantSettingsForm, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Prepare settings object
      const settingsToUpdate = {
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        address: settings.address,
        settings: {
          timezone: settings.timezone,
          language: settings.language,
          currency: settings.currency,
          date_format: settings.date_format,
          email_notifications: settings.email_notifications,
          webhook_notifications: settings.webhook_notifications,
          notification_frequency: settings.notification_frequency,
          auto_sync_enabled: settings.auto_sync_enabled,
          sync_interval: settings.sync_interval,
          retry_attempts: settings.retry_attempts,
          session_timeout: settings.session_timeout,
          require_2fa: settings.require_2fa,
          password_policy: settings.password_policy,
          data_retention_days: settings.data_retention_days,
          auto_cleanup_enabled: settings.auto_cleanup_enabled,
          custom_settings: settings.custom_settings,
        },
      }
      
      await updateSettings(settingsToUpdate)
      setHasChanges(false)
      toast.success('Settings updated successfully')
    } catch (error) {
      toast.error('Failed to update settings')
      console.error('Error updating settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (tenant) {
      // Reset to original values
      setSettings({
        contact_email: tenant.contact_email || '',
        contact_phone: tenant.contact_phone || '',
        address: tenant.address || '',
        timezone: tenant.settings?.timezone || 'UTC',
        language: tenant.settings?.language || 'en',
        currency: tenant.settings?.currency || 'USD',
        date_format: tenant.settings?.date_format || 'MM/DD/YYYY',
        email_notifications: tenant.settings?.email_notifications ?? true,
        webhook_notifications: tenant.settings?.webhook_notifications ?? false,
        notification_frequency: tenant.settings?.notification_frequency || 'daily',
        auto_sync_enabled: tenant.settings?.auto_sync_enabled ?? true,
        sync_interval: tenant.settings?.sync_interval || 60,
        retry_attempts: tenant.settings?.retry_attempts || 3,
        session_timeout: tenant.settings?.session_timeout || 480,
        require_2fa: tenant.settings?.require_2fa ?? false,
        password_policy: tenant.settings?.password_policy || 'medium',
        data_retention_days: tenant.settings?.data_retention_days || 365,
        auto_cleanup_enabled: tenant.settings?.auto_cleanup_enabled ?? false,
        custom_settings: tenant.settings?.custom_settings || {},
      })
      setHasChanges(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenant Settings</h2>
          <p className="text-muted-foreground">
            Configure general settings and preferences for your tenant
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
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Contact details for your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={settings.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 Main St, City, State, ZIP"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Localization
            </CardTitle>
            <CardDescription>
              Regional settings and formatting preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(value) => handleChange('timezone', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={settings.language} onValueChange={(value) => handleChange('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={settings.currency} onValueChange={(value) => handleChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_format">Date Format</Label>
                <Select value={settings.date_format} onValueChange={(value) => handleChange('date_format', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => handleChange('email_notifications', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Webhook Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications to webhook endpoints
                </p>
              </div>
              <Switch
                checked={settings.webhook_notifications}
                onCheckedChange={(checked) => handleChange('webhook_notifications', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification_frequency">Notification Frequency</Label>
              <Select value={settings.notification_frequency} onValueChange={(value) => handleChange('notification_frequency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Integration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Integration Settings
            </CardTitle>
            <CardDescription>
              Configure automatic synchronization and retry behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Sync Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync data at regular intervals
                </p>
              </div>
              <Switch
                checked={settings.auto_sync_enabled}
                onCheckedChange={(checked) => handleChange('auto_sync_enabled', checked)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sync_interval">Sync Interval (minutes)</Label>
                <Input
                  id="sync_interval"
                  type="number"
                  value={settings.sync_interval}
                  onChange={(e) => handleChange('sync_interval', parseInt(e.target.value) || 60)}
                  min={5}
                  max={1440}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retry_attempts">Retry Attempts</Label>
                <Input
                  id="retry_attempts"
                  type="number"
                  value={settings.retry_attempts}
                  onChange={(e) => handleChange('retry_attempts', parseInt(e.target.value) || 3)}
                  min={1}
                  max={10}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Configure security policies and authentication requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all users
                </p>
              </div>
              <Switch
                checked={settings.require_2fa}
                onCheckedChange={(checked) => handleChange('require_2fa', checked)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  value={settings.session_timeout}
                  onChange={(e) => handleChange('session_timeout', parseInt(e.target.value) || 480)}
                  min={30}
                  max={1440}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_policy">Password Policy</Label>
                <Select value={settings.password_policy} onValueChange={(value) => handleChange('password_policy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PASSWORD_POLICY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
            <CardDescription>
              Configure data retention policies and cleanup settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Cleanup Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically delete old data based on retention policy
                </p>
              </div>
              <Switch
                checked={settings.auto_cleanup_enabled}
                onCheckedChange={(checked) => handleChange('auto_cleanup_enabled', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_retention_days">Data Retention (days)</Label>
              <Input
                id="data_retention_days"
                type="number"
                value={settings.data_retention_days}
                onChange={(e) => handleChange('data_retention_days', parseInt(e.target.value) || 365)}
                min={30}
                max={2555}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
