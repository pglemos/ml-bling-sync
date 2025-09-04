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
import { Textarea } from '@/components/shared/textarea'
import { Switch } from '@/components/shared/switch'
import { Progress } from '@/components/shared/progress'
import { 
  Building2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Package,
  MapPin,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  Settings,
  Activity,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Save,
  X
} from 'lucide-react'

interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  website?: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  blingIntegration: {
    connected: boolean
    apiKey?: string
    lastSync?: string
    syncStatus: 'success' | 'error' | 'syncing' | 'never'
    errorMessage?: string
  }
  productsCount: number
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  category: string
  commission: number
  contactPerson: {
    name: string
    email: string
    phone: string
    position: string
  }
  businessInfo: {
    cnpj: string
    stateRegistration?: string
    municipalRegistration?: string
    businessType: string
  }
  bankInfo?: {
    bank: string
    agency: string
    account: string
    accountType: 'checking' | 'savings'
  }
  createdAt: string
  updatedAt: string
}

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Seu Armazém Drop',
    email: 'contato@seuarmazemdrop.com',
    phone: '(11) 99999-9999',
    website: 'https://seuarmazemdrop.com',
    status: 'active',
    blingIntegration: {
      connected: true,
      apiKey: 'bling_api_key_***',
      lastSync: '2024-01-20T10:30:00Z',
      syncStatus: 'success'
    },
    productsCount: 1250,
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Sala 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil'
    },
    category: 'Eletrônicos',
    commission: 15,
    contactPerson: {
      name: 'João Silva',
      email: 'joao@seuarmazemdrop.com',
      phone: '(11) 98888-8888',
      position: 'Gerente Comercial'
    },
    businessInfo: {
      cnpj: '12.345.678/0001-90',
      stateRegistration: '123456789',
      municipalRegistration: '987654321',
      businessType: 'LTDA'
    },
    bankInfo: {
      bank: 'Banco do Brasil',
      agency: '1234-5',
      account: '12345-6',
      accountType: 'checking'
    },
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    name: 'Traz Pra Cá Club',
    email: 'parceria@trazpracaclub.com',
    phone: '(21) 88888-8888',
    website: 'https://trazpracaclub.com',
    status: 'active',
    blingIntegration: {
      connected: true,
      apiKey: 'bling_api_key_***',
      lastSync: '2024-01-20T09:15:00Z',
      syncStatus: 'success'
    },
    productsCount: 890,
    address: {
      street: 'Av. Copacabana',
      number: '456',
      neighborhood: 'Copacabana',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '22070-001',
      country: 'Brasil'
    },
    category: 'Moda e Acessórios',
    commission: 12,
    contactPerson: {
      name: 'Maria Santos',
      email: 'maria@trazpracaclub.com',
      phone: '(21) 97777-7777',
      position: 'Diretora de Vendas'
    },
    businessInfo: {
      cnpj: '98.765.432/0001-10',
      stateRegistration: '987654321',
      businessType: 'LTDA'
    },
    createdAt: '2023-11-15T00:00:00Z',
    updatedAt: '2024-01-20T09:15:00Z'
  },
  {
    id: '3',
    name: 'WeDrop',
    email: 'suporte@wedrop.com.br',
    phone: '(31) 77777-7777',
    website: 'https://wedrop.com.br',
    status: 'active',
    blingIntegration: {
      connected: true,
      apiKey: 'bling_api_key_***',
      lastSync: '2024-01-20T11:45:00Z',
      syncStatus: 'syncing'
    },
    productsCount: 2100,
    address: {
      street: 'Rua Minas Gerais',
      number: '789',
      neighborhood: 'Centro',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30112-000',
      country: 'Brasil'
    },
    category: 'Casa e Jardim',
    commission: 18,
    contactPerson: {
      name: 'Carlos Oliveira',
      email: 'carlos@wedrop.com.br',
      phone: '(31) 96666-6666',
      position: 'CEO'
    },
    businessInfo: {
      cnpj: '11.222.333/0001-44',
      stateRegistration: '112233445',
      businessType: 'SA'
    },
    createdAt: '2023-10-20T00:00:00Z',
    updatedAt: '2024-01-20T11:45:00Z'
  },
  {
    id: '4',
    name: 'Novo Fornecedor',
    email: 'contato@novofornecedor.com',
    phone: '(47) 66666-6666',
    status: 'pending',
    blingIntegration: {
      connected: false,
      syncStatus: 'never'
    },
    productsCount: 0,
    address: {
      street: 'Rua Industrial',
      number: '321',
      neighborhood: 'Distrito Industrial',
      city: 'Joinville',
      state: 'SC',
      zipCode: '89201-000',
      country: 'Brasil'
    },
    category: 'Ferramentas',
    commission: 10,
    contactPerson: {
      name: 'Ana Costa',
      email: 'ana@novofornecedor.com',
      phone: '(47) 95555-5555',
      position: 'Gerente'
    },
    businessInfo: {
      cnpj: '55.666.777/0001-88',
      businessType: 'LTDA'
    },
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  }
]

