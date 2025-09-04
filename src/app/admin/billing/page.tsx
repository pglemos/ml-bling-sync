'use client'

import React, { useState, useEffect } from 'react'
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
import { useToast } from '@/components/use-toast'
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Users, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Download,
  Upload,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  FileText,
  Send,
  Eye,
  Ban,
  CheckCheck,
  AlertCircle,
  Calculator,
  Receipt,
  Banknote,
  Filter,
  MoreHorizontal
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  plan: 'basic' | 'premium' | 'enterprise'
  status: 'active' | 'suspended' | 'cancelled' | 'trial'
  monthlyFee: number
  nextBilling: string
  lastPayment: string
  paymentMethod: string
  totalRevenue: number
  joinDate: string
  daysOverdue: number
}

interface Invoice {
  id: string
  customerId: string
  customerName: string
  amount: number
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'
  dueDate: string
  paidDate?: string
  description: string
  plan: string
  paymentMethod: string
  createdAt: string
}

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  maxProducts: number
  maxOrders: number
  support: string
  popular?: boolean
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@loja1.com',
    phone: '(11) 99999-1111',
    company: 'Loja do João',
    plan: 'premium',
    status: 'active',
    monthlyFee: 199.90,
    nextBilling: '2024-02-15',
    lastPayment: '2024-01-15',
    paymentMethod: 'Cartão de Crédito',
    totalRevenue: 2398.80,
    joinDate: '2023-01-15',
    daysOverdue: 0
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@boutique.com',
    phone: '(11) 88888-2222',
    company: 'Boutique Maria',
    plan: 'basic',
    status: 'active',
    monthlyFee: 99.90,
    nextBilling: '2024-02-20',
    lastPayment: '2024-01-20',
    paymentMethod: 'PIX',
    totalRevenue: 1198.80,
    joinDate: '2023-02-20',
    daysOverdue: 0
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    email: 'carlos@tech.com',
    phone: '(11) 77777-3333',
    company: 'Tech Store',
    plan: 'enterprise',
    status: 'active',
    monthlyFee: 399.90,
    nextBilling: '2024-02-10',
    lastPayment: '2024-01-10',
    paymentMethod: 'Boleto',
    totalRevenue: 4798.80,
    joinDate: '2022-12-10',
    daysOverdue: 0
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana@moda.com',
    phone: '(11) 66666-4444',
    company: 'Moda & Estilo',
    plan: 'premium',
    status: 'suspended',
    monthlyFee: 199.90,
    nextBilling: '2024-01-25',
    lastPayment: '2023-12-25',
    paymentMethod: 'Cartão de Crédito',
    totalRevenue: 1999.00,
    joinDate: '2023-03-25',
    daysOverdue: 25
  },
  {
    id: '5',
    name: 'Pedro Almeida',
    email: 'pedro@esportes.com',
    phone: '(11) 55555-5555',
    company: 'Esportes Total',
    plan: 'basic',
    status: 'trial',
    monthlyFee: 99.90,
    nextBilling: '2024-02-05',
    lastPayment: '',
    paymentMethod: '',
    totalRevenue: 0,
    joinDate: '2024-01-20',
    daysOverdue: 0
  }
]

const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    customerId: '1',
    customerName: 'João Silva',
    amount: 199.90,
    status: 'paid',
    dueDate: '2024-01-15',
    paidDate: '2024-01-15',
    description: 'Plano Premium - Janeiro 2024',
    plan: 'Premium',
    paymentMethod: 'Cartão de Crédito',
    createdAt: '2024-01-01'
  },
  {
    id: 'INV-002',
    customerId: '2',
    customerName: 'Maria Santos',
    amount: 99.90,
    status: 'paid',
    dueDate: '2024-01-20',
    paidDate: '2024-01-20',
    description: 'Plano Básico - Janeiro 2024',
    plan: 'Básico',
    paymentMethod: 'PIX',
    createdAt: '2024-01-05'
  },
  {
    id: 'INV-003',
    customerId: '3',
    customerName: 'Carlos Oliveira',
    amount: 399.90,
    status: 'paid',
    dueDate: '2024-01-10',
    paidDate: '2024-01-10',
    description: 'Plano Enterprise - Janeiro 2024',
    plan: 'Enterprise',
    paymentMethod: 'Boleto',
    createdAt: '2023-12-25'
  },
  {
    id: 'INV-004',
    customerId: '4',
    customerName: 'Ana Costa',
    amount: 199.90,
    status: 'overdue',
    dueDate: '2024-01-25',
    description: 'Plano Premium - Janeiro 2024',
    plan: 'Premium',
    paymentMethod: 'Cartão de Crédito',
    createdAt: '2024-01-10'
  },
  {
    id: 'INV-005',
    customerId: '1',
    customerName: 'João Silva',
    amount: 199.90,
    status: 'pending',
    dueDate: '2024-02-15',
    description: 'Plano Premium - Fevereiro 2024',
    plan: 'Premium',
    paymentMethod: 'Cartão de Crédito',
    createdAt: '2024-02-01'
  }
]

