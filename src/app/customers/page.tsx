"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/card";
import { Button } from "@/components/shared/button";
import { Badge } from "@/components/shared/badge";
import { Input } from "@/components/shared/input";
import { Search, Users, MapPin, Phone, Mail, Calendar, ShoppingBag } from "lucide-react";



// Lazy load heavy components
const Table = dynamic(() => import("@/components/shared/table").then(mod => ({ default: mod.Table })), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded" />
});
const TableBody = dynamic(() => import("@/components/shared/table").then(mod => ({ default: mod.TableBody })));
const TableCell = dynamic(() => import("@/components/shared/table").then(mod => ({ default: mod.TableCell })));
const TableHead = dynamic(() => import("@/components/shared/table").then(mod => ({ default: mod.TableHead })));
const TableHeader = dynamic(() => import("@/components/shared/table").then(mod => ({ default: mod.TableHeader })));
const TableRow = dynamic(() => import("@/components/shared/table").then(mod => ({ default: mod.TableRow })));
const Select = dynamic(() => import("@/components/shared/select").then(mod => ({ default: mod.Select })), {
  loading: () => <div className="h-10 bg-muted animate-pulse rounded" />
});
const SelectContent = dynamic(() => import("@/components/shared/select").then(mod => ({ default: mod.SelectContent })));
const SelectItem = dynamic(() => import("@/components/shared/select").then(mod => ({ default: mod.SelectItem })));
const SelectTrigger = dynamic(() => import("@/components/shared/select").then(mod => ({ default: mod.SelectTrigger })));
const SelectValue = dynamic(() => import("@/components/shared/select").then(mod => ({ default: mod.SelectValue })));

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  marketplaces: string[];
  totalOrders: number;
  totalSpent: number;
  firstPurchase: string;
  lastPurchase: string;
  status: 'active' | 'inactive';
}

const MARKETPLACE_COLORS = {
  'Mercado Livre': 'bg-yellow-100 text-yellow-800',
  'Shopee': 'bg-orange-100 text-orange-800',
  'Amazon': 'bg-blue-100 text-blue-800',
  'Magalu': 'bg-purple-100 text-purple-800',
  'Shein': 'bg-pink-100 text-pink-800'
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Simulando dados de clientes
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao.silva@email.com',
          phone: '(11) 99999-9999',
          document: '123.456.789-00',
          address: {
            street: 'Rua das Flores',
            number: '123',
            complement: 'Apto 45',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567'
          },
          marketplaces: ['Mercado Livre', 'Amazon'],
          totalOrders: 15,
          totalSpent: 2450.80,
          firstPurchase: '2023-03-15T10:30:00Z',
          lastPurchase: '2024-01-15T14:20:00Z',
          status: 'active'
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria.santos@email.com',
          phone: '(21) 88888-8888',
          document: '987.654.321-00',
          address: {
            street: 'Av. Copacabana',
            number: '456',
            neighborhood: 'Copacabana',
            city: 'Rio de Janeiro',
            state: 'RJ',
            zipCode: '22070-001'
          },
          marketplaces: ['Shopee', 'Shein'],
          totalOrders: 8,
          totalSpent: 890.50,
          firstPurchase: '2023-08-20T16:45:00Z',
          lastPurchase: '2024-01-10T09:15:00Z',
          status: 'active'
        },
        {
          id: '3',
          name: 'Pedro Costa',
          email: 'pedro.costa@email.com',
          phone: '(31) 77777-7777',
          document: '456.789.123-00',
          address: {
            street: 'Rua da Liberdade',
            number: '789',
            neighborhood: 'Savassi',
            city: 'Belo Horizonte',
            state: 'MG',
            zipCode: '30112-000'
          },
          marketplaces: ['Magalu'],
          totalOrders: 3,
          totalSpent: 567.90,
          firstPurchase: '2023-11-05T11:20:00Z',
          lastPurchase: '2023-12-20T15:30:00Z',
          status: 'inactive'
        },
        {
          id: '4',
          name: 'Ana Oliveira',
          email: 'ana.oliveira@email.com',
          phone: '(85) 66666-6666',
          document: '789.123.456-00',
          address: {
            street: 'Rua do Sol',
            number: '321',
            neighborhood: 'Aldeota',
            city: 'Fortaleza',
            state: 'CE',
            zipCode: '60150-160'
          },
          marketplaces: ['Mercado Livre', 'Shopee', 'Amazon'],
          totalOrders: 22,
          totalSpent: 3890.75,
          firstPurchase: '2023-01-10T08:15:00Z',
          lastPurchase: '2024-01-18T13:45:00Z',
          status: 'active'
        },
        {
          id: '5',
          name: 'Carlos Ferreira',
          email: 'carlos.ferreira@email.com',
          phone: '(47) 55555-5555',
          document: '321.654.987-00',
          address: {
            street: 'Av. Beira Mar',
            number: '654',
            neighborhood: 'Centro',
            city: 'Florianópolis',
            state: 'SC',
            zipCode: '88010-400'
          },
          marketplaces: ['Amazon', 'Magalu'],
          totalOrders: 12,
          totalSpent: 1678.40,
          firstPurchase: '2023-06-12T14:30:00Z',
          lastPurchase: '2024-01-12T10:20:00Z',
          status: 'active'
        }
      ];
      
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.document?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMarketplace = marketplaceFilter === 'all' || 
      customer.marketplaces.includes(marketplaceFilter);
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesMarketplace && matchesStatus;
  });

  const getUniqueMarketplaces = () => {
    const marketplaces = new Set<string>();
    customers.forEach(customer => {
      customer.marketplaces.forEach(marketplace => marketplaces.add(marketplace));
    });
    return Array.from(marketplaces);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCustomerStats = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgOrderValue = totalRevenue / customers.reduce((sum, c) => sum + c.totalOrders, 0) || 0;
    
    return {
      totalCustomers,
      activeCustomers,
      totalRevenue,
      avgOrderValue
    };
  };

  const stats = getCustomerStats();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Carregando clientes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Clientes</h1>
        <p className="text-muted-foreground">
          Gerencie todos os clientes dos seus marketplaces integrados
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email, telefone ou documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={marketplaceFilter} onValueChange={setMarketplaceFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Marketplace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Marketplaces</SelectItem>
            {getUniqueMarketplaces().map(marketplace => (
              <SelectItem key={marketplace} value={marketplace}>
                {marketplace}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {filteredCustomers.length} cliente(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || marketplaceFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Não há clientes para exibir.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Marketplaces</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        {customer.document && (
                          <div className="text-sm text-muted-foreground">
                            {customer.document}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-start gap-1 text-sm">
                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <div>{customer.address.city}, {customer.address.state}</div>
                          <div className="text-muted-foreground">
                            {customer.address.neighborhood}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.marketplaces.map(marketplace => (
                          <Badge 
                            key={marketplace} 
                            variant="outline" 
                            className={`text-xs ${MARKETPLACE_COLORS[marketplace as keyof typeof MARKETPLACE_COLORS] || 'bg-gray-100 text-gray-800'}`}
                          >
                            {marketplace}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="font-medium">{customer.totalOrders}</div>
                      <div className="text-xs text-muted-foreground">
                        Último: {formatDate(customer.lastPurchase)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="font-medium">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                        {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
