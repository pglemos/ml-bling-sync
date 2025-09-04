'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Badge } from '@/components/shared/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/shared/dialog'
import { Label } from '@/components/shared/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/select'
import { Switch } from '@/components/shared/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/shared/alert'
import { Progress } from '@/components/shared/progress'
import { 
  Package, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  Square,
  Settings,
  Eye,
  Edit,
  Trash2,
  Search,
  Plus,
  Filter,
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Database,
  Zap,
  Globe,
  Link,
  CheckCheck,
  AlertCircle,
  Info,
  FileText,
  Image,
  Tag,
  DollarSign,
  Percent
} from 'lucide-react'

interface ImportJob {
  id: string
  supplier: string
  status: 'running' | 'completed' | 'failed' | 'scheduled' | 'paused'
  progress: number
  totalProducts: number
  importedProducts: number
  failedProducts: number
  startTime: string
  endTime?: string
  lastRun: string
  nextRun?: string
  schedule: string
  errors: string[]
}

interface Product {
  id: string
  sku: string
  name: string
  supplier: string
  category: string
  price: number
  stock: number
  status: 'active' | 'inactive' | 'out_of_stock'
  lastSync: string
  syncStatus: 'synced' | 'pending' | 'error'
  image?: string
  description: string
  weight?: number
  dimensions?: string
}

interface Supplier {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'error'
  apiKey: string
  lastSync: string
  totalProducts: number
  syncedProducts: number
  errorCount: number
  autoSync: boolean
  syncFrequency: string
}

const mockImportJobs: ImportJob[] = [
  {
    id: '1',
    supplier: 'Seu Armazém Drop',
    status: 'running',
    progress: 65,
    totalProducts: 1500,
    importedProducts: 975,
    failedProducts: 12,
    startTime: '2024-01-20T14:30:00Z',
    lastRun: '2024-01-20T14:30:00Z',
    nextRun: '2024-01-21T02:00:00Z',
    schedule: 'Diário às 02:00',
    errors: ['Produto SKU-123 sem preço', 'Imagem não encontrada para SKU-456']
  },
  {
    id: '2',
    supplier: 'Traz Pra Cá Club',
    status: 'completed',
    progress: 100,
    totalProducts: 850,
    importedProducts: 845,
    failedProducts: 5,
    startTime: '2024-01-20T02:00:00Z',
    endTime: '2024-01-20T02:45:00Z',
    lastRun: '2024-01-20T02:00:00Z',
    nextRun: '2024-01-21T02:00:00Z',
    schedule: 'Diário às 02:00',
    errors: ['Categoria não mapeada para 5 produtos']
  },
  {
    id: '3',
    supplier: 'WeDrop',
    status: 'failed',
    progress: 25,
    totalProducts: 2200,
    importedProducts: 550,
    failedProducts: 45,
    startTime: '2024-01-20T03:00:00Z',
    endTime: '2024-01-20T03:15:00Z',
    lastRun: '2024-01-20T03:00:00Z',
    nextRun: '2024-01-20T18:00:00Z',
    schedule: 'A cada 6 horas',
    errors: ['Erro de conexão com API', 'Token de acesso expirado', 'Limite de requisições excedido']
  },
  {
    id: '4',
    supplier: 'Fornecedor Teste',
    status: 'scheduled',
    progress: 0,
    totalProducts: 0,
    importedProducts: 0,
    failedProducts: 0,
    startTime: '',
    lastRun: '2024-01-19T02:00:00Z',
    nextRun: '2024-01-21T02:00:00Z',
    schedule: 'Diário às 02:00',
    errors: []
  }
]

