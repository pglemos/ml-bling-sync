'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/card';
import { Badge } from '@/components/shared/badge';
import { Button } from '@/components/shared/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared/table';
import { toast } from '@/components/shared/use-toast';
import { 
  Package, 
  User, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Phone, 
  Mail,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  status: string;
  total_amount: number;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  marketplace?: string;
  external_id?: string;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-500' },
  processing: { label: 'Processando', color: 'bg-blue-500' },
  shipped: { label: 'Enviado', color: 'bg-purple-500' },
  delivered: { label: 'Entregue', color: 'bg-green-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' },
  returned: { label: 'Devolvido', color: 'bg-muted' }
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderData();
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Falha ao carregar dados do pedido');
      
      const orderData = await response.json();
      setOrder(orderData);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados do pedido',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-muted">Pedido não encontrado</h2>
      </div>
    );
  }

  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || 
    { label: order.status, color: 'bg-muted' };

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pedido {order.order_number}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={`${statusInfo.color} text-white`}
              >
                {statusInfo.label}
              </Badge>
              <Link href={`/orders/${orderId}/supplier_task`}>
                <Button size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Tarefas Fornecedor
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted" />
              <div>
                <p className="text-sm text-muted">Total</p>
                <p className="font-medium">R$ {order.total_amount.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted" />
              <div>
                <p className="text-sm text-muted">Criado em</p>
                <p className="font-medium">
                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            
            {order.marketplace && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted" />
                <div>
                  <p className="text-sm text-muted">Marketplace</p>
                  <p className="font-medium">{order.marketplace}</p>
                </div>
              </div>
            )}
            
            {order.external_id && (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted" />
                <div>
                  <p className="text-sm text-muted">ID Externo</p>
                  <p className="font-medium">{order.external_id}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted">Nome</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              
              {order.customer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted" />
                  <div>
                    <p className="text-sm text-muted">Email</p>
                    <p className="font-medium">{order.customer_email}</p>
                  </div>
                </div>
              )}
              
              {order.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted" />
                  <div>
                    <p className="text-sm text-muted">Telefone</p>
                    <p className="font-medium">{order.customer_phone}</p>
                  </div>
                </div>
              )}
            </div>
            
            {(order.shipping_address || order.shipping_city) && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted mt-1" />
                  <div>
                    <p className="text-sm text-muted">Endereço de Entrega</p>
                    <div className="font-medium">
                      {order.shipping_address && <p>{order.shipping_address}</p>}
                      {order.shipping_city && (
                        <p>
                          {order.shipping_city}
                          {order.shipping_state && `, ${order.shipping_state}`}
                          {order.shipping_zip && ` - ${order.shipping_zip}`}
                        </p>
                      )}
                      {order.shipping_country && <p>{order.shipping_country}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Preço Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-muted">{item.sku}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">R$ {item.unit_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {item.total_price.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="p-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total do Pedido:</span>
              <span className="text-lg font-bold">R$ {order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}