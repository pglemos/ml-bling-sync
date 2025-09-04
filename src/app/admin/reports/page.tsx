'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Badge } from '@/components/shared/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/select'
import { DatePickerWithRange } from '@/components/shared/date-range-picker'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Trophy,
  Star,
  Crown,
  Medal,
  Award,
  RefreshCw
} from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { addDays } from 'date-fns'
import { useToast } from '@/components/shared/use-toast'
import { Skeleton } from '@/components/shared/skeleton'

interface Product {
  id: string
  name: string
  category: string
  supplier: string
  totalSales: number
  revenue: number
  salesCount: number
  averagePrice: number
  lastSale: string
}

interface Customer {
  id: string
  name: string
  email: string
  totalPurchases: number
  totalSpent: number
  registrationDate: string
  lastPurchase: string
  status: 'active' | 'inactive'
  city: string
  state: string
}

const mockTopProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max 256GB',
    category: 'Eletrônicos',
    supplier: 'Seu Armazém Drop',
    totalSales: 1250,
    revenue: 1875000,
    salesCount: 125,
    averagePrice: 15000,
    lastSale: '2024-01-20T14:30:00Z'
  },
  {
    id: '2',
    name: 'Tênis Nike Air Max 270',
    category: 'Moda e Acessórios',
    supplier: 'Traz Pra Cá Club',
    totalSales: 890,
    revenue: 623000,
    salesCount: 89,
    averagePrice: 700,
    lastSale: '2024-01-20T13:15:00Z'
  },
  {
    id: '3',
    name: 'Smart TV 55" 4K Samsung',
    category: 'Eletrônicos',
    supplier: 'WeDrop',
    totalSales: 650,
    revenue: 1625000,
    salesCount: 65,
    averagePrice: 2500,
    lastSale: '2024-01-20T12:45:00Z'
  },
  {
    id: '4',
    name: 'Cafeteira Expresso Nespresso',
    category: 'Casa e Jardim',
    supplier: 'WeDrop',
    totalSales: 420,
    revenue: 210000,
    salesCount: 84,
    averagePrice: 500,
    lastSale: '2024-01-20T11:20:00Z'
  },
  {
    id: '5',
    name: 'Notebook Dell Inspiron 15',
    category: 'Eletrônicos',
    supplier: 'Seu Armazém Drop',
    totalSales: 380,
    revenue: 1140000,
    salesCount: 38,
    averagePrice: 3000,
    lastSale: '2024-01-20T10:10:00Z'
  }
]

const mockTopCustomers: Customer[] = [
  {
    id: '1',
    name: 'João Silva Santos',
    email: 'joao.silva@email.com',
    totalPurchases: 45,
    totalSpent: 125000,
    registrationDate: '2023-03-15T10:00:00Z',
    lastPurchase: '2024-01-19T16:30:00Z',
    status: 'active',
    city: 'São Paulo',
    state: 'SP'
  },
  {
    id: '2',
    name: 'Maria Oliveira Costa',
    email: 'maria.oliveira@email.com',
    totalPurchases: 38,
    totalSpent: 98500,
    registrationDate: '2023-01-22T14:20:00Z',
    lastPurchase: '2024-01-18T11:15:00Z',
    status: 'active',
    city: 'Rio de Janeiro',
    state: 'RJ'
  },
  {
    id: '3',
    name: 'Carlos Eduardo Lima',
    email: 'carlos.lima@email.com',
    totalPurchases: 32,
    totalSpent: 87200,
    registrationDate: '2023-05-10T09:45:00Z',
    lastPurchase: '2024-01-17T14:20:00Z',
    status: 'active',
    city: 'Belo Horizonte',
    state: 'MG'
  },
  {
    id: '4',
    name: 'Ana Paula Ferreira',
    email: 'ana.ferreira@email.com',
    totalPurchases: 28,
    totalSpent: 76800,
    registrationDate: '2023-02-08T16:10:00Z',
    lastPurchase: '2024-01-16T09:30:00Z',
    status: 'active',
    city: 'Porto Alegre',
    state: 'RS'
  },
  {
    id: '5',
    name: 'Roberto Almeida Souza',
    email: 'roberto.souza@email.com',
    totalPurchases: 25,
    totalSpent: 65000,
    registrationDate: '2023-07-12T11:30:00Z',
    lastPurchase: '2024-01-15T13:45:00Z',
    status: 'active',
    city: 'Salvador',
    state: 'BA'
  }
]