const mockPlans: Plan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 99.90,
    features: [
      'Até 1.000 produtos',
      'Até 500 pedidos/mês',
      'Suporte por email',
      '1 integração',
      'Relatórios básicos'
    ],
    maxProducts: 1000,
    maxOrders: 500,
    support: 'Email'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199.90,
    features: [
      'Até 10.000 produtos',
      'Até 2.000 pedidos/mês',
      'Suporte prioritário',
      '5 integrações',
      'Relatórios avançados',
      'API completa'
    ],
    maxProducts: 10000,
    maxOrders: 2000,
    support: 'Chat + Email',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 399.90,
    features: [
      'Produtos ilimitados',
      'Pedidos ilimitados',
      'Suporte 24/7',
      'Integrações ilimitadas',
      'Relatórios personalizados',
      'API completa',
      'Gerente dedicado'
    ],
    maxProducts: -1,
    maxOrders: -1,
    support: '24/7 Dedicado'
  }
]

function BillingManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPlan, setSelectedPlan] = useState('all')
  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] = useState(false)
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false)
  
  // Estados para dados reais
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    monthlyRecurring: 0,
    overdueAmount: 0,
    activeCustomers: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { toast } = useToast()

  // Função para buscar dados da API
  const fetchBillingData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/billing')
      if (!response.ok) {
        throw new Error('Erro ao carregar dados de faturamento')
      }
      
      const data = await response.json()
      
      setCustomers(data.customers || [])
      setInvoices(data.invoices || [])
      setPlans(data.plans || [])
      setMetrics(data.metrics || {
        totalRevenue: 0,
        monthlyRecurring: 0,
        overdueAmount: 0,
        activeCustomers: 0
      })
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de faturamento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchBillingData()
  }, [])

  // Função para criar nova fatura
  const handleCreateInvoice = async (invoiceData: any) => {
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_invoice',
          data: invoiceData
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao criar fatura')
      }

      toast({
        title: "Sucesso",
        description: "Fatura criada com sucesso"
      })

      // Recarregar dados
      fetchBillingData()
      setIsCreateInvoiceDialogOpen(false)
    } catch (err) {
      console.error('Erro ao criar fatura:', err)
      toast({
        title: "Erro",
        description: "Não foi possível criar a fatura",
        variant: "destructive"
      })
    }
  }

  // Função para atualizar plano
  const handleUpdatePlan = async (planData: any) => {
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_plan',
          data: planData
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar plano')
      }

      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso"
      })

      // Recarregar dados
      fetchBillingData()
      setIsEditPlanDialogOpen(false)
    } catch (err) {
      console.error('Erro ao atualizar plano:', err)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o plano",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><Ban className="w-3 h-3 mr-1" />Suspenso</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="w-3 h-3 mr-1" />Trial</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCheck className="w-3 h-3 mr-1" />Pago</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Vencido</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'basic':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Básico</Badge>
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Premium</Badge>
      case 'enterprise':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Enterprise</Badge>
      default:
        return <Badge variant="outline">{plan}</Badge>
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
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus
    const matchesPlan = selectedPlan === 'all' || customer.plan === selectedPlan
    return matchesSearch && matchesStatus && matchesPlan
  })

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // Cálculos para métricas usando dados reais ou fallback para mock
  const totalRevenue = loading ? 0 : (customers.length > 0 ? customers.reduce((sum, customer) => sum + customer.totalRevenue, 0) : mockCustomers.reduce((sum, customer) => sum + customer.totalRevenue, 0))
  const monthlyRecurring = loading ? 0 : (customers.length > 0 ? customers.filter(c => c.status === 'active').reduce((sum, customer) => sum + customer.monthlyFee, 0) : mockCustomers.filter(c => c.status === 'active').reduce((sum, customer) => sum + customer.monthlyFee, 0))
  const overdueAmount = loading ? 0 : (invoices.length > 0 ? invoices.filter(i => i.status === 'overdue').reduce((sum, invoice) => sum + invoice.amount, 0) : mockInvoices.filter(i => i.status === 'overdue').reduce((sum, invoice) => sum + invoice.amount, 0))
  const activeCustomers = loading ? 0 : (customers.length > 0 ? customers.filter(c => c.status === 'active').length : mockCustomers.filter(c => c.status === 'active').length)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <CreditCard className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Faturamento e Mensalidades</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando dados de faturamento...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <CreditCard className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Faturamento e Mensalidades</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4"
                onClick={fetchBillingData}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <CreditCard className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Faturamento e Mensalidades</h1>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar Relatório
              </Button>
              <Dialog open={isCreateInvoiceDialogOpen} onOpenChange={setIsCreateInvoiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Fatura
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Fatura</DialogTitle>
                    <DialogDescription>
                      Gere uma nova fatura para um cliente
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="customer">Cliente</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount">Valor</Label>
                      <Input id="amount" type="number" placeholder="0,00" />
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Data de Vencimento</Label>
                      <Input id="dueDate" type="date" />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Input id="description" placeholder="Descrição da fatura" />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateInvoiceDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={() => setIsCreateInvoiceDialogOpen(false)}>Criar Fatura</Button>
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
            <TabsTrigger value="customers">Clientes</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Revenue Metrics */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.monthlyRecurring)}</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="inline w-3 h-3 mr-1" />
                      +12% em relação ao mês anterior
                    </p>
                  </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">MRR (Receita Recorrente)</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(monthlyRecurring)}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="inline w-3 h-3 mr-1" />
                    +8% vs mês anterior
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valores em Atraso</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.overdueAmount || overdueAmount)}</div>
                  <p className="text-xs text-muted-foreground">
                    {(invoices.length > 0 ? invoices : mockInvoices).filter(i => i.status === 'overdue').length} faturas vencidas
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.activeCustomers || activeCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    de {(customers.length > 0 ? customers : mockCustomers).length} total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {overdueAmount > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Atenção: Faturas Vencidas</AlertTitle>
                <AlertDescription className="text-red-700">
                  Existem {mockInvoices.filter(i => i.status === 'overdue').length} faturas vencidas totalizando {formatCurrency(overdueAmount)}. 
                  Considere entrar em contato com os clientes ou suspender os serviços.
                </AlertDescription>
              </Alert>
            )}

            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Faturas Recentes</CardTitle>
                <CardDescription>Últimas transações e pagamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockInvoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Receipt className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{invoice.id}</p>
                            {getInvoiceStatusBadge(invoice.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invoice.customerName} • {formatDate(invoice.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                        <p className="text-sm text-muted-foreground">{invoice.plan}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Status Distribution */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { status: 'active', label: 'Ativos', count: mockCustomers.filter(c => c.status === 'active').length, color: 'bg-green-500' },
                      { status: 'trial', label: 'Trial', count: mockCustomers.filter(c => c.status === 'trial').length, color: 'bg-blue-500' },
                      { status: 'suspended', label: 'Suspensos', count: mockCustomers.filter(c => c.status === 'suspended').length, color: 'bg-red-500' },
                      { status: 'cancelled', label: 'Cancelados', count: mockCustomers.filter(c => c.status === 'cancelled').length, color: 'bg-gray-500' }
                    ].map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span>{item.label}</span>
                        </div>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Plano</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { plan: 'basic', label: 'Básico', count: mockCustomers.filter(c => c.plan === 'basic').length, color: 'bg-blue-500' },
                      { plan: 'premium', label: 'Premium', count: mockCustomers.filter(c => c.plan === 'premium').length, color: 'bg-purple-500' },
                      { plan: 'enterprise', label: 'Enterprise', count: mockCustomers.filter(c => c.plan === 'enterprise').length, color: 'bg-orange-500' }
                    ].map((item) => (
                      <div key={item.plan} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span>{item.label}</span>
                        </div>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            {/* Customer Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Clientes</CardTitle>
                <CardDescription>Controle de mensalidades e status dos clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar clientes..."
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
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os planos</SelectItem>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Customers Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Clientes ({filteredCustomers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mensalidade</TableHead>
                      <TableHead>Próximo Vencimento</TableHead>
                      <TableHead>Último Pagamento</TableHead>
                      <TableHead>Receita Total</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.company}</div>
                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getPlanBadge(customer.plan)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(customer.status)}
                            {customer.daysOverdue > 0 && (
                              <div className="text-xs text-red-600">
                                {customer.daysOverdue} dias em atraso
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(customer.monthlyFee)}</TableCell>
                        <TableCell className="text-sm">{formatDate(customer.nextBilling)}</TableCell>
                        <TableCell className="text-sm">{formatDate(customer.lastPayment)}</TableCell>
                        <TableCell className="font-medium text-green-600">{formatCurrency(customer.totalRevenue)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Mail className="w-4 h-4" />
                            </Button>
                            {customer.status === 'suspended' ? (
                              <Button variant="outline" size="sm" className="text-green-600">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" className="text-red-600">
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            {/* Invoice Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Faturas</CardTitle>
                <CardDescription>Controle de faturas e pagamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar faturas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button variant="outline">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Lembretes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Invoices Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Faturas ({filteredInvoices.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fatura</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.id}</div>
                            <div className="text-sm text-muted-foreground">{invoice.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{invoice.customerName}</div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-sm">{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell className="text-sm">{invoice.paidDate ? formatDate(invoice.paidDate) : '-'}</TableCell>
                        <TableCell className="text-sm">{invoice.paymentMethod}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Send className="w-4 h-4" />
                            </Button>
                            {invoice.status === 'pending' && (
                              <Button variant="outline" size="sm" className="text-green-600">
                                <CheckCheck className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            {/* Plans Header */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Planos</CardTitle>
                <CardDescription>Configure os planos de assinatura disponíveis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end">
                  <Dialog open={isEditPlanDialogOpen} onOpenChange={setIsEditPlanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Plano
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Criar Novo Plano</DialogTitle>
                        <DialogDescription>
                          Configure um novo plano de assinatura
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="planName">Nome do Plano</Label>
                          <Input id="planName" placeholder="Ex: Premium Plus" />
                        </div>
                        <div>
                          <Label htmlFor="planPrice">Preço Mensal</Label>
                          <Input id="planPrice" type="number" placeholder="299.90" />
                        </div>
                        <div>
                          <Label htmlFor="maxProducts">Máximo de Produtos</Label>
                          <Input id="maxProducts" type="number" placeholder="5000" />
                        </div>
                        <div>
                          <Label htmlFor="maxOrders">Máximo de Pedidos/Mês</Label>
                          <Input id="maxOrders" type="number" placeholder="1000" />
                        </div>
                        <div>
                          <Label htmlFor="support">Tipo de Suporte</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o suporte" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="chat">Chat + Email</SelectItem>
                              <SelectItem value="24x7">24/7 Dedicado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="popular" />
                          <Label htmlFor="popular">Marcar como popular</Label>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsEditPlanDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={() => setIsEditPlanDialogOpen(false)}>Criar Plano</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Plans Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {mockPlans.map((plan) => (
                <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white">Mais Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      {formatCurrency(plan.price)}
                      <span className="text-sm font-normal text-muted-foreground">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t">
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Produtos: {plan.maxProducts === -1 ? 'Ilimitados' : plan.maxProducts.toLocaleString()}</div>
                        <div>Pedidos: {plan.maxOrders === -1 ? 'Ilimitados' : plan.maxOrders.toLocaleString()}/mês</div>
                        <div>Suporte: {plan.support}</div>
                      </div>
                    </div>
                    <div className="pt-4">
                      <div className="text-sm font-medium mb-2">
                        Clientes: {mockCustomers.filter(c => c.plan === plan.id).length}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
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

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics de Faturamento</CardTitle>
                <CardDescription>Análise detalhada de receitas e tendências</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Receita por Plano</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockPlans.map((plan) => {
                          const customers = mockCustomers.filter(c => c.plan === plan.id && c.status === 'active')
                          const revenue = customers.length * plan.price
                          return (
                            <div key={plan.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  plan.id === 'basic' ? 'bg-blue-500' :
                                  plan.id === 'premium' ? 'bg-purple-500' : 'bg-orange-500'
                                }`}></div>
                                <span>{plan.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{formatCurrency(revenue)}</div>
                                <div className="text-sm text-muted-foreground">{customers.length} clientes</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Métricas de Churn</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Taxa de Churn Mensal</span>
                          <span className="font-medium text-red-600">2.5%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Clientes Cancelados (30d)</span>
                          <span className="font-medium">3</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Receita Perdida (30d)</span>
                          <span className="font-medium text-red-600">{formatCurrency(599.70)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>LTV Médio</span>
                          <span className="font-medium text-green-600">{formatCurrency(2400)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Previsão de Receita</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(monthlyRecurring)}</div>
                        <div className="text-sm text-muted-foreground">Este Mês</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(monthlyRecurring * 1.08)}</div>
                        <div className="text-sm text-muted-foreground">Próximo Mês (+8%)</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{formatCurrency(monthlyRecurring * 12 * 1.15)}</div>
                        <div className="text-sm text-muted-foreground">Projeção Anual (+15%)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return <BillingManagement />
}
