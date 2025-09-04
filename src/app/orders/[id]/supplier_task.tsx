'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { 
  Download, 
  ExternalLink, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw
} from 'lucide-react';

interface SupplierTask {
  id: string;
  order_id: string;
  supplier_sku: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  status: 'created' | 'sent' | 'confirmed' | 'cancelled';
  shipping_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  supplier_name?: string;
  supplier_email?: string;
  supplier_phone?: string;
  notes?: string;
  external_task_id?: string;
  sent_at?: string;
  confirmed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  status: string;
  total_amount: number;
  created_at: string;
  supplier_tasks: SupplierTask[];
}

const statusConfig = {
  created: { label: 'Criado', color: 'bg-muted', icon: Clock },
  sent: { label: 'Enviado', color: 'bg-blue-500', icon: Truck },
  confirmed: { label: 'Confirmado', color: 'bg-green-500', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle }
};

export default function SupplierTaskPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState({
    status: '',
    supplier: ''
  });

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

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/supplier-tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) throw new Error('Falha ao atualizar status');
      
      await fetchOrderData(); // Refresh data
      toast({
        title: 'Sucesso',
        description: 'Status da tarefa atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status da tarefa',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const taskIds = selectedTasks.length > 0 ? selectedTasks : order?.supplier_tasks.map(t => t.id) || [];
      
      const response = await fetch('/api/orders/supplier-tasks/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskIds)
      });
      
      if (!response.ok) throw new Error('Falha ao exportar CSV');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supplier_tasks_${order?.order_number || orderId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Sucesso',
        description: 'CSV exportado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao exportar CSV',
        variant: 'destructive'
      });
    }
  };

  const openSupplierPanel = async () => {
    try {
      const taskIds = selectedTasks.length > 0 ? selectedTasks : order?.supplier_tasks.map(t => t.id) || [];
      
      const response = await fetch('/api/orders/supplier-tasks/generate-panel-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskIds)
      });
      
      if (!response.ok) throw new Error('Falha ao gerar URL do painel');
      
      const { panel_url } = await response.json();
      window.open(panel_url, '_blank');
      
      toast({
        title: 'Sucesso',
        description: 'Painel do fornecedor aberto em nova aba'
      });
    } catch (error) {
      console.error('Erro ao abrir painel:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao abrir painel do fornecedor',
        variant: 'destructive'
      });
    }
  };

  const filteredTasks = order?.supplier_tasks.filter(task => {
    const statusMatch = !filter.status || task.status === filter.status;
    const supplierMatch = !filter.supplier || 
      task.supplier_name?.toLowerCase().includes(filter.supplier.toLowerCase()) ||
      task.supplier_sku.toLowerCase().includes(filter.supplier.toLowerCase());
    return statusMatch && supplierMatch;
  }) || [];

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAllTasks = () => {
    setSelectedTasks(filteredTasks.map(task => task.id));
  };

  const clearSelection = () => {
    setSelectedTasks([]);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pedido {order.order_number}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted">Cliente</p>
              <p className="font-medium">{order.customer_name}</p>
              {order.customer_email && (
                <p className="text-sm text-muted">{order.customer_email}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted">Status</p>
              <Badge variant="outline">{order.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted">Total</p>
              <p className="font-medium">R$ {order.total_amount.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Tarefas do Fornecedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Filters */}
            <div className="flex gap-2 flex-1">
              <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="created">Criado</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Filtrar por fornecedor ou SKU"
                value={filter.supplier}
                onChange={(e) => setFilter(prev => ({ ...prev, supplier: e.target.value }))}
                className="w-64"
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={selectedTasks.length === filteredTasks.length ? clearSelection : selectAllTasks}
                size="sm"
              >
                {selectedTasks.length === filteredTasks.length ? 'Limpar' : 'Selecionar Todos'}
              </Button>
              
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={filteredTasks.length === 0}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              
              <Button
                onClick={openSupplierPanel}
                disabled={filteredTasks.length === 0}
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Painel Fornecedor
              </Button>
            </div>
          </div>
          
          {selectedTasks.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                {selectedTasks.length} tarefa(s) selecionada(s)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Sel.</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const StatusIcon = statusConfig[task.status].icon;
                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{task.supplier_sku}</TableCell>
                    <TableCell>{task.quantity}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{task.supplier_name || 'N/A'}</p>
                        {task.supplier_email && (
                          <p className="text-sm text-muted">{task.supplier_email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{task.shipping_name}</p>
                        <p className="text-muted">
                          {task.shipping_city}, {task.shipping_state}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`${statusConfig[task.status].color} text-white`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[task.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(task.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={task.status}
                        onValueChange={(value) => updateTaskStatus(task.id, value)}
                        disabled={updating}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created">Criado</SelectItem>
                          <SelectItem value="sent">Enviado</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-muted">
              Nenhuma tarefa encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}