'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/shared/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/card';
import { ArrowLeft, Package, List, Settings } from 'lucide-react';

interface OrdersLayoutProps {
  children: React.ReactNode;
}

export default function OrdersLayout({ children }: OrdersLayoutProps) {
  const pathname = usePathname();
  const isOrderDetail = pathname.includes('/orders/') && pathname !== '/orders';
  const orderId = isOrderDetail ? pathname.split('/')[2] : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isOrderDetail && (
            <Link href="/orders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          )}
          
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <h1 className="text-2xl font-bold">
              {isOrderDetail ? `Pedido ${orderId}` : 'Pedidos'}
            </h1>
          </div>
        </div>
        
        {isOrderDetail && (
          <div className="flex items-center gap-2">
            <Link href={`/orders/${orderId}`}>
              <Button 
                variant={pathname === `/orders/${orderId}` ? "default" : "outline"} 
                size="sm"
              >
                <List className="h-4 w-4 mr-2" />
                Detalhes
              </Button>
            </Link>
            
            <Link href={`/orders/${orderId}/supplier_task`}>
              <Button 
                variant={pathname.includes('/supplier_task') ? "default" : "outline"} 
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Tarefas Fornecedor
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
