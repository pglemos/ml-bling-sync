'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card'
import { Button } from '@/components/shared/button'
import { Badge } from '@/components/shared/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/shared/alert'
import { Progress } from '@/components/shared/progress'
import { 
  Users, 
  Building2, 
  CreditCard, 
  BarChart3, 
  Shield, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  UserCheck,
  Activity,
  Zap,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Server,
  Database,
  Wifi,
  WifiOff,
  AlertCircle,
  Info,
  Calendar,
  Target,
  Percent,
  ArrowUp,
  ArrowDown,
  Minus,
  Globe,
  ShoppingCart,
  FileText,
  Download,
  Upload,
  Crown
} from 'lucide-react'

// Mock data para demonstração com dados mais realistas
const mockUsers = [
  { id: 1, name: 'João Silva', email: 'joao@empresa.com', role: 'Admin', status: 'active', lastLogin: '2024-01-20T10:30:00Z', loginCount: 245, createdAt: '2023-06-15T09:00:00Z' },
  { id: 2, name: 'Maria Santos', email: 'maria@loja.com', role: 'Lojista', status: 'active', lastLogin: '2024-01-20T09:15:00Z', loginCount: 189, createdAt: '2023-08-22T14:30:00Z' },
  { id: 3, name: 'Pedro Costa', email: 'pedro@test.com', role: 'Teste', status: 'inactive', lastLogin: '2024-01-19T16:45:00Z', loginCount: 12, createdAt: '2024-01-10T11:20:00Z' },
  { id: 4, name: 'Ana Oliveira', email: 'ana@shop.com', role: 'Lojista', status: 'active', lastLogin: '2024-01-20T11:20:00Z', loginCount: 156, createdAt: '2023-09-05T16:45:00Z' },
  { id: 5, name: 'Carlos Ferreira', email: 'carlos@admin.com', role: 'Admin', status: 'active', lastLogin: '2024-01-20T08:30:00Z', loginCount: 298, createdAt: '2023-05-10T10:15:00Z' },
  { id: 6, name: 'Lucia Mendes', email: 'lucia@store.com', role: 'Lojista', status: 'active', lastLogin: '2024-01-20T07:45:00Z', loginCount: 203, createdAt: '2023-07-18T13:20:00Z' },
  { id: 7, name: 'Roberto Lima', email: 'roberto@test.com', role: 'Teste', status: 'active', lastLogin: '2024-01-20T06:30:00Z', loginCount: 45, createdAt: '2023-12-01T09:30:00Z' }
]

const mockSuppliers = [
  { id: 1, name: 'Seu Armazém Drop', status: 'connected', products: 1500, syncedProducts: 1485, lastSync: '2024-01-20T14:30:00Z', errorCount: 15, revenue: 125000 },
  { id: 2, name: 'Traz Pra Cá Club', status: 'connected', products: 850, syncedProducts: 845, lastSync: '2024-01-20T13:45:00Z', errorCount: 5, revenue: 89000 },
  { id: 3, name: 'WeDrop', status: 'error', products: 2200, syncedProducts: 550, lastSync: '2024-01-19T10:20:00Z', errorCount: 45, revenue: 45000 },
  { id: 4, name: 'Fornecedor Teste', status: 'disconnected', products: 0, syncedProducts: 0, lastSync: null, errorCount: 0, revenue: 0 }
]

const mockActivities = [
  { id: 1, user: 'João Silva', action: 'Criou novo usuário: Ana Oliveira', timestamp: '2024-01-20T14:30:00Z', type: 'user', severity: 'info' },
  { id: 2, user: 'Sistema', action: 'Sincronização automática concluída - 1.485 produtos', timestamp: '2024-01-20T14:00:00Z', type: 'sync', severity: 'success' },
  { id: 3, user: 'Maria Santos', action: 'Atualizou configurações de faturamento', timestamp: '2024-01-20T13:45:00Z', type: 'billing', severity: 'info' },
  { id: 4, user: 'Sistema', action: 'Backup realizado com sucesso (2.3GB)', timestamp: '2024-01-20T13:00:00Z', type: 'system', severity: 'success' },
  { id: 5, user: 'Pedro Costa', action: 'Login realizado via API', timestamp: '2024-01-20T12:30:00Z', type: 'auth', severity: 'info' },
  { id: 6, user: 'Sistema', action: 'Falha na sincronização WeDrop - Timeout', timestamp: '2024-01-20T12:00:00Z', type: 'sync', severity: 'error' },
  { id: 7, user: 'Carlos Ferreira', action: 'Exportou relatório de vendas', timestamp: '2024-01-20T11:45:00Z', type: 'report', severity: 'info' },
  { id: 8, user: 'Sistema', action: 'Alerta: Uso de CPU acima de 80%', timestamp: '2024-01-20T11:30:00Z', type: 'system', severity: 'warning' }
]

