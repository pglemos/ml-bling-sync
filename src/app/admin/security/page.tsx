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
import { 
  Shield, 
  Lock, 
  Key, 
  Users, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  UserCheck,
  UserX,
  Settings,
  Activity,
  Ban,
  Unlock,
  RefreshCw,
  Download,
  Upload,
  Search,
  Plus
} from 'lucide-react'

interface SecurityLog {
  id: string
  timestamp: string
  event: string
  user: string
  ip: string
  device: string
  location: string
  status: 'success' | 'failed' | 'blocked'
  details: string
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  status: 'active' | 'inactive' | 'suspended'
  lastLogin: string
  loginAttempts: number
  twoFactorEnabled: boolean
  permissions: string[]
  createdAt: string
}

interface AccessRule {
  id: string
  name: string
  description: string
  type: 'ip_whitelist' | 'ip_blacklist' | 'time_restriction' | 'device_limit'
  value: string
  enabled: boolean
  createdAt: string
}

const mockSecurityLogs: SecurityLog[] = [
  {
    id: '1',
    timestamp: '2024-01-20T14:30:00Z',
    event: 'Admin Login',
    user: 'admin@empresa.com',
    ip: '192.168.1.100',
    device: 'Chrome/Windows',
    location: 'São Paulo, SP',
    status: 'success',
    details: 'Login bem-sucedido com 2FA'
  },
  {
    id: '2',
    timestamp: '2024-01-20T13:45:00Z',
    event: 'Failed Login Attempt',
    user: 'usuario@teste.com',
    ip: '203.45.67.89',
    device: 'Firefox/Linux',
    location: 'Desconhecido',
    status: 'failed',
    details: 'Tentativa de acesso negada - usuário não autorizado'
  },
  {
    id: '3',
    timestamp: '2024-01-20T12:15:00Z',
    event: 'Permission Change',
    user: 'super.admin@empresa.com',
    ip: '192.168.1.101',
    device: 'Chrome/macOS',
    location: 'São Paulo, SP',
    status: 'success',
    details: 'Permissões de usuário modificadas'
  },
  {
    id: '4',
    timestamp: '2024-01-20T11:30:00Z',
    event: 'Blocked Access',
    user: 'cliente@loja.com',
    ip: '177.123.45.67',
    device: 'Safari/iOS',
    location: 'Rio de Janeiro, RJ',
    status: 'blocked',
    details: 'Acesso bloqueado - tentativa de acesso à área administrativa'
  },
  {
    id: '5',
    timestamp: '2024-01-20T10:45:00Z',
    event: 'Data Export',
    user: 'admin@empresa.com',
    ip: '192.168.1.100',
    device: 'Chrome/Windows',
    location: 'São Paulo, SP',
    status: 'success',
    details: 'Exportação de relatório de usuários'
  }
]

const mockAdminUsers: AdminUser[] = [
  {
    id: '1',
    name: 'Super Administrador',
    email: 'super.admin@empresa.com',
    role: 'super_admin',
    status: 'active',
    lastLogin: '2024-01-20T14:30:00Z',
    loginAttempts: 0,
    twoFactorEnabled: true,
    permissions: ['all'],
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Administrador Principal',
    email: 'admin@empresa.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-20T13:15:00Z',
    loginAttempts: 0,
    twoFactorEnabled: true,
    permissions: ['users', 'reports', 'suppliers', 'products'],
    createdAt: '2023-02-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'Moderador de Conteúdo',
    email: 'moderator@empresa.com',
    role: 'moderator',
    status: 'active',
    lastLogin: '2024-01-20T09:30:00Z',
    loginAttempts: 1,
    twoFactorEnabled: false,
    permissions: ['products', 'suppliers'],
    createdAt: '2023-06-10T00:00:00Z'
  },
  {
    id: '4',
    name: 'Admin Suspenso',
    email: 'suspended@empresa.com',
    role: 'admin',
    status: 'suspended',
    lastLogin: '2024-01-15T16:20:00Z',
    loginAttempts: 5,
    twoFactorEnabled: false,
    permissions: ['users', 'reports'],
    createdAt: '2023-08-20T00:00:00Z'
  }
]

const mockAccessRules: AccessRule[] = [
  {
    id: '1',
    name: 'IP Whitelist Escritório',
    description: 'Permitir acesso apenas do IP do escritório principal',
    type: 'ip_whitelist',
    value: '192.168.1.0/24',
    enabled: true,
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Bloqueio de IPs Suspeitos',
    description: 'Bloquear IPs com tentativas de acesso maliciosas',
    type: 'ip_blacklist',
    value: '203.45.67.89, 177.123.45.67',
    enabled: true,
    createdAt: '2023-03-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'Horário Comercial',
    description: 'Restringir acesso apenas ao horário comercial',
    type: 'time_restriction',
    value: '08:00-18:00',
    enabled: false,
    createdAt: '2023-05-20T00:00:00Z'
  },
  {
    id: '4',
    name: 'Limite de Dispositivos',
    description: 'Máximo de 3 dispositivos simultâneos por usuário',
    type: 'device_limit',
    value: '3',
    enabled: true,
    createdAt: '2023-07-10T00:00:00Z'
  }
]

function SecurityManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLogType, setSelectedLogType] = useState('all')
  const [selectedUserStatus, setSelectedUserStatus] = useState('all')
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
  const [isCreateRuleDialogOpen, setIsCreateRuleDialogOpen] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Sucesso</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>
      case 'blocked':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><Ban className="w-3 h-3 mr-1" />Bloqueado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Super Admin</Badge>
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Administrador</Badge>
      case 'moderator':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Moderador</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getUserStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><UserCheck className="w-3 h-3 mr-1" />Ativo</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><UserX className="w-3 h-3 mr-1" />Inativo</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><Ban className="w-3 h-3 mr-1" />Suspenso</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const filteredLogs = mockSecurityLogs.filter(log => {
    const matchesSearch = log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedLogType === 'all' || log.status === selectedLogType
    return matchesSearch && matchesType
  })

  const filteredUsers = mockAdminUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedUserStatus === 'all' || user.status === selectedUserStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-red-600" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Segurança e Controle de Acesso</h1>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar Logs
              </Button>
              <Button className="bg-red-600 hover:bg-red-700">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Alerta de Segurança
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alert */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Sistema de Segurança Ativo</AlertTitle>
          <AlertDescription className="text-red-700">
            O acesso ao painel administrativo está restrito apenas a usuários autorizados. 
            Todas as atividades são monitoradas e registradas.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários Admin</TabsTrigger>
            <TabsTrigger value="logs">Logs de Segurança</TabsTrigger>
            <TabsTrigger value="access">Regras de Acesso</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Security Stats */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Admin</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAdminUsers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {mockAdminUsers.filter(u => u.status === 'active').length} ativos
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tentativas Bloqueadas</CardTitle>
                  <Ban className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">23</div>
                  <p className="text-xs text-muted-foreground">
                    Últimas 24 horas
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">2FA Habilitado</CardTitle>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {mockAdminUsers.filter(u => u.twoFactorEnabled).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    de {mockAdminUsers.length} usuários
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Regras Ativas</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mockAccessRules.filter(r => r.enabled).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Regras de segurança
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Security Events */}
            <Card>
              <CardHeader>
                <CardTitle>Eventos de Segurança Recentes</CardTitle>
                <CardDescription>Últimas atividades de segurança no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSecurityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {log.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {log.status === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                        {log.status === 'blocked' && <Ban className="w-5 h-5 text-orange-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">{log.event}</p>
                          {getStatusBadge(log.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {log.user} • {log.ip} • {formatDate(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recomendações de Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Atenção: Usuário sem 2FA</h4>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    1 usuário administrador não possui autenticação de dois fatores habilitada.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-green-800">Segurança Forte</h4>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Todas as regras de acesso estão ativas e funcionando corretamente.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-blue-800">Monitoramento Ativo</h4>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Sistema de monitoramento registrou 156 eventos nas últimas 24 horas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* User Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários Administrativos</CardTitle>
                <CardDescription>Controle total sobre usuários com acesso administrativo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar usuários..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={selectedUserStatus} onValueChange={setSelectedUserStatus}>
                      <SelectTrigger className="w-48">
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
                  <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Usuário Admin
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Novo Usuário Administrativo</DialogTitle>
                        <DialogDescription>
                          Adicione um novo usuário com permissões administrativas
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="name">Nome Completo</Label>
                          <Input id="name" placeholder="Nome do usuário" />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="email@empresa.com" />
                        </div>
                        <div>
                          <Label htmlFor="role">Função</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a função" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="moderator">Moderador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="twoFactor" />
                          <Label htmlFor="twoFactor">Exigir autenticação de dois fatores</Label>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={() => setIsCreateUserDialogOpen(false)}>Criar Usuário</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Admin Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Usuários Administrativos ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>2FA</TableHead>
                      <TableHead>Último Login</TableHead>
                      <TableHead>Tentativas</TableHead>
                      <TableHead>Permissões</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getUserStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          {user.twoFactorEnabled ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <Lock className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <Unlock className="w-3 h-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(user.lastLogin)}</TableCell>
                        <TableCell>
                          <span className={user.loginAttempts > 3 ? 'text-red-600 font-medium' : ''}>
                            {user.loginAttempts}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.slice(0, 2).map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                            {user.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.permissions.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                            {user.status === 'suspended' ? (
                              <Button variant="outline" size="sm" className="text-green-600">
                                <UserCheck className="w-4 h-4" />
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

          <TabsContent value="logs" className="space-y-6">
            {/* Log Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Logs de Segurança</CardTitle>
                <CardDescription>Histórico completo de eventos de segurança</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedLogType} onValueChange={setSelectedLogType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Tipo de evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os eventos</SelectItem>
                      <SelectItem value="success">Sucessos</SelectItem>
                      <SelectItem value="failed">Falhas</SelectItem>
                      <SelectItem value="blocked">Bloqueados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Registro de Eventos ({filteredLogs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">{formatDate(log.timestamp)}</TableCell>
                        <TableCell className="font-medium">{log.event}</TableCell>
                        <TableCell className="text-sm">{log.user}</TableCell>
                        <TableCell className="text-sm font-mono">{log.ip}</TableCell>
                        <TableCell className="text-sm">{log.device}</TableCell>
                        <TableCell className="text-sm">{log.location}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate">{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            {/* Access Rules Header */}
            <Card>
              <CardHeader>
                <CardTitle>Regras de Controle de Acesso</CardTitle>
                <CardDescription>Configure regras para restringir e controlar o acesso ao sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end">
                  <Dialog open={isCreateRuleDialogOpen} onOpenChange={setIsCreateRuleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Regra
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Nova Regra de Acesso</DialogTitle>
                        <DialogDescription>
                          Configure uma nova regra de segurança
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="ruleName">Nome da Regra</Label>
                          <Input id="ruleName" placeholder="Nome descritivo da regra" />
                        </div>
                        <div>
                          <Label htmlFor="ruleType">Tipo de Regra</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ip_whitelist">Lista Branca de IPs</SelectItem>
                              <SelectItem value="ip_blacklist">Lista Negra de IPs</SelectItem>
                              <SelectItem value="time_restriction">Restrição de Horário</SelectItem>
                              <SelectItem value="device_limit">Limite de Dispositivos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="ruleValue">Valor da Regra</Label>
                          <Input id="ruleValue" placeholder="Ex: 192.168.1.0/24" />
                        </div>
                        <div>
                          <Label htmlFor="ruleDescription">Descrição</Label>
                          <Input id="ruleDescription" placeholder="Descrição da regra" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="ruleEnabled" defaultChecked />
                          <Label htmlFor="ruleEnabled">Ativar regra imediatamente</Label>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsCreateRuleDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={() => setIsCreateRuleDialogOpen(false)}>Criar Regra</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Access Rules Table */}
            <Card>
              <CardHeader>
                <CardTitle>Regras Configuradas ({mockAccessRules.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAccessRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-sm text-muted-foreground">{rule.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {rule.type === 'ip_whitelist' && 'IP Whitelist'}
                            {rule.type === 'ip_blacklist' && 'IP Blacklist'}
                            {rule.type === 'time_restriction' && 'Horário'}
                            {rule.type === 'device_limit' && 'Dispositivos'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{rule.value}</TableCell>
                        <TableCell>
                          {rule.enabled ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ativa
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inativa
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(rule.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600">
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

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
                <CardDescription>Configure as políticas de segurança do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Políticas de Senha</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Comprimento mínimo</Label>
                          <p className="text-sm text-muted-foreground">Mínimo de 8 caracteres</p>
                        </div>
                        <Input className="w-20" defaultValue="8" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Exigir caracteres especiais</Label>
                          <p className="text-sm text-muted-foreground">Incluir símbolos na senha</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Exigir números</Label>
                          <p className="text-sm text-muted-foreground">Incluir dígitos na senha</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Expiração de senha</Label>
                          <p className="text-sm text-muted-foreground">Forçar troca periódica</p>
                        </div>
                        <Select defaultValue="90">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 dias</SelectItem>
                            <SelectItem value="60">60 dias</SelectItem>
                            <SelectItem value="90">90 dias</SelectItem>
                            <SelectItem value="never">Nunca</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Controle de Sessão</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Timeout de sessão</Label>
                          <p className="text-sm text-muted-foreground">Tempo limite de inatividade</p>
                        </div>
                        <Select defaultValue="30">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 min</SelectItem>
                            <SelectItem value="30">30 min</SelectItem>
                            <SelectItem value="60">1 hora</SelectItem>
                            <SelectItem value="120">2 horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Sessões simultâneas</Label>
                          <p className="text-sm text-muted-foreground">Máximo por usuário</p>
                        </div>
                        <Input className="w-20" defaultValue="3" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Logout automático</Label>
                          <p className="text-sm text-muted-foreground">Desconectar após inatividade</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Monitoramento e Alertas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Alertas de login suspeito</Label>
                        <p className="text-sm text-muted-foreground">Notificar sobre tentativas anômalas</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Log de auditoria</Label>
                        <p className="text-sm text-muted-foreground">Registrar todas as ações administrativas</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Retenção de logs</Label>
                        <p className="text-sm text-muted-foreground">Tempo de armazenamento</p>
                      </div>
                      <Select defaultValue="365">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 dias</SelectItem>
                          <SelectItem value="90">90 dias</SelectItem>
                          <SelectItem value="365">1 ano</SelectItem>
                          <SelectItem value="forever">Permanente</SelectItem>
                        </SelectContent>
                      </Select>
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

export default function SecurityPage() {
  return <SecurityManagement />
}