const mockProducts: Product[] = [
  {
    id: '1',
    sku: 'SAD-001',
    name: 'Smartphone Galaxy A54',
    supplier: 'Seu Armazém Drop',
    category: 'Eletrônicos',
    price: 1299.90,
    stock: 45,
    status: 'active',
    lastSync: '2024-01-20T14:30:00Z',
    syncStatus: 'synced',
    description: 'Smartphone Samsung Galaxy A54 128GB',
    weight: 0.2,
    dimensions: '15x7x0.8cm'
  },
  {
    id: '2',
    sku: 'TPC-002',
    name: 'Tênis Nike Air Max',
    supplier: 'Traz Pra Cá Club',
    category: 'Calçados',
    price: 399.90,
    stock: 23,
    status: 'active',
    lastSync: '2024-01-20T02:45:00Z',
    syncStatus: 'synced',
    description: 'Tênis Nike Air Max 270 Masculino',
    weight: 0.8,
    dimensions: '35x25x15cm'
  },
  {
    id: '3',
    sku: 'WD-003',
    name: 'Fone Bluetooth JBL',
    supplier: 'WeDrop',
    category: 'Eletrônicos',
    price: 199.90,
    stock: 0,
    status: 'out_of_stock',
    lastSync: '2024-01-19T15:20:00Z',
    syncStatus: 'error',
    description: 'Fone de Ouvido JBL Tune 510BT',
    weight: 0.3,
    dimensions: '20x18x8cm'
  },
  {
    id: '4',
    sku: 'SAD-004',
    name: 'Notebook Lenovo IdeaPad',
    supplier: 'Seu Armazém Drop',
    category: 'Informática',
    price: 2499.90,
    stock: 12,
    status: 'active',
    lastSync: '2024-01-20T14:30:00Z',
    syncStatus: 'pending',
    description: 'Notebook Lenovo IdeaPad 3 Intel i5 8GB 256GB SSD',
    weight: 2.1,
    dimensions: '36x25x2cm'
  },
  {
    id: '5',
    sku: 'TPC-005',
    name: 'Camiseta Polo Lacoste',
    supplier: 'Traz Pra Cá Club',
    category: 'Roupas',
    price: 299.90,
    stock: 67,
    status: 'active',
    lastSync: '2024-01-20T02:45:00Z',
    syncStatus: 'synced',
    description: 'Camiseta Polo Lacoste Masculina Original',
    weight: 0.2,
    dimensions: '30x25x2cm'
  }
]

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Seu Armazém Drop',
    status: 'connected',
    apiKey: 'sad_***************',
    lastSync: '2024-01-20T14:30:00Z',
    totalProducts: 1500,
    syncedProducts: 1488,
    errorCount: 12,
    autoSync: true,
    syncFrequency: 'daily'
  },
  {
    id: '2',
    name: 'Traz Pra Cá Club',
    status: 'connected',
    apiKey: 'tpc_***************',
    lastSync: '2024-01-20T02:45:00Z',
    totalProducts: 850,
    syncedProducts: 845,
    errorCount: 5,
    autoSync: true,
    syncFrequency: 'daily'
  },
  {
    id: '3',
    name: 'WeDrop',
    status: 'error',
    apiKey: 'wd_***************',
    lastSync: '2024-01-20T03:15:00Z',
    totalProducts: 2200,
    syncedProducts: 550,
    errorCount: 45,
    autoSync: false,
    syncFrequency: 'every_6_hours'
  },
  {
    id: '4',
    name: 'Fornecedor Teste',
    status: 'disconnected',
    apiKey: '',
    lastSync: '2024-01-19T02:00:00Z',
    totalProducts: 0,
    syncedProducts: 0,
    errorCount: 0,
    autoSync: false,
    syncFrequency: 'daily'
  }
]

function ProductImportManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isCreateJobDialogOpen, setIsCreateJobDialogOpen] = useState(false)
  const [isConfigureSupplierDialogOpen, setIsConfigureSupplierDialogOpen] = useState(false)

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Play className="w-3 h-3 mr-1" />Executando</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>
      case 'scheduled':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Agendado</Badge>
      case 'paused':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><Pause className="w-3 h-3 mr-1" />Pausado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSupplierStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>
      case 'disconnected':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Erro</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getProductStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inativo</Badge>
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Sem Estoque</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCheck className="w-3 h-3 mr-1" />Sincronizado</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Erro</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const filteredJobs = mockImportJobs.filter(job => {
    const matchesSearch = job.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSupplier = selectedSupplier === 'all' || product.supplier === selectedSupplier
    return matchesSearch && matchesSupplier
  })

  // Cálculos para métricas
  const totalProducts = mockProducts.length
  const syncedProducts = mockProducts.filter(p => p.syncStatus === 'synced').length
  const pendingProducts = mockProducts.filter(p => p.syncStatus === 'pending').length
  const errorProducts = mockProducts.filter(p => p.syncStatus === 'error').length
  const runningJobs = mockImportJobs.filter(j => j.status === 'running').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Package className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Importação de Produtos</h1>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar Relatório
              </Button>
              <Dialog open={isCreateJobDialogOpen} onOpenChange={setIsCreateJobDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Importação
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Importação</DialogTitle>
                    <DialogDescription>
                      Configure uma nova importação de produtos
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="supplier">Fornecedor</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockSuppliers.filter(s => s.status === 'connected').map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="schedule">Agendamento</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Frequência de sincronização" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="hourly">A cada hora</SelectItem>
                          <SelectItem value="every_6_hours">A cada 6 horas</SelectItem>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="autoStart" defaultChecked />
                      <Label htmlFor="autoStart">Iniciar automaticamente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="updateExisting" />
                      <Label htmlFor="updateExisting">Atualizar produtos existentes</Label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateJobDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={() => setIsCreateJobDialogOpen(false)}>Criar Importação</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="jobs">Jobs de Importação</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Import Metrics */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProducts.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="inline w-3 h-3 mr-1" />
                    +{Math.floor(totalProducts * 0.15)} esta semana
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sincronizados</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{syncedProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((syncedProducts / totalProducts) * 100)}% do total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{pendingProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando sincronização
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Com Erro</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{errorProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    Requerem atenção
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Active Jobs Alert */}
            {runningJobs > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <Zap className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Importações em Andamento</AlertTitle>
                <AlertDescription className="text-blue-700">
                  {runningJobs} job{runningJobs > 1 ? 's' : ''} de importação em execução. 
                  Acompanhe o progresso na aba "Jobs de Importação".
                </AlertDescription>
              </Alert>
            )}

            {/* Running Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Jobs em Execução</CardTitle>
                <CardDescription>Importações ativas no momento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockImportJobs.filter(job => job.status === 'running').map((job) => (
                    <div key={job.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                          </div>
                          <div>
                            <h4 className="font-medium">{job.supplier}</h4>
                            <p className="text-sm text-muted-foreground">
                              {job.importedProducts} de {job.totalProducts} produtos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{job.progress}%</div>
                          <div className="text-xs text-muted-foreground">
                            {job.failedProducts} erros
                          </div>
                        </div>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                  ))}
                  {mockImportJobs.filter(job => job.status === 'running').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma importação em execução no momento</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Supplier Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status dos Fornecedores</CardTitle>
                <CardDescription>Conexões e sincronizações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {mockSuppliers.map((supplier) => (
                    <div key={supplier.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            supplier.status === 'connected' ? 'bg-green-500' :
                            supplier.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                          }`}></div>
                          <h4 className="font-medium">{supplier.name}</h4>
                        </div>
                        {getSupplierStatusBadge(supplier.status)}
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Produtos:</span>
                          <span>{supplier.syncedProducts}/{supplier.totalProducts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Última Sync:</span>
                          <span>{formatDate(supplier.lastSync)}</span>
                        </div>
                        {supplier.errorCount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Erros:</span>
                            <span>{supplier.errorCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            {/* Job Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Jobs de Importação</CardTitle>
                <CardDescription>Histórico e controle de importações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="running">Executando</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jobs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Jobs ({filteredJobs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Produtos</TableHead>
                      <TableHead>Erros</TableHead>
                      <TableHead>Última Execução</TableHead>
                      <TableHead>Próxima Execução</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.supplier}</TableCell>
                        <TableCell>{getJobStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Progress value={job.progress} className="h-2 flex-1" />
                              <span className="text-sm font-medium">{job.progress}%</span>
                            </div>
                            {job.status === 'running' && (
                              <div className="text-xs text-muted-foreground">
                                {job.importedProducts} de {job.totalProducts}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-green-600">{job.importedProducts} importados</div>
                            {job.failedProducts > 0 && (
                              <div className="text-red-600">{job.failedProducts} falharam</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.errors.length > 0 ? (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              {job.errors.length} erro{job.errors.length > 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(job.lastRun)}</TableCell>
                        <TableCell className="text-sm">{formatDate(job.nextRun || '')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {job.status === 'running' ? (
                              <Button variant="outline" size="sm" className="text-red-600">
                                <Square className="w-4 h-4" />
                              </Button>
                            ) : job.status === 'paused' ? (
                              <Button variant="outline" size="sm" className="text-green-600">
                                <Play className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm">
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {/* Product Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Produtos Importados</CardTitle>
                <CardDescription>Visualização e gerenciamento de produtos sincronizados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os fornecedores</SelectItem>
                      {mockSuppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.name}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Products Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Produtos ({filteredProducts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sincronização</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{product.supplier}</TableCell>
                        <TableCell className="text-sm">{product.category}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                          <span className={product.stock === 0 ? 'text-red-600 font-medium' : ''}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell>{getProductStatusBadge(product.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getSyncStatusBadge(product.syncStatus)}
                            <div className="text-xs text-muted-foreground">
                              {formatDate(product.lastSync)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
            {/* Suppliers Header */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Fornecedores</CardTitle>
                <CardDescription>Gerencie as conexões e configurações dos fornecedores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end">
                  <Dialog open={isConfigureSupplierDialogOpen} onOpenChange={setIsConfigureSupplierDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Configurar Fornecedor
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Configurar Fornecedor</DialogTitle>
                        <DialogDescription>
                          Configure a conexão com um novo fornecedor
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="supplierName">Nome do Fornecedor</Label>
                          <Input id="supplierName" placeholder="Ex: Novo Fornecedor" />
                        </div>
                        <div>
                          <Label htmlFor="apiKey">Chave da API</Label>
                          <Input id="apiKey" type="password" placeholder="Chave de acesso da API" />
                        </div>
                        <div>
                          <Label htmlFor="apiUrl">URL da API</Label>
                          <Input id="apiUrl" placeholder="https://api.fornecedor.com" />
                        </div>
                        <div>
                          <Label htmlFor="syncFreq">Frequência de Sincronização</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a frequência" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hourly">A cada hora</SelectItem>
                              <SelectItem value="every_6_hours">A cada 6 horas</SelectItem>
                              <SelectItem value="daily">Diário</SelectItem>
                              <SelectItem value="weekly">Semanal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="autoSync" defaultChecked />
                          <Label htmlFor="autoSync">Sincronização automática</Label>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsConfigureSupplierDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={() => setIsConfigureSupplierDialogOpen(false)}>Configurar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Suppliers Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {mockSuppliers.map((supplier) => (
                <Card key={supplier.id} className={`${supplier.status === 'error' ? 'border-red-200' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      {getSupplierStatusBadge(supplier.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">API Key:</span>
                        <span className="font-mono">{supplier.apiKey || 'Não configurado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total de Produtos:</span>
                        <span className="font-medium">{supplier.totalProducts.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sincronizados:</span>
                        <span className="font-medium text-green-600">{supplier.syncedProducts.toLocaleString()}</span>
                      </div>
                      {supplier.errorCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Erros:</span>
                          <span className="font-medium text-red-600">{supplier.errorCount}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Última Sync:</span>
                        <span>{formatDate(supplier.lastSync)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frequência:</span>
                        <span className="capitalize">
                          {supplier.syncFrequency === 'daily' ? 'Diário' :
                           supplier.syncFrequency === 'every_6_hours' ? 'A cada 6h' :
                           supplier.syncFrequency === 'hourly' ? 'Horário' : 'Manual'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Auto Sync:</span>
                        <span>{supplier.autoSync ? 'Ativo' : 'Inativo'}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="w-4 h-4 mr-1" />
                          Configurar
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Importação</CardTitle>
                <CardDescription>Configure as preferências globais de importação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Configurações Gerais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Importação automática</Label>
                          <p className="text-sm text-muted-foreground">Executar importações automaticamente</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Atualizar produtos existentes</Label>
                          <p className="text-sm text-muted-foreground">Sobrescrever dados de produtos já importados</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Importar imagens</Label>
                          <p className="text-sm text-muted-foreground">Baixar e armazenar imagens dos produtos</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Validar dados</Label>
                          <p className="text-sm text-muted-foreground">Verificar integridade antes da importação</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Limites e Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Produtos por lote</Label>
                          <p className="text-sm text-muted-foreground">Quantidade processada por vez</p>
                        </div>
                        <Input className="w-20" defaultValue="100" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Timeout (segundos)</Label>
                          <p className="text-sm text-muted-foreground">Tempo limite para requisições</p>
                        </div>
                        <Input className="w-20" defaultValue="30" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Tentativas máximas</Label>
                          <p className="text-sm text-muted-foreground">Número de tentativas em caso de erro</p>
                        </div>
                        <Input className="w-20" defaultValue="3" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Intervalo entre tentativas</Label>
                          <p className="text-sm text-muted-foreground">Segundos entre tentativas</p>
                        </div>
                        <Input className="w-20" defaultValue="5" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mapeamento de Categorias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-4">
                        <Input placeholder="Categoria do fornecedor" className="flex-1" />
                        <span>→</span>
                        <Input placeholder="Categoria local" className="flex-1" />
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Configure o mapeamento entre categorias dos fornecedores e suas categorias locais
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline">Cancelar</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">Salvar Configurações</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function ProductImportPage() {
  return <ProductImportManagement />
}