const mockAlerts = [
  { id: 1, type: 'error', title: 'Fornecedor com erro crítico', message: 'WeDrop apresenta falhas na sincronização há 24h. 45 produtos com erro.', timestamp: '2024-01-20T10:00:00Z', priority: 'high' },
  { id: 2, type: 'warning', title: 'Uso elevado de recursos', message: 'CPU do servidor principal em 85%. Considere otimização.', timestamp: '2024-01-20T09:30:00Z', priority: 'medium' },
  { id: 3, type: 'info', title: 'Manutenção programada', message: 'Sistema será atualizado hoje às 02:00. Downtime estimado: 15min.', timestamp: '2024-01-20T08:00:00Z', priority: 'low' },
  { id: 4, type: 'warning', title: 'Limite de API próximo', message: 'Bling API: 8.500/10.000 requisições utilizadas hoje.', timestamp: '2024-01-20T07:45:00Z', priority: 'medium' },
  { id: 5, type: 'success', title: 'Backup concluído', message: 'Backup automático realizado com sucesso (2.3GB)', timestamp: '2024-01-20T06:00:00Z', priority: 'low' }
]

// Dados para gráficos e métricas
const mockMetrics = {
  revenue: {
    current: 259000,
    previous: 234000,
    growth: 10.7,
    target: 280000,
    daily: [12000, 15000, 18000, 14000, 16000, 19000, 22000]
  },
  users: {
    total: 1247,
    active: 1156,
    new: 23,
    growth: 8.5,
    byType: { lojista: 1089, admin: 12, teste: 146 }
  },
  products: {
    total: 4550,
    synced: 4380,
    errors: 65,
    pending: 105,
    growth: 12.3
  },
  system: {
    uptime: 99.8,
    cpu: 65,
    memory: 78,
    disk: 45,
    apiCalls: 8500,
    apiLimit: 10000
  }
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>
      case 'inactive':
      case 'disconnected':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><Minus className="w-3 h-3 mr-1" />Inativo</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Erro</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUp className="w-4 h-4 text-green-600" />
    if (growth < 0) return <ArrowDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-600" />
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="w-4 h-4 text-blue-600" />
      case 'sync': return <RefreshCw className="w-4 h-4 text-green-600" />
      case 'billing': return <CreditCard className="w-4 h-4 text-purple-600" />
      case 'system': return <Server className="w-4 h-4 text-orange-600" />
      case 'auth': return <Shield className="w-4 h-4 text-indigo-600" />
      case 'report': return <FileText className="w-4 h-4 text-teal-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivitySeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      case 'success': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Painel Administrativo</h1>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Crown className="w-3 h-3 mr-1" />
                Super Admin
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Fornecedores</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Faturamento</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Alertas Críticos */}
            <div className="grid gap-4">
              {mockAlerts.filter(alert => alert.priority === 'high').map((alert) => (
                <Alert key={alert.id} className={`border-l-4 ${
                  alert.type === 'error' ? 'border-l-red-500 bg-red-50' :
                  alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                  'border-l-blue-500 bg-blue-50'
                }`}>
                  {getAlertIcon(alert.type)}
                  <AlertTitle className="flex items-center justify-between">
                    {alert.title}
                    <Badge variant={alert.type === 'error' ? 'destructive' : 'secondary'}>
                      {alert.priority === 'high' ? 'Crítico' : alert.priority === 'medium' ? 'Médio' : 'Baixo'}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription>
                    {alert.message}
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(alert.timestamp)}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>

            {/* Métricas Principais */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(mockMetrics.revenue.current)}</div>
                  <div className="flex items-center space-x-2 text-xs">
                    {getGrowthIcon(mockMetrics.revenue.growth)}
                    <span className={mockMetrics.revenue.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercentage(mockMetrics.revenue.growth)} vs mês anterior
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Meta: {formatCurrency(mockMetrics.revenue.target)}</span>
                      <span>{Math.round((mockMetrics.revenue.current / mockMetrics.revenue.target) * 100)}%</span>
                    </div>
                    <Progress value={(mockMetrics.revenue.current / mockMetrics.revenue.target) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockMetrics.users.active.toLocaleString()}</div>
                  <div className="flex items-center space-x-2 text-xs">
                    {getGrowthIcon(mockMetrics.users.growth)}
                    <span className={mockMetrics.users.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercentage(mockMetrics.users.growth)} este mês
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {mockMetrics.users.new} novos usuários hoje
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produtos Sincronizados</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockMetrics.products.synced.toLocaleString()}</div>
                  <div className="flex items-center space-x-2 text-xs">
                    {getGrowthIcon(mockMetrics.products.growth)}
                    <span className={mockMetrics.products.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercentage(mockMetrics.products.growth)} este mês
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {mockMetrics.products.errors} com erro, {mockMetrics.products.pending} pendentes
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Uptime do Sistema</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockMetrics.system.uptime}%</div>
                  <div className="flex items-center space-x-2 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Sistema operacional</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    CPU: {mockMetrics.system.cpu}% | RAM: {mockMetrics.system.memory}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos e Métricas Detalhadas */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Receita Diária */}
              <Card>
                <CardHeader>
                  <CardTitle>Receita dos Últimos 7 Dias</CardTitle>
                  <CardDescription>Evolução diária da receita</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockMetrics.revenue.daily.map((value, index) => {
                      const day = new Date()
                      day.setDate(day.getDate() - (6 - index))
                      const maxValue = Math.max(...mockMetrics.revenue.daily)
                      const percentage = (value / maxValue) * 100
                      
                      return (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-16 text-xs text-muted-foreground">
                            {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                          </div>
                          <div className="flex-1">
                            <Progress value={percentage} className="h-3" />
                          </div>
                          <div className="w-20 text-xs font-medium text-right">
                            {formatCurrency(value)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Status dos Recursos do Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle>Recursos do Sistema</CardTitle>
                  <CardDescription>Monitoramento em tempo real</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center"><Database className="w-4 h-4 mr-2" />CPU</span>
                        <span className={mockMetrics.system.cpu > 80 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                          {mockMetrics.system.cpu}%
                        </span>
                      </div>
                      <Progress value={mockMetrics.system.cpu} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center"><Server className="w-4 h-4 mr-2" />Memória</span>
                        <span className={mockMetrics.system.memory > 85 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                          {mockMetrics.system.memory}%
                        </span>
                      </div>
                      <Progress value={mockMetrics.system.memory} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center"><Package className="w-4 h-4 mr-2" />Disco</span>
                        <span className="text-muted-foreground">{mockMetrics.system.disk}%</span>
                      </div>
                      <Progress value={mockMetrics.system.disk} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center"><Globe className="w-4 h-4 mr-2" />API Bling</span>
                        <span className={mockMetrics.system.apiCalls > 9000 ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}>
                          {mockMetrics.system.apiCalls}/{mockMetrics.system.apiLimit}
                        </span>
                      </div>
                      <Progress value={(mockMetrics.system.apiCalls / mockMetrics.system.apiLimit) * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribuição de Usuários */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Usuários por Tipo</CardTitle>
                <CardDescription>Breakdown dos tipos de usuário na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{mockMetrics.users.byType.lojista}</div>
                    <div className="text-sm text-muted-foreground">Lojistas</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round((mockMetrics.users.byType.lojista / mockMetrics.users.total) * 100)}% do total
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{mockMetrics.users.byType.admin}</div>
                    <div className="text-sm text-muted-foreground">Administradores</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round((mockMetrics.users.byType.admin / mockMetrics.users.total) * 100)}% do total
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{mockMetrics.users.byType.teste}</div>
                    <div className="text-sm text-muted-foreground">Teste</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round((mockMetrics.users.byType.teste / mockMetrics.users.total) * 100)}% do total
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Atividade Recente e Alertas */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Atividade Recente */}
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                  <CardDescription>Últimas ações no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {mockActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${getActivitySeverityColor(activity.severity)}`}>
                            {activity.action}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500">
                              por {activity.user}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={activity.severity === 'error' ? 'destructive' : 
                                     activity.severity === 'warning' ? 'secondary' : 
                                     activity.severity === 'success' ? 'default' : 'outline'} 
                               className="text-xs">
                          {activity.severity === 'error' ? 'Erro' :
                           activity.severity === 'warning' ? 'Aviso' :
                           activity.severity === 'success' ? 'Sucesso' : 'Info'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Todos os Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Todos os Alertas */}
              <Card>
                <CardHeader>
                  <CardTitle>Central de Alertas</CardTitle>
                  <CardDescription>Notificações e avisos do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {mockAlerts.map((alert) => (
                      <Alert key={alert.id} className={`${
                        alert.type === 'error' ? 'border-red-200 bg-red-50' :
                        alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                        alert.type === 'success' ? 'border-green-200 bg-green-50' :
                        'border-blue-200 bg-blue-50'
                      }`}>
                        {getAlertIcon(alert.type)}
                        <AlertTitle className="flex items-center justify-between">
                          <span className="text-sm">{alert.title}</span>
                          <Badge variant={alert.priority === 'high' ? 'destructive' : 
                                        alert.priority === 'medium' ? 'secondary' : 'outline'} 
                                 className="text-xs">
                            {alert.priority === 'high' ? 'Alto' : 
                             alert.priority === 'medium' ? 'Médio' : 'Baixo'}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="text-xs">
                          {alert.message}
                          <div className="text-xs text-muted-foreground mt-2">
                            {formatDate(alert.timestamp)}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar Alertas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status dos Fornecedores */}
            <Card>
              <CardHeader>
                <CardTitle>Status dos Fornecedores</CardTitle>
                <CardDescription>Monitoramento das integrações ativas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {mockSuppliers.map((supplier) => (
                    <div key={supplier.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            supplier.status === 'connected' ? 'bg-green-500' :
                            supplier.status === 'error' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
                          }`}></div>
                          <h4 className="font-medium">{supplier.name}</h4>
                        </div>
                        {getStatusBadge(supplier.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Produtos</div>
                          <div className="font-medium">{supplier.syncedProducts}/{supplier.products}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Receita</div>
                          <div className="font-medium">{formatCurrency(supplier.revenue)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Última Sync</div>
                          <div className="font-medium">{formatDate(supplier.lastSync)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Erros</div>
                          <div className={`font-medium ${supplier.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {supplier.errorCount}
                          </div>
                        </div>
                      </div>
                      {supplier.status === 'connected' && supplier.products > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Sincronização</span>
                            <span>{Math.round((supplier.syncedProducts / supplier.products) * 100)}%</span>
                          </div>
                          <Progress value={(supplier.syncedProducts / supplier.products) * 100} className="h-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Redirect to specific pages */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>Sistema completo de gerenciamento de usuários</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Redirecionando para o módulo de usuários...</p>
                  <Button onClick={() => window.location.href = '/admin/users'} className="bg-blue-600 hover:bg-blue-700">
                    Acessar Gerenciamento de Usuários
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Fornecedores</CardTitle>
                <CardDescription>Sistema completo de gerenciamento de fornecedores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Redirecionando para o módulo de fornecedores...</p>
                  <Button onClick={() => window.location.href = '/admin/suppliers'} className="bg-blue-600 hover:bg-blue-700">
                    Acessar Gerenciamento de Fornecedores
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Controle de Faturamento</CardTitle>
                <CardDescription>Sistema completo de faturamento e assinaturas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Redirecionando para o módulo de faturamento...</p>
                  <Button onClick={() => window.location.href = '/admin/billing'} className="bg-blue-600 hover:bg-blue-700">
                    Acessar Controle de Faturamento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios e Rankings</CardTitle>
                <CardDescription>Relatórios avançados e analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Redirecionando para o módulo de relatórios...</p>
                  <Button onClick={() => window.location.href = '/admin/reports'} className="bg-blue-600 hover:bg-blue-700">
                    Acessar Relatórios e Rankings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
                <CardDescription>Logs, auditoria e controles de segurança</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Redirecionando para o módulo de segurança...</p>
                  <Button onClick={() => window.location.href = '/admin/security'} className="bg-blue-600 hover:bg-blue-700">
                    Acessar Configurações de Segurança
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return <AdminDashboard />
}