function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Supplier>>({})

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || supplier.status === selectedStatus
    const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Inativo</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><AlertTriangle className="w-3 h-3 mr-1" />Pendente</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Suspenso</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSyncStatusBadge = (syncStatus: string) => {
    switch (syncStatus) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Sincronizado</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>
      case 'syncing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Sincronizando</Badge>
      case 'never':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><Clock className="w-3 h-3 mr-1" />Nunca</Badge>
      default:
        return <Badge variant="outline">{syncStatus}</Badge>
    }
  }

  const handleSync = async (supplierId: string) => {
    setIsSyncing(supplierId)
    setSuppliers(prev => prev.map(s => 
      s.id === supplierId 
        ? { ...s, blingIntegration: { ...s.blingIntegration, syncStatus: 'syncing' as const } }
        : s
    ))
    
    // Simular sincronização
    setTimeout(() => {
      setSuppliers(prev => prev.map(s => 
        s.id === supplierId 
          ? { 
              ...s, 
              blingIntegration: { 
                ...s.blingIntegration, 
                lastSync: new Date().toISOString(),
                syncStatus: 'success' as const
              },
              updatedAt: new Date().toISOString()
            }
          : s
      ))
      setIsSyncing(null)
    }, 3000)
  }

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setEditForm(supplier)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (selectedSupplier && editForm) {
      setSuppliers(prev => prev.map(s => 
        s.id === selectedSupplier.id 
          ? { ...s, ...editForm, updatedAt: new Date().toISOString() }
          : s
      ))
      setIsEditDialogOpen(false)
      setSelectedSupplier(null)
      setEditForm({})
    }
  }

  const handleDelete = (supplierId: string) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      setSuppliers(prev => prev.filter(s => s.id !== supplierId))
    }
  }

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Nunca'
    const date = new Date(lastSync)
    return date.toLocaleString('pt-BR')
  }

  const formatAddress = (address: Supplier['address']) => {
    return `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ''} - ${address.neighborhood}, ${address.city}/${address.state} - ${address.zipCode}`
  }

  const activeSuppliers = suppliers.filter(s => s.status === 'active').length
  const connectedSuppliers = suppliers.filter(s => s.blingIntegration.connected).length
  const totalProducts = suppliers.reduce((acc, s) => acc + s.productsCount, 0)
  const avgCommission = suppliers.reduce((acc, s) => acc + s.commission, 0) / suppliers.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Building2 className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciamento de Fornecedores</h1>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => suppliers.filter(s => s.blingIntegration.connected).forEach(s => handleSync(s.id))}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar Todos
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Fornecedor
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Fornecedor</DialogTitle>
                    <DialogDescription>
                      Adicione um novo fornecedor ao sistema com todas as informações necessárias
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    {/* Informações Básicas */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Informações Básicas</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nome da Empresa *</Label>
                          <Input id="name" placeholder="Nome do fornecedor" />
                        </div>
                        <div>
                          <Label htmlFor="category">Categoria *</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="electronics">Eletrônicos</SelectItem>
                              <SelectItem value="fashion">Moda e Acessórios</SelectItem>
                              <SelectItem value="home">Casa e Jardim</SelectItem>
                              <SelectItem value="tools">Ferramentas</SelectItem>
                              <SelectItem value="sports">Esportes</SelectItem>
                              <SelectItem value="books">Livros</SelectItem>
                              <SelectItem value="health">Saúde e Beleza</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input id="email" type="email" placeholder="contato@fornecedor.com" />
                        </div>
                        <div>
                          <Label htmlFor="phone">Telefone *</Label>
                          <Input id="phone" placeholder="(11) 99999-9999" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <Input id="website" placeholder="https://fornecedor.com" />
                        </div>
                        <div>
                          <Label htmlFor="commission">Comissão (%) *</Label>
                          <Input id="commission" type="number" placeholder="15" min="0" max="100" />
                        </div>
                      </div>
                    </div>

                    {/* Pessoa de Contato */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Pessoa de Contato</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contact-name">Nome *</Label>
                          <Input id="contact-name" placeholder="Nome do responsável" />
                        </div>
                        <div>
                          <Label htmlFor="contact-position">Cargo</Label>
                          <Input id="contact-position" placeholder="Gerente Comercial" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contact-email">Email</Label>
                          <Input id="contact-email" type="email" placeholder="responsavel@fornecedor.com" />
                        </div>
                        <div>
                          <Label htmlFor="contact-phone">Telefone</Label>
                          <Input id="contact-phone" placeholder="(11) 98888-8888" />
                        </div>
                      </div>
                    </div>

                    {/* Endereço */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Endereço</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="street">Rua *</Label>
                          <Input id="street" placeholder="Rua das Flores" />
                        </div>
                        <div>
                          <Label htmlFor="number">Número *</Label>
                          <Input id="number" placeholder="123" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="complement">Complemento</Label>
                          <Input id="complement" placeholder="Sala 45" />
                        </div>
                        <div>
                          <Label htmlFor="neighborhood">Bairro *</Label>
                          <Input id="neighborhood" placeholder="Centro" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">Cidade *</Label>
                          <Input id="city" placeholder="São Paulo" />
                        </div>
                        <div>
                          <Label htmlFor="state">Estado *</Label>
                          <Input id="state" placeholder="SP" maxLength={2} />
                        </div>
                        <div>
                          <Label htmlFor="zipcode">CEP *</Label>
                          <Input id="zipcode" placeholder="01234-567" />
                        </div>
                      </div>
                    </div>

                    {/* Informações Empresariais */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Informações Empresariais</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cnpj">CNPJ *</Label>
                          <Input id="cnpj" placeholder="12.345.678/0001-90" />
                        </div>
                        <div>
                          <Label htmlFor="business-type">Tipo de Empresa</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LTDA">LTDA</SelectItem>
                              <SelectItem value="SA">S.A.</SelectItem>
                              <SelectItem value="MEI">MEI</SelectItem>
                              <SelectItem value="EIRELI">EIRELI</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="state-registration">Inscrição Estadual</Label>
                          <Input id="state-registration" placeholder="123456789" />
                        </div>
                        <div>
                          <Label htmlFor="municipal-registration">Inscrição Municipal</Label>
                          <Input id="municipal-registration" placeholder="987654321" />
                        </div>
                      </div>
                    </div>

                    {/* Integração Bling */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Integração Bling</h3>
                      <div className="flex items-center space-x-2">
                        <Switch id="bling-integration" />
                        <Label htmlFor="bling-integration">Habilitar integração com Bling</Label>
                      </div>
                      <div>
                        <Label htmlFor="bling-api-key">Chave da API Bling</Label>
                        <Input id="bling-api-key" type="password" placeholder="Insira a chave da API" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={() => setIsCreateDialogOpen(false)}>Cadastrar Fornecedor</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="suppliers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
            <TabsTrigger value="integration">Integração Bling</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{suppliers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeSuppliers} ativos
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produtos Totais</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalProducts.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sincronizados via Bling
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Integração Bling</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {connectedSuppliers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fornecedores conectados
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comissão Média</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {avgCommission.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Taxa média de comissão
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar fornecedores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      <SelectItem value="Eletrônicos">Eletrônicos</SelectItem>
                      <SelectItem value="Moda e Acessórios">Moda e Acessórios</SelectItem>
                      <SelectItem value="Casa e Jardim">Casa e Jardim</SelectItem>
                      <SelectItem value="Ferramentas">Ferramentas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('')
                    setSelectedStatus('all')
                    setSelectedCategory('all')
                  }}>
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Suppliers Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Fornecedores ({filteredSuppliers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Produtos</TableHead>
                      <TableHead>Bling</TableHead>
                      <TableHead>Última Sync</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {supplier.email}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {supplier.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{supplier.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {supplier.productsCount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getSyncStatusBadge(supplier.blingIntegration.syncStatus)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatLastSync(supplier.blingIntegration.lastSync)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {supplier.commission}%
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {supplier.blingIntegration.connected && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSync(supplier.id)}
                                disabled={isSyncing === supplier.id}
                              >
                                {isSyncing === supplier.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => handleEdit(supplier)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(supplier.id)}
                            >
                              <Trash2 className="w-4 h-4" />
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

          <TabsContent value="integration">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração da Integração Bling</CardTitle>
                  <CardDescription>Configure as integrações com o sistema Bling para sincronização automática</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Status da Integração</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>API Bling</span>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Conectado
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Sincronização Automática</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Intervalo de Sincronização</span>
                          <Select defaultValue="1h">
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15m">15 minutos</SelectItem>
                              <SelectItem value="30m">30 minutos</SelectItem>
                              <SelectItem value="1h">1 hora</SelectItem>
                              <SelectItem value="6h">6 horas</SelectItem>
                              <SelectItem value="24h">24 horas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>


                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Log de Sincronização</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Sincronização concluída - WeDrop</p>
                            <p className="text-xs text-muted-foreground">2.100 produtos sincronizados - 20/01/2024 11:45</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Sincronização concluída - Seu Armazém Drop</p>
                            <p className="text-xs text-muted-foreground">1.250 produtos sincronizados - 20/01/2024 10:30</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Sincronização em andamento - Traz Pra Cá Club</p>
                            <p className="text-xs text-muted-foreground">450/890 produtos processados - 20/01/2024 12:00</p>
                            <Progress value={50} className="mt-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance dos Fornecedores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {suppliers.filter(s => s.status === 'active').map((supplier) => (
                        <div key={supplier.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground">{supplier.productsCount} produtos</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{supplier.commission}%</p>
                            <p className="text-sm text-muted-foreground">comissão</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from(new Set(suppliers.map(s => s.category))).map((category) => {
                        const categorySuppliers = suppliers.filter(s => s.category === category)
                        const percentage = (categorySuppliers.length / suppliers.length) * 100
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{category}</span>
                              <span className="text-sm text-muted-foreground">{categorySuppliers.length} fornecedores</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Sincronização</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {suppliers.filter(s => s.blingIntegration.syncStatus === 'success').length}
                      </div>
                      <p className="text-sm text-muted-foreground">Sincronizados</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {suppliers.filter(s => s.blingIntegration.syncStatus === 'syncing').length}
                      </div>
                      <p className="text-sm text-muted-foreground">Sincronizando</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {suppliers.filter(s => s.blingIntegration.syncStatus === 'error').length}
                      </div>
                      <p className="text-sm text-muted-foreground">Com Erro</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {suppliers.filter(s => s.blingIntegration.syncStatus === 'never').length}
                      </div>
                      <p className="text-sm text-muted-foreground">Nunca Sincronizados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
            <DialogDescription>
              Edite as informações do fornecedor {selectedSupplier?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="grid gap-6 py-4">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Básicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Nome da Empresa</Label>
                    <Input 
                      id="edit-name" 
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-category">Categoria</Label>
                    <Select value={editForm.category} onValueChange={(value) => setEditForm({...editForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Eletrônicos">Eletrônicos</SelectItem>
                        <SelectItem value="Moda e Acessórios">Moda e Acessórios</SelectItem>
                        <SelectItem value="Casa e Jardim">Casa e Jardim</SelectItem>
                        <SelectItem value="Ferramentas">Ferramentas</SelectItem>
                        <SelectItem value="Esportes">Esportes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input 
                      id="edit-email" 
                      type="email" 
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Telefone</Label>
                    <Input 
                      id="edit-phone" 
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-website">Website</Label>
                    <Input 
                      id="edit-website" 
                      value={editForm.website || ''}
                      onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-commission">Comissão (%)</Label>
                    <Input 
                      id="edit-commission" 
                      type="number" 
                      value={editForm.commission || 0}
                      onChange={(e) => setEditForm({...editForm, commission: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Endereço Completo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Endereço</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {formatAddress(selectedSupplier.address)}
                  </p>
                </div>
              </div>

              {/* Pessoa de Contato */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pessoa de Contato</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <p className="text-sm p-2 bg-gray-50 rounded">{selectedSupplier.contactPerson.name}</p>
                  </div>
                  <div>
                    <Label>Cargo</Label>
                    <p className="text-sm p-2 bg-gray-50 rounded">{selectedSupplier.contactPerson.position}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm p-2 bg-gray-50 rounded">{selectedSupplier.contactPerson.email}</p>
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <p className="text-sm p-2 bg-gray-50 rounded">{selectedSupplier.contactPerson.phone}</p>
                  </div>
                </div>
              </div>

              {/* Informações Empresariais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Empresariais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CNPJ</Label>
                    <p className="text-sm p-2 bg-gray-50 rounded">{selectedSupplier.businessInfo.cnpj}</p>
                  </div>
                  <div>
                    <Label>Tipo de Empresa</Label>
                    <p className="text-sm p-2 bg-gray-50 rounded">{selectedSupplier.businessInfo.businessType}</p>
                  </div>
                </div>
              </div>

              {/* Integração Bling */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Integração Bling</h3>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={editForm.blingIntegration?.connected || false}
                    onCheckedChange={(checked) => setEditForm({
                      ...editForm, 
                      blingIntegration: {
                        ...editForm.blingIntegration!,
                        connected: checked
                      }
                    })}
                  />
                  <Label>Integração ativa</Label>
                </div>
                {selectedSupplier.blingIntegration.connected && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status da Sincronização:</span>
                      {getSyncStatusBadge(selectedSupplier.blingIntegration.syncStatus)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Última Sincronização:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatLastSync(selectedSupplier.blingIntegration.lastSync)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SuppliersPage() {
  return <SupplierManagement />
}
