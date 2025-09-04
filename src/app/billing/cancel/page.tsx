"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card';
import { Button } from '@/components/shared/button';
import { XCircle, ArrowLeft, Package, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const CheckoutCancelPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="text-center shadow-lg">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-fit">
              <XCircle className="h-8 w-8 text-gray-600" />
            </div>
            <CardTitle className="text-2xl text-gray-700">
              Checkout Cancelado
            </CardTitle>
            <CardDescription className="text-base">
              Não se preocupe! Você pode voltar e escolher um plano a qualquer momento.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold mb-2 text-blue-800">Por que escolher um plano?</h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Sincronização automática de produtos</li>
                <li>• Processamento de pedidos em tempo real</li>
                <li>• Integrações com múltiplos fornecedores</li>
                <li>• Suporte técnico especializado</li>
                <li>• Analytics e relatórios detalhados</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-left">O que você pode fazer agora:</h3>
              <div className="grid gap-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/billing" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Ver Planos Disponíveis
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/support" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Falar com Suporte
                  </Link>
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Ainda tem dúvidas?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Nossa equipe está aqui para ajudar você a escolher o melhor plano para suas necessidades.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span>📧 Email:</span>
                  <a href="mailto:suporte@mlblingsync.com" className="text-primary hover:underline">
                    suporte@mlblingsync.com
                  </a>
                </div>
                <div className="flex justify-between">
                  <span>💬 Chat:</span>
                  <span className="text-muted-foreground">Disponível 24/7</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-1">Oferta Especial!</h3>
              <p className="text-sm opacity-90 mb-3">
                Teste qualquer plano por 14 dias grátis. Sem compromisso, cancele quando quiser.
              </p>
              <Button variant="secondary" asChild className="w-full">
                <Link href="/billing">
                  Começar Teste Grátis
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancelPage;
