"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/card";
import { Button } from "@/components/shared/button";
import { Badge } from "@/components/shared/badge";
import { Input } from "@/components/shared/input";
import { Search, Package, Clock, XCircle, RotateCcw, CheckCircle } from "lucide-react";



// Lazy load heavy components
const Tabs = dynamic(() => import("@/components/shared/tabs").then(mod => ({ default: mod.Tabs })), {
  loading: () => <div className="h-10 bg-muted animate-pulse rounded" />
});
const TabsContent = dynamic(() => import("@/components/shared/tabs").then(mod => ({ default: mod.TabsContent })));
const TabsList = dynamic(() => import("@/components/shared/tabs").then(mod => ({ default: mod.TabsList })));
const TabsTrigger = dynamic(() => import("@/components/shared/tabs").then(mod => ({ default: mod.TabsTrigger })));
const Table = dynamic(() => import("@/components/shared/table").then(mod => ({ default: mod.Table })), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded" />
});
const TableBody = dynamic(() => import("@/components/shared/table").then(mod => ({ default: mod.TableBody })));
const TableCell = dynamic(() => import("@/components/shared/table").then(mod => ({ default: mod.TableCell })));
const TableHead = dynamic(() => import("@/components/shared/table").then(mod => ({ default: mod.TableHead })));
const TableHeader = dynamic(() => import("@/components/shared/table").then(mod => ({ default: mod.TableHeader })));
const TableRow = dynamic(() => import("@/components/shared/table").then(mod => ({ default: mod.TableRow })));

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  marketplace: string;
  status: 'open' | 'cancelled' | 'returned' | 'completed';
  total: number;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

const ORDER_STATUS_CONFIG = {
  open: {
    label: 'Aberto',
    variant: 'default' as const,
    icon: Clock,
    color: 'text-blue-600'
  },
  cancelled: {
    label: 'Cancelado',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600'
  },
  returned: {
    label: 'Devolvido',
    variant: 'secondary' as const,
    icon: RotateCcw,
    color: 'text-orange-600'
  },
  completed: {
    label: 'Concluído',
    variant: 'outline' as const,
    icon: CheckCircle,
    color: 'text-green-600'
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Simulando dados de pedidos
      const mockOrders: Order[] = [
        {
          id: '1',
          orderNumber: 'ML-001234',
          customer: {
            name: 'João Silva',
            email: 'joao@email.com'
          },
          marketplace: 'Mercado Livre',
          status: 'open',
          total: 299.90,
          items: [
            { name: 'Produto A', quantity: 2, price: 149.95 }
          ],
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          orderNumber: 'SH-005678',
          customer: {
            name: 'Maria Santos',
            email: 'maria@email.com'
          },
          marketplace: 'Shopee',
          status: 'completed',
          total: 89.90,
          items: [
            { name: 'Produto B', quantity: 1, price: 89.90 }
          ],
          createdAt: '2024-01-14T15:20:00Z',
          updatedAt: '2024-01-16T09:15:00Z'
        },
        {
          id: '3',
          orderNumber: 'AM-009876',
          customer: {
            name: 'Pedro Costa',
            email: 'pedro@email.com'
          },
          marketplace: 'Amazon',
          status: 'cancelled',
          total: 199.90,
          items: [
            { name: 'Produto C', quantity: 1, price: 199.90 }
          ],
          createdAt: '2024-01-13T08:45:00Z',
          updatedAt: '2024-01-13T14:30:00Z'
        },
        {
          id: '4',
          orderNumber: 'MG-112233',
          customer: {
            name: 'Ana Oliveira',
            email: 'ana@email.com'
          },
          marketplace: 'Magalu',
          status: 'returned',
          total: 149.90,
          items: [
            { name: 'Produto D', quantity: 1, price: 149.90 }
          ],
          createdAt: '2024-01-12T16:10:00Z',
          updatedAt: '2024-01-17T11:20:00Z'
        }
      ];
      
      setOrders(mockOrders);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.marketplace.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const getOrderCounts = () => {
    return {
      all: orders.length,
      open: orders.filter(o => o.status === 'open').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      returned: orders.filter(o => o.status === 'returned').length,
      completed: orders.filter(o => o.status === 'completed').length
    };
  };

  const counts = getOrderCounts();

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Carregando pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pedidos</h1>
        <p className="text-muted-foreground">
          Gerencie todos os pedidos dos seus marketplaces integrados
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por número do pedido, cliente, email ou marketplace..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="flex items-center gap-2">
            Todos ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="open" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Abertos ({counts.open})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Cancelados ({counts.cancelled})
          </TabsTrigger>
          <TabsTrigger value="returned" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Devolvidos ({counts.returned})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Concluídos ({counts.completed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Lista de Pedidos</CardTitle>
              <CardDescription>
                {filteredOrders.length} pedido(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Não há pedidos para exibir.'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número do Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Marketplace</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const statusConfig = ORDER_STATUS_CONFIG[order.status];
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.customer.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.customer.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{order.marketplace}</TableCell>
                          <TableCell>
                            <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(order.total)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(order.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Ver Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
