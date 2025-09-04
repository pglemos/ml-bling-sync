'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card'
import { Button } from '@/components/shared/button'
import { Input } from '@/components/shared/input'
import { Label } from '@/components/shared/label'
import { Badge } from '@/components/shared/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/shared/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/select'
import { Switch } from '@/components/shared/switch'
import { Textarea } from '@/components/shared/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/shared/alert'
import { Progress } from '@/components/shared/progress'
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Eye,
  EyeOff,
  Shield,
  Crown,
  User,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Settings,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  MoreHorizontal,
  Copy,
  RefreshCw,
  FileText,
  Save,
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  CreditCard,
  Building2,
  Globe,
  Smartphone,
  Laptop,
  Tablet,
  UserCog
} from 'lucide-react'

// Mapeamento de permissões em português
const PERMISSION_LABELS = {
  view: 'Visualizar',
  create: 'Criar',
  edit: 'Editar',
  delete: 'Excluir',
  export: 'Exportar',
  import: 'Importar'
}

// Mapeamento de módulos em português
const MODULE_LABELS = {
  products: 'Produtos',
  orders: 'Pedidos',
  customers: 'Clientes',
  reports: 'Relatórios',
  billing: 'Faturamento',
  settings: 'Configurações',
  admin: 'Administração',
  suppliers: 'Fornecedores',
  integrations: 'Integrações',
  security: 'Segurança',
  analytics: 'Analytics',
  inventory: 'Estoque',
  marketing: 'Marketing',
  support: 'Suporte'
}

// Tipos de usuário e suas configurações
const USER_TYPES = {
  lojista: {
    label: 'Lojista',
    description: 'Usuário com assinatura para venda de produtos',
    icon: ShoppingCart,
    color: 'blue',
    permissions: {
      products: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      orders: { view: true, create: true, edit: true, delete: false, export: true, import: false },
      customers: { view: true, create: true, edit: true, delete: false, export: true, import: true },
      reports: { view: true, create: false, edit: false, delete: false, export: true, import: false },
      billing: { view: true, create: false, edit: false, delete: false, export: false, import: false },
      settings: { view: true, create: false, edit: true, delete: false, export: false, import: false },
      suppliers: { view: true, create: true, edit: true, delete: false, export: true, import: false },
      integrations: { view: true, create: false, edit: true, delete: false, export: false, import: false },
      inventory: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      analytics: { view: true, create: false, edit: false, delete: false, export: true, import: false },
      marketing: { view: true, create: true, edit: true, delete: false, export: false, import: false },
      support: { view: true, create: true, edit: true, delete: false, export: false, import: false },
      security: { view: false, create: false, edit: false, delete: false, export: false, import: false },
      admin: { view: false, create: false, edit: false, delete: false, export: false, import: false }
    }
  },
  admin: {
    label: 'Administrador',
    description: 'Usuário com acesso total ao sistema',
    icon: Crown,
    color: 'red',
    permissions: {
      products: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      orders: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      customers: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      reports: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      billing: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      settings: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      suppliers: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      integrations: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      inventory: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      analytics: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      marketing: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      support: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      security: { view: true, create: true, edit: true, delete: true, export: true, import: true },
      admin: { view: true, create: true, edit: true, delete: true, export: true, import: true }
    }
  },
  teste: {
    label: 'Teste',
    description: 'Usuário de teste com acesso limitado',
    icon: TestTube,
    color: 'orange',
    permissions: {
      products: { view: true, create: false, edit: false, delete: false, export: false, import: false },
      orders: { view: true, create: false, edit: false, delete: false, export: false, import: false },
      customers: { view: true, create: false, edit: false, delete: false, export: false, import: false },
      reports: { view: true, create: false, edit: false, delete: false, export: false, import: false },
      billing: { view: false, create: false, edit: false, delete: false, export: false, import: false },
      settings: { view: false, create: false, edit: false, delete: false, export: false, import: false },
      suppliers: { view: true, create: false, edit: false, delete: false, export: false, import: false },
      integrations: { view: false, create: false, edit: false, delete: false, export: false, import: false },
      inventory: { view: true, create: false, edit: false, delete: false, export: false, import: false },
      analytics: { view: true, create: false, edit: false, delete: false, export: false, import: false },
      marketing: { view: false, create: false, edit: false, delete: false, export: false, import: false },
      support: { view: false, create: false, edit: false, delete: false, export: false, import: false },
      security: { view: false, create: false, edit: false, delete: false, export: false, import: false },
      admin: { view: false, create: false, edit: false, delete: false, export: false, import: false }
    }
  },
  moderador: {
    label: 'Moderador',
    description: 'Usuário com permissões intermediárias para moderação',
    icon: Shield,
    color: 'green',
    permissions: {
      products: { view: true, create: true, edit: true, delete: false, export: true, import: false },
      orders: { view: true, create: true, edit: true, delete: false, export: true, import: false },
      customers: { view: true, create: true, edit: true, delete: false, export: true, import: false },
      reports: { view: true, create: true, edit: false, delete: false, export: true, import: false },
      billing: { view: true, create: false, edit: false, delete: false, export: false, import: false },
      settings: { view: true, create: false, edit: true, delete: false, export: false, import: false },
      suppliers: { view: true, create: true, edit: true, delete: false, export: true, import: false },
      integrations: { view: true, create: false, edit: true, delete: false, export: false, import: false },
      inventory: { view: true, create: true, edit: true, delete: false, export: true, import: false },
      analytics: { view: true, create: false, edit: false, delete: false, export: true, import: false },
      marketing: { view: true, create: true, edit: true, delete: false, export: false, import: false },
      support: { view: true, create: true, edit: true, delete: false, export: false, import: false },
      security: { view: true, create: false, edit: false, delete: false, export: false, import: false },
      admin: { view: false, create: false, edit: false, delete: false, export: false, import: false }
    }
  }
}