const salesData = [
  { month: 'Jan', sales: 4000, customers: 240 },
  { month: 'Fev', sales: 3000, customers: 198 },
  { month: 'Mar', sales: 5000, customers: 320 },
  { month: 'Abr', sales: 4500, customers: 280 },
  { month: 'Mai', sales: 6000, customers: 390 },
  { month: 'Jun', sales: 5500, customers: 350 },
  { month: 'Jul', sales: 7000, customers: 450 },
  { month: 'Ago', sales: 6500, customers: 420 },
  { month: 'Set', sales: 8000, customers: 520 },
  { month: 'Out', sales: 7500, customers: 480 },
  { month: 'Nov', sales: 9000, customers: 580 },
  { month: 'Dez', sales: 8500, customers: 550 }
]

const categoryData = [
  { name: 'Eletrônicos', value: 35, color: '#3B82F6' },
  { name: 'Moda', value: 25, color: '#EF4444' },
  { name: 'Casa e Jardim', value: 20, color: '#10B981' },
  { name: 'Esportes', value: 12, color: '#F59E0B' },
  { name: 'Outros', value: 8, color: '#8B5CF6' }
]

function ReportsAndRankings({ 
  overviewData, 
  productsData, 
  customersData, 
  analyticsData, 
  loading, 
  error, 
  searchTerm, 
  setSearchTerm, 
  selectedPeriod, 
  setSelectedPeriod, 
  selectedCategory, 
  setSelectedCategory, 
  date, 
  setDate, 
  fetchReportsData, 
  handleExportReport 
}: any) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date()
  })
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [customerSortBy, setCustomerSortBy] = useState('totalSpent')
  const [customerSortOrder, setCustomerSortOrder] = useState('desc')
  
  // Usar dados reais ou fallback para mockados
  const currentSalesData = overviewData?.salesData || salesData
  const currentTopProducts = (overviewData?.topProducts && overviewData.topProducts.length > 0) ? overviewData.topProducts : (productsData.length > 0 ? productsData : mockTopProducts)
  const currentTopCustomers = customersData.length > 0 ? customersData : mockTopCustomers
  const currentCategoryData = overviewData?.categoryData || categoryData

  const getRankingIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <Trophy className="w-4 h-4 text-gray-400" />
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const sortedCustomers = [...currentTopCustomers].sort((a, b) => {
    const aValue = customerSortBy === 'totalSpent' ? a.totalSpent : 
                   customerSortBy === 'totalPurchases' ? a.totalPurchases :
                   new Date(a.registrationDate).getTime()
    const bValue = customerSortBy === 'totalSpent' ? b.totalSpent : 
                   customerSortBy === 'totalPurchases' ? b.totalPurchases :
                   new Date(b.registrationDate).getTime()
    
    return customerSortOrder === 'desc' ? bValue - aValue : aValue - bValue
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Relatórios e Rankings</h1>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtros Avançados
              </Button>
              <Button onClick={handleExportReport} className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6" onValueChange={(value) => {
              if (value === 'products') fetchReportsData('products')
              else if (value === 'customers') fetchReportsData('customers')
              else if (value === 'analytics') fetchReportsData('analytics')
              else fetchReportsData('overview')
            }}>
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="products">Ranking de Produtos</TabsTrigger>
            <TabsTrigger value="customers">Ranking de Clientes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Period Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Período de Análise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 items-center">
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                      <SelectItem value="90d">Últimos 90 dias</SelectItem>
                      <SelectItem value="1y">Último ano</SelectItem>
                      <SelectItem value="custom">Período personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedPeriod === 'custom' && (
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Overview Stats */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewData?.overview?.totalRevenue ? formatCurrency(overviewData.overview.totalRevenue) : 'R$ 2.847.350'}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {overviewData?.revenueChange && overviewData.revenueChange > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                    )}
                    {overviewData?.revenueChangeText || '+12.5% vs período anterior'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewData?.overview?.totalOrders || '3.590'}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {overviewData?.productsChange && overviewData.productsChange > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                    )}
                    {overviewData?.productsChangeText || '+8.2% vs período anterior'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewData?.topProducts?.length || '1.247'}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {overviewData?.customersChange && overviewData.customersChange > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                    )}
                    {overviewData?.customersChangeText || '+15.3% vs período anterior'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewData?.overview?.averageOrderValue ? formatCurrency(overviewData.overview.averageOrderValue) : 'R$ 793'}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {overviewData?.avgTicketChange && overviewData.avgTicketChange > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                    )}
                    {overviewData?.avgTicketChangeText || '-2.1% vs período anterior'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Vendas por Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={currentSalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`R$ ${value}`, 'Vendas']} />
                      <Bar dataKey="sales" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vendas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={currentCategoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {currentCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      <SelectItem value="electronics">Eletrônicos</SelectItem>
                      <SelectItem value="fashion">Moda e Acessórios</SelectItem>
                      <SelectItem value="home">Casa e Jardim</SelectItem>
                      <SelectItem value="sports">Esportes</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os fornecedores</SelectItem>
                      <SelectItem value="seu-armazem">Seu Armazém Drop</SelectItem>
                      <SelectItem value="traz-pra-ca">Traz Pra Cá Club</SelectItem>
                      <SelectItem value="wedrop">WeDrop</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="sales">
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Mais vendidos</SelectItem>
                      <SelectItem value="revenue">Maior receita</SelectItem>
                      <SelectItem value="quantity">Maior quantidade</SelectItem>
                      <SelectItem value="recent">Mais recentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Top Products Ranking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span>Ranking de Produtos Mais Vendidos</span>
                </CardTitle>
                <CardDescription>Top produtos por volume de vendas no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Posição</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Vendas</TableHead>
                      <TableHead>Receita</TableHead>
                      <TableHead>Preço Médio</TableHead>
                      <TableHead>Última Venda</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTopProducts.map((product, index) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getRankingIcon(index + 1)}
                            <span className="font-bold text-lg">#{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.salesCount || 0} vendas</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{product.supplier}</TableCell>
                        <TableCell className="font-medium">{(product.totalSales || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(product.revenue || 0)}
                        </TableCell>
                        <TableCell>{formatCurrency(product.averagePrice || 0)}</TableCell>
                        <TableCell className="text-sm">{product.lastSale ? formatDate(product.lastSale) : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            {/* Customer Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <Select value={customerSortBy} onValueChange={setCustomerSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="totalSpent">Volume de vendas</SelectItem>
                      <SelectItem value="totalPurchases">Número de compras</SelectItem>
                      <SelectItem value="registrationDate">Data de cadastro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={customerSortOrder} onValueChange={setCustomerSortOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Maior para menor</SelectItem>
                      <SelectItem value="asc">Menor para maior</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os estados</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Top Customers Ranking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <span>Ranking de Clientes</span>
                </CardTitle>
                <CardDescription>
                  {customerSortBy === 'totalSpent' && 'Clientes ordenados por volume de vendas'}
                  {customerSortBy === 'totalPurchases' && 'Clientes ordenados por número de compras'}
                  {customerSortBy === 'registrationDate' && 'Clientes ordenados por data de cadastro'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Posição</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Total Gasto</TableHead>
                      <TableHead>Compras</TableHead>
                      <TableHead>Ticket Médio</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Última Compra</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCustomers.map((customer, index) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getRankingIcon(index + 1)}
                            <span className="font-bold text-lg">#{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{customer.city}</div>
                            <div className="text-muted-foreground">{customer.state}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(customer.totalSpent)}
                        </TableCell>
                        <TableCell className="font-medium">{customer.totalPurchases}</TableCell>
                        <TableCell>
                          {formatCurrency(customer.totalSpent / customer.totalPurchases)}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(customer.registrationDate)}</TableCell>
                        <TableCell className="text-sm">{formatDate(customer.lastPurchase)}</TableCell>
                        <TableCell>
                          <Badge 
                            className={customer.status === 'active' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                            }
                          >
                            {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Avançado</CardTitle>
                <CardDescription>Análises detalhadas e insights de negócio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Crescimento de Clientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={currentSalesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="customers" stroke="#3B82F6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Insights de Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900">📈 Crescimento Acelerado</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Vendas cresceram 25% nos últimos 3 meses, superando a meta trimestral.
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900">🎯 Categoria em Destaque</h4>
                        <p className="text-sm text-green-700 mt-1">
                          Eletrônicos representam 35% das vendas e têm a maior margem de lucro.
                        </p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-yellow-900">⚠️ Oportunidade de Melhoria</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Ticket médio caiu 2.1%. Considere estratégias de upselling.
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900">🔮 Previsão</h4>
                        <p className="text-sm text-purple-700 mt-1">
                          Baseado no crescimento atual, expectativa de 40% de aumento no próximo trimestre.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Métricas Avançadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 border rounded-lg">
                         <div className="text-2xl font-bold text-blue-600">{analyticsData?.conversionMetrics?.repeatCustomerRate ? `${analyticsData.conversionMetrics.repeatCustomerRate.toFixed(1)}%` : '87.5%'}</div>
                         <div className="text-sm text-muted-foreground">Taxa de Clientes Recorrentes</div>
                         <div className="text-xs text-green-600 mt-1">+5.2% vs mês anterior</div>
                       </div>
                       <div className="p-4 border rounded-lg">
                         <div className="text-2xl font-bold text-green-600">{analyticsData?.averageLTV ? formatCurrency(analyticsData.averageLTV) : 'R$ 2.847'}</div>
                         <div className="text-sm text-muted-foreground">LTV Médio</div>
                         <div className="text-xs text-green-600 mt-1">+12.8% vs mês anterior</div>
                       </div>
                       <div className="p-4 border rounded-lg">
                         <div className="text-2xl font-bold text-purple-600">{analyticsData?.averageOrdersPerCustomer ? analyticsData.averageOrdersPerCustomer.toFixed(1) : '4.2'}</div>
                         <div className="text-sm text-muted-foreground">Pedidos por Cliente</div>
                         <div className="text-xs text-red-600 mt-1">-0.3% vs mês anterior</div>
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

export default function ReportsPage() {
  // Função auxiliar para formatação de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  // Função auxiliar para formatação de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const [overviewData, setOverviewData] = useState(null)
  const [productsData, setProductsData] = useState(null)
  const [customersData, setCustomersData] = useState(null)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [date, setDate] = useState(new Date())

  const fetchReportsData = async () => {
    // TODO: Implementar busca real de dados
  }

  const handleExportReport = () => {
    // TODO: Implementar exportação
  }

  useEffect(() => {
    fetchReportsData()
  }, [])

  return (
    <ReportsAndRankings
      overviewData={overviewData}
      productsData={productsData}
      customersData={customersData}
      analyticsData={analyticsData}
      loading={loading}
      error={error}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      selectedPeriod={selectedPeriod}
      setSelectedPeriod={setSelectedPeriod}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      date={date}
      setDate={setDate}
      fetchReportsData={fetchReportsData}
      handleExportReport={handleExportReport}
    />
  )
}
