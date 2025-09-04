'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Label } from '@/components/shared/label'
import { Textarea } from '@/components/shared/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/select'
import { Badge } from '@/components/shared/badge'
import { Separator } from '@/components/shared/separator'
import { Upload, Palette, Eye, Save, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/shared/use-toast'

interface TenantBranding {
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  name: string
  domain?: string
}

interface TenantBrandingProps {
  tenantId?: string
  initialBranding?: TenantBranding
  onSave?: (branding: TenantBranding) => void
}

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Nunito', label: 'Nunito' }
]

const colorPresets = [
  { name: 'Blue', primary: '#3B82F6', secondary: '#1E40AF', accent: '#10B981' },
  { name: 'Purple', primary: '#8B5CF6', secondary: '#7C3AED', accent: '#F59E0B' },
  { name: 'Green', primary: '#10B981', secondary: '#059669', accent: '#3B82F6' },
  { name: 'Red', primary: '#EF4444', secondary: '#DC2626', accent: '#F59E0B' },
  { name: 'Orange', primary: '#F97316', secondary: '#EA580C', accent: '#10B981' },
  { name: 'Pink', primary: '#EC4899', secondary: '#DB2777', accent: '#8B5CF6' }
]

export default function TenantBranding({ tenantId, initialBranding, onSave }: TenantBrandingProps) {
  const { toast } = useToast()
  const [branding, setBranding] = useState<TenantBranding>({
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    accent_color: '#10B981',
    font_family: 'Inter',
    name: '',
    ...initialBranding
  })
  const [isLoading, setIsLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    if (initialBranding) {
      setBranding(initialBranding)
    }
  }, [initialBranding])

  const handleColorChange = (field: keyof TenantBranding, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }))
  }

  const handleInputChange = (field: keyof TenantBranding, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }))
  }

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setBranding(prev => ({
      ...prev,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent
    }))
    toast({
      title: "Color preset applied",
      description: `Applied ${preset.name} color scheme`
    })
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      if (onSave) {
        await onSave(branding)
      } else {
        // Default API call
        const response = await fetch('/api/v1/tenants/current/branding', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(branding)
        })

        if (!response.ok) {
          throw new Error('Failed to save branding')
        }
      }

      toast({
        title: "Branding saved",
        description: "Your branding settings have been updated successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save branding settings",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const PreviewCard = () => (
    <Card 
      className="border-2" 
      style={{ 
        borderColor: branding.primary_color,
        fontFamily: branding.font_family 
      }}
    >
      <CardHeader style={{ backgroundColor: branding.primary_color, color: 'white' }}>
        <CardTitle>{branding.name || 'Your Company'}</CardTitle>
        <CardDescription style={{ color: 'rgba(255,255,255,0.8)' }}>
          Preview of your branding
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <Button 
            style={{ backgroundColor: branding.secondary_color }}
            className="w-full text-white"
          >
            Primary Action
          </Button>
          <Button 
            variant="outline" 
            style={{ 
              borderColor: branding.accent_color,
              color: branding.accent_color 
            }}
            className="w-full"
          >
            Secondary Action
          </Button>
          <div className="flex gap-2">
            <Badge style={{ backgroundColor: branding.accent_color }}>Active</Badge>
            <Badge variant="outline" style={{ borderColor: branding.primary_color, color: branding.primary_color }}>
              Pending
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Brand Customization</h2>
          <p className="text-muted-foreground">
            Customize your tenant's appearance and branding
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure your tenant's basic branding information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  value={branding.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="domain">Custom Domain</Label>
                <Input
                  id="domain"
                  value={branding.domain || ''}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  placeholder="your-domain.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="logo"
                    value={branding.logo_url || ''}
                    onChange={(e) => handleInputChange('logo_url', e.target.value)}
                    placeholder="https://your-domain.com/logo.png"
                  />
                  <Button variant="outline" size="icon">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Scheme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Color Scheme
              </CardTitle>
              <CardDescription>
                Choose colors that represent your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Color Presets */}
              <div className="space-y-2">
                <Label>Quick Presets</Label>
                <div className="grid grid-cols-3 gap-2">
                  {colorPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyColorPreset(preset)}
                      className="flex items-center gap-2"
                    >
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: preset.primary }}
                      />
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Individual Colors */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary"
                      type="color"
                      value={branding.primary_color}
                      onChange={(e) => handleColorChange('primary_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={branding.primary_color}
                      onChange={(e) => handleColorChange('primary_color', e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary"
                      type="color"
                      value={branding.secondary_color}
                      onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={branding.secondary_color}
                      onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                      placeholder="#1E40AF"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent"
                      type="color"
                      value={branding.accent_color}
                      onChange={(e) => handleColorChange('accent_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={branding.accent_color}
                      onChange={(e) => handleColorChange('accent_color', e.target.value)}
                      placeholder="#10B981"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>
                Select the font family for your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="font">Font Family</Label>
                <Select
                  value={branding.font_family}
                  onValueChange={(value) => handleInputChange('font_family', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        {previewMode && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  See how your branding will look in the application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PreviewCard />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