// Mock data com dados mais realistas
const mockUsers = [
  {
    id: 1,
    name: 'João Silva',
    email: 'joao@empresa.com',
    phone: '(11) 99999-9999',
    type: 'admin',
    status: 'active',
    lastLogin: '2024-01-20T10:30:00Z',
    loginCount: 245,
    createdAt: '2023-06-15T09:00:00Z',
    avatar: null,
    address: {
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    },
    subscription: {
      plan: 'Enterprise',
      status: 'active',
      expiresAt: '2024-12-31T23:59:59Z',
      monthlyRevenue: 15000
    },
    devices: [
      { type: 'desktop', lastAccess: '2024-01-20T10:30:00Z', ip: '192.168.1.100' },
      { type: 'mobile', lastAccess: '2024-01-19T18:45:00Z', ip: '192.168.1.101' }
    ],
    notes: 'Usuário administrador principal do sistema'
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria@loja.com',
    phone: '(11) 88888-8888',
    type: 'lojista',
    status: 'active',
    lastLogin: '2024-01-20T09:15:00Z',
    loginCount: 189,
    createdAt: '2023-08-22T14:30:00Z',
    avatar: null,
    address: {
      street: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100'
    },
    subscription: {
      plan: 'Premium',
      status: 'active',
      expiresAt: '2024-08-22T23:59:59Z',
      monthlyRevenue: 8500
    },
    devices: [
      { type: 'desktop', lastAccess: '2024-01-20T09:15:00Z', ip: '192.168.1.102' }
    ],
    notes: 'Lojista ativa com boa performance de vendas'
  },
  {
    id: 3,
    name: 'Pedro Costa',
    email: 'pedro@test.com',
    phone: '(11) 77777-7777',
    type: 'teste',
    status: 'inactive',
    lastLogin: '2024-01-19T16:45:00Z',
    loginCount: 12,
    createdAt: '2024-01-10T11:20:00Z',
    avatar: null,
    address: {
      street: 'Rua do Teste, 456',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zipCode: '20000-000'
    },
    subscription: {
      plan: 'Trial',
      status: 'expired',
      expiresAt: '2024-01-25T23:59:59Z',
      monthlyRevenue: 0
    },
    devices: [
      { type: 'mobile', lastAccess: '2024-01-19T16:45:00Z', ip: '192.168.1.103' }
    ],
    notes: 'Usuário de teste - período trial expirado'
  },
  {
    id: 4,
    name: 'Ana Oliveira',
    email: 'ana@shop.com',
    phone: '(11) 66666-6666',
    type: 'lojista',
    status: 'active',
    lastLogin: '2024-01-20T11:20:00Z',
    loginCount: 156,
    createdAt: '2023-09-05T16:45:00Z',
    avatar: null,
    address: {
      street: 'Rua do Comércio, 789',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30000-000'
    },
    subscription: {
      plan: 'Basic',
      status: 'active',
      expiresAt: '2024-09-05T23:59:59Z',
      monthlyRevenue: 3200
    },
    devices: [
      { type: 'tablet', lastAccess: '2024-01-20T11:20:00Z', ip: '192.168.1.104' },
      { type: 'mobile', lastAccess: '2024-01-20T08:30:00Z', ip: '192.168.1.105' }
    ],
    notes: 'Lojista em crescimento, potencial para upgrade'
  },
  {
    id: 5,
    name: 'Carlos Ferreira',
    email: 'carlos@admin.com',
    phone: '(11) 55555-5555',
    type: 'admin',
    status: 'active',
    lastLogin: '2024-01-20T08:30:00Z',
    loginCount: 298,
    createdAt: '2023-05-10T10:15:00Z',
    avatar: null,
    address: {
      street: 'Rua dos Administradores, 321',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    },
    subscription: {
      plan: 'Enterprise',
      status: 'active',
      expiresAt: '2024-12-31T23:59:59Z',
      monthlyRevenue: 0
    },
    devices: [
      { type: 'desktop', lastAccess: '2024-01-20T08:30:00Z', ip: '192.168.1.106' }
    ],
    notes: 'Administrador técnico responsável por integrações'
  }
]

// Componente para gerenciamento de roles individuais
function UserRoleManagement() {
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [customRoles, setCustomRoles] = useState({})
  const [isEditingRole, setIsEditingRole] = useState(false)

  const handleRoleChange = (userId, module, permission, value) => {
    setCustomRoles(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [module]: {
          ...prev[userId]?.[module],
          [permission]: value
        }
      }
    }))
  }

  const saveUserRole = (userId) => {
    // Aqui você salvaria as permissões customizadas no backend
    console.log('Salvando roles para usuário:', userId, customRoles[userId])
    setIsEditingRole(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedUserId || ''} onValueChange={setSelectedUserId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Selecione um usuário" />
          </SelectTrigger>
          <SelectContent>
            {mockUsers.map(user => (
              <SelectItem key={user.id} value={user.id.toString()}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {USER_TYPES[user.type]?.label}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedUserId && (
          <Button 
            variant={isEditingRole ? "default" : "outline"}
            onClick={() => setIsEditingRole(!isEditingRole)}
          >
            {isEditingRole ? (
              <><Save className="w-4 h-4 mr-2" />Salvar</>
            ) : (
              <><Edit className="w-4 h-4 mr-2" />Editar Roles</>
            )}
          </Button>
        )}
      </div>

      {selectedUserId && (
        <div className="border rounded-lg p-4">
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Permissões Customizadas</h3>
            <p className="text-sm text-muted-foreground">
              Configure permissões específicas para este usuário. As permissões customizadas sobrescrevem as permissões padrão do tipo de usuário.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(MODULE_LABELS).map(([module, moduleLabel]) => {
              const selectedUser = mockUsers.find(u => u.id.toString() === selectedUserId)
              const defaultPerms = selectedUser ? USER_TYPES[selectedUser.type]?.permissions[module] : {}
              const customPerms = customRoles[selectedUserId]?.[module] || {}
              
              return (
                <div key={module} className="border rounded p-3 space-y-2">
                  <h4 className="font-medium text-sm">{moduleLabel}</h4>
                  <div className="space-y-1">
                    {Object.entries(PERMISSION_LABELS).map(([permission, permissionLabel]) => {
                      const defaultValue = defaultPerms?.[permission] || false
                      const customValue = customPerms[permission]
                      const currentValue = customValue !== undefined ? customValue : defaultValue
                      const isCustomized = customValue !== undefined
                      
                      return (
                        <div key={permission} className="flex items-center justify-between text-xs">
                          <span className={isCustomized ? 'font-medium text-blue-600' : ''}>
                            {permissionLabel}
                          </span>
                          <div className="flex items-center gap-1">
                            {isCustomized && (
                              <div className="w-1 h-1 bg-blue-500 rounded-full" title="Customizado" />
                            )}
                            {isEditingRole ? (
                              <Switch
                                checked={currentValue}
                                onCheckedChange={(value) => handleRoleChange(selectedUserId, module, permission, value)}
                                size="sm"
                              />
                            ) : (
                              currentValue ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-600" />
                              )
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          
          {isEditingRole && (
            <div className="mt-4 flex gap-2">
              <Button onClick={() => saveUserRole(selectedUserId)}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setCustomRoles(prev => ({ ...prev, [selectedUserId]: {} }))
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resetar para Padrão
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function UserManagement() {
  const [users, setUsers] = useState(mockUsers)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('users')
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'lojista',
    password: '',
    confirmPassword: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    notes: ''
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Inativo</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><Lock className="w-3 h-3 mr-1" />Suspenso</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getUserTypeBadge = (type) => {
    const userType = USER_TYPES[type]
    if (!userType) return <Badge variant="outline">{type}</Badge>
    
    const Icon = userType.icon
    const colorClass = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200'
    }[userType.color]
    
    return (
      <Badge className={colorClass}>
        <Icon className="w-3 h-3 mr-1" />
        {userType.label}
      </Badge>
    )
  }

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'desktop': return <Laptop className="w-4 h-4" />
      case 'mobile': return <Smartphone className="w-4 h-4" />
      case 'tablet': return <Tablet className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || user.type === filterType
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const handleCreateUser = () => {
    if (newUser.password !== newUser.confirmPassword) {
      alert('Senhas não coincidem')
      return
    }
    
    const user = {
      id: Math.max(...users.map(u => u.id)) + 1,
      ...newUser,
      status: 'active',
      lastLogin: null,
      loginCount: 0,
      createdAt: new Date().toISOString(),
      avatar: null,
      subscription: {
        plan: newUser.type === 'admin' ? 'Enterprise' : newUser.type === 'lojista' ? 'Basic' : 'Trial',
        status: newUser.type === 'teste' ? 'trial' : 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        monthlyRevenue: 0
      },
      devices: []
    }
    
    setUsers([...users, user])
    setNewUser({
      name: '',
      email: '',
      phone: '',
      type: 'lojista',
      password: '',
      confirmPassword: '',
      address: { street: '', city: '', state: '', zipCode: '' },
      notes: ''
    })
    setIsCreateDialogOpen(false)
  }

  const handleEditUser = () => {
    setUsers(users.map(user => 
      user.id === selectedUser.id ? selectedUser : user
    ))
    setIsEditDialogOpen(false)
    setSelectedUser(null)
  }

  const handleDeleteUser = () => {
    setUsers(users.filter(user => user.id !== selectedUser.id))
    setIsDeleteDialogOpen(false)
    setSelectedUser(null)
  }

  const toggleUserStatus = (userId) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ))
  }

  const getUserStats = () => {
    const total = users.length
    const active = users.filter(u => u.status === 'active').length
    const byType = {
      lojista: users.filter(u => u.type === 'lojista').length,
      admin: users.filter(u => u.type === 'admin').length,
      teste: users.filter(u => u.type === 'teste').length
    }
    const totalRevenue = users
      .filter(u => u.type === 'lojista' && u.status === 'active')
      .reduce((sum, u) => sum + u.subscription.monthlyRevenue, 0)
    
    return { total, active, byType, totalRevenue }
  }

  const stats = getUserStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciamento de Usuários</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Preencha os dados para criar um novo usuário no sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          placeholder="Digite o nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          placeholder="usuario@email.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={newUser.phone}
                          onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo de Usuário</Label>
                        <Select value={newUser.type} onValueChange={(value) => setNewUser({...newUser, type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(USER_TYPES).map(([key, type]) => {
                              const Icon = type.icon
                              return (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center space-x-2">
                                    <Icon className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">{type.label}</div>
                                      <div className="text-xs text-muted-foreground">{type.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          placeholder="Digite a senha"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={newUser.confirmPassword}
                          onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                          placeholder="Confirme a senha"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Endereço</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          value={newUser.address.street}
                          onChange={(e) => setNewUser({...newUser, address: {...newUser.address, street: e.target.value}})}
                          placeholder="Rua, número"
                        />
                        <Input
                          value={newUser.address.city}
                          onChange={(e) => setNewUser({...newUser, address: {...newUser.address, city: e.target.value}})}
                          placeholder="Cidade"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          value={newUser.address.state}
                          onChange={(e) => setNewUser({...newUser, address: {...newUser.address, state: e.target.value}})}
                          placeholder="Estado"
                        />
                        <Input
                          value={newUser.address.zipCode}
                          onChange={(e) => setNewUser({...newUser, address: {...newUser.address, zipCode: e.target.value}})}
                          placeholder="CEP"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={newUser.notes}
                        onChange={(e) => setNewUser({...newUser, notes: e.target.value})}
                        placeholder="Observações sobre o usuário (opcional)"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateUser}>
                      Criar Usuário
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Permissões</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Estatísticas */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.active} ativos ({Math.round((stats.active / stats.total) * 100)}%)
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lojistas</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.byType.lojista}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((stats.byType.lojista / stats.total) * 100)}% do total
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    De {users.filter(u => u.type === 'lojista' && u.status === 'active').length} lojistas ativos
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.byType.admin}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.byType.teste} usuários de teste
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filtros e Busca */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros e Busca</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por nome ou e-mail..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="lojista">Lojistas</SelectItem>
                      <SelectItem value="admin">Administradores</SelectItem>
                      <SelectItem value="teste">Teste</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Usuários */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Usuários ({filteredUsers.length})</CardTitle>
                <CardDescription>
                  Gerencie todos os usuários do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Último Login</TableHead>
                        <TableHead>Receita</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                <div className="text-xs text-muted-foreground">{user.phone}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getUserTypeBadge(user.type)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(user.status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(user.lastLogin)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.loginCount} logins
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {user.type === 'lojista' ? formatCurrency(user.subscription.monthlyRevenue) : '-'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.subscription.plan}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleUserStatus(user.id)}
                              >
                                {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            {/* Gerenciamento de Roles Individuais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Gerenciamento de Roles de Usuário
                </CardTitle>
                <CardDescription>
                  Configure roles específicas para usuários individuais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserRoleManagement />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Matriz de Permissões por Tipo de Usuário</CardTitle>
                <CardDescription>
                  Visualize e configure as permissões para cada tipo de usuário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(USER_TYPES).map(([typeKey, userType]) => {
                    const Icon = userType.icon
                    return (
                      <div key={typeKey} className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <Icon className="w-6 h-6" />
                          <div>
                            <h3 className="font-semibold">{userType.label}</h3>
                            <p className="text-sm text-muted-foreground">{userType.description}</p>
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {Object.entries(userType.permissions).map(([module, perms]) => (
                            <div key={module} className="space-y-2">
                              <h4 className="font-medium">{MODULE_LABELS[module] || module}</h4>
                              <div className="space-y-1">
                                {Object.entries(perms).map(([action, allowed]) => (
                                  <div key={action} className="flex items-center justify-between text-sm">
                                    <span>{PERMISSION_LABELS[action] || action}</span>
                                    {allowed ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-red-600" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.byType).map(([type, count]) => {
                      const userType = USER_TYPES[type]
                      const Icon = userType.icon
                      const percentage = (count / stats.total) * 100
                      
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Icon className="w-4 h-4" />
                              <span className="font-medium">{userType.label}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Atividade dos Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Usuários Ativos</span>
                      <span className="font-medium">{stats.active}/{stats.total}</span>
                    </div>
                    <Progress value={(stats.active / stats.total) * 100} className="h-2" />
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Últimos Logins</h4>
                      <div className="space-y-2">
                        {users
                          .filter(u => u.lastLogin)
                          .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
                          .slice(0, 5)
                          .map(user => (
                            <div key={user.id} className="flex items-center justify-between text-sm">
                              <span>{user.name}</span>
                              <span className="text-muted-foreground">
                                {formatDate(user.lastLogin)}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Modifique os dados do usuário selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome Completo</Label>
                  <Input
                    id="edit-name"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">E-mail</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={selectedUser.phone}
                    onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Tipo de Usuário</Label>
                  <Select 
                    value={selectedUser.type} 
                    onValueChange={(value) => setSelectedUser({...selectedUser, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(USER_TYPES).map(([key, type]) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center space-x-2">
                              <Icon className="w-4 h-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    value={selectedUser.address.street}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser, 
                      address: {...selectedUser.address, street: e.target.value}
                    })}
                    placeholder="Rua, número"
                  />
                  <Input
                    value={selectedUser.address.city}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser, 
                      address: {...selectedUser.address, city: e.target.value}
                    })}
                    placeholder="Cidade"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    value={selectedUser.address.state}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser, 
                      address: {...selectedUser.address, state: e.target.value}
                    })}
                    placeholder="Estado"
                  />
                  <Input
                    value={selectedUser.address.zipCode}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser, 
                      address: {...selectedUser.address, zipCode: e.target.value}
                    })}
                    placeholder="CEP"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Observações</Label>
                <Textarea
                  id="edit-notes"
                  value={selectedUser.notes}
                  onChange={(e) => setSelectedUser({...selectedUser, notes: e.target.value})}
                  rows={3}
                />
              </div>
              
              {/* Informações de Dispositivos */}
              <div className="space-y-2">
                <Label>Dispositivos Conectados</Label>
                <div className="space-y-2">
                  {selectedUser.devices.map((device, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        {getDeviceIcon(device.type)}
                        <span className="capitalize">{device.type}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(device.lastAccess)} - {device.ip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário {selectedUser?.name}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Excluir Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function UsersPage() {
  return <UserManagement />
}
