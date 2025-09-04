"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card';
import { Button } from '@/components/shared/button';
import { Badge } from '@/components/shared/badge';
import { Progress } from '@/components/shared/progress';
import { Checkbox } from '@/components/shared/checkbox';
import { Alert, AlertDescription } from '@/components/shared/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/tabs';
import { ScrollArea } from '@/components/shared/scroll-area';
import { Separator } from '@/components/shared/separator';
import { useToast } from '@/components/shared/use-toast';
import {
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Upload,
  RefreshCw,
  Settings,
  ExternalLink,
  ShoppingCart,
  Package,
  DollarSign,
  Image as ImageIcon,
  FileText,
  Zap
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
  description: string;
  attributes?: Record<string, any>;
}

interface MarketplaceConfig {
  id: string;
  name: string;
  logo: string;
  color: string;
  isConnected: boolean;
  requirements: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  status: 'pending' | 'valid' | 'invalid' | 'warning';
  details?: string;
}

interface PublishResult {
  productId: string;
  marketplace: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  externalId?: string;
  url?: string;
}

interface ChannelPublisherProps {
  products: Product[];
  onPublish?: (results: PublishResult[]) => void;
  onClose?: () => void;
}

const MARKETPLACES: MarketplaceConfig[] = [
  {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    logo: '/mercadolivre-logo.png',
    color: 'bg-yellow-500',
    isConnected: true,
    requirements: [
      {
        id: 'title',
        label: 'Título do produto',
        description: 'Título deve ter entre 10 e 60 caracteres',
        required: true,
        status: 'pending'
      },
      {
        id: 'category',
        label: 'Categoria do ML',
        description: 'Produto deve ter categoria mapeada no Mercado Livre',
        required: true,
        status: 'pending'
      },
      {
        id: 'price',
        label: 'Preço válido',
        description: 'Preço deve ser maior que R$ 1,00',
        required: true,
        status: 'pending'
      },
      {
        id: 'stock',
        label: 'Estoque disponível',
        description: 'Produto deve ter estoque maior que 0',
        required: true,
        status: 'pending'
      },
      {
        id: 'images',
        label: 'Imagens do produto',
        description: 'Pelo menos 1 imagem é obrigatória',
        required: true,
        status: 'pending'
      },
      {
        id: 'description',
        label: 'Descrição do produto',
        description: 'Descrição deve ter pelo menos 20 caracteres',
        required: false,
        status: 'pending'
      }
    ]
  },
  {
    id: 'shopee',
    name: 'Shopee',
    logo: '/shopee-logo.svg',
    color: 'bg-orange-500',
    isConnected: true,
    requirements: [
      {
        id: 'title',
        label: 'Nome do produto',
        description: 'Nome deve ter entre 10 e 120 caracteres',
        required: true,
        status: 'pending'
      },
      {
        id: 'category',
        label: 'Categoria da Shopee',
        description: 'Produto deve ter categoria mapeada na Shopee',
        required: true,
        status: 'pending'
      },
      {
        id: 'price',
        label: 'Preço válido',
        description: 'Preço deve ser maior que R$ 0,50',
        required: true,
        status: 'pending'
      },
      {
        id: 'stock',
        label: 'Estoque disponível',
        description: 'Produto deve ter estoque maior que 0',
        required: true,
        status: 'pending'
      },
      {
        id: 'images',
        label: 'Imagens do produto',
        description: 'Entre 1 e 9 imagens são obrigatórias',
        required: true,
        status: 'pending'
      },
      {
        id: 'weight',
        label: 'Peso do produto',
        description: 'Peso é obrigatório para cálculo de frete',
        required: true,
        status: 'pending'
      },
      {
        id: 'dimensions',
        label: 'Dimensões do produto',
        description: 'Altura, largura e comprimento são obrigatórios',
        required: true,
        status: 'pending'
      }
    ]
  }
];

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' },
  valid: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
  invalid: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
  warning: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' }
};

export default function ChannelPublisher({ products, onPublish, onClose }: ChannelPublisherProps) {
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(['mercadolivre']);
  const [isDryRun, setIsDryRun] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishResult[]>([]);
  const [validationResults, setValidationResults] = useState<Record<string, ChecklistItem[]>>({});
  const [currentStep, setCurrentStep] = useState<'setup' | 'validation' | 'publishing' | 'results'>('setup');
  const [publishProgress, setPublishProgress] = useState(0);
  const { toast } = useToast();

  // Validar produtos para cada marketplace
  const validateProducts = async () => {
    const results: Record<string, ChecklistItem[]> = {};
    
    for (const marketplaceId of selectedMarketplaces) {
      const marketplace = MARKETPLACES.find(m => m.id === marketplaceId);
      if (!marketplace) continue;
      
      const validatedRequirements = marketplace.requirements.map(req => {
        let status: ChecklistItem['status'] = 'valid';
        let details = '';
        
        // Validar cada requisito para todos os produtos
        const invalidProducts: string[] = [];
        const warningProducts: string[] = [];
        
        products.forEach(product => {
          switch (req.id) {
            case 'title':
              if (marketplaceId === 'mercadolivre') {
                if (product.name.length < 10 || product.name.length > 60) {
                  invalidProducts.push(product.sku);
                }
              } else if (marketplaceId === 'shopee') {
                if (product.name.length < 10 || product.name.length > 120) {
                  invalidProducts.push(product.sku);
                }
              }
              break;
              
            case 'price':
              const minPrice = marketplaceId === 'mercadolivre' ? 1 : 0.5;
              if (product.price < minPrice) {
                invalidProducts.push(product.sku);
              }
              break;
              
            case 'stock':
              if (product.stock <= 0) {
                invalidProducts.push(product.sku);
              }
              break;
              
            case 'images':
              if (product.images.length === 0) {
                invalidProducts.push(product.sku);
              } else if (marketplaceId === 'shopee' && product.images.length > 9) {
                warningProducts.push(product.sku);
              }
              break;
              
            case 'description':
              if (product.description.length < 20) {
                if (req.required) {
                  invalidProducts.push(product.sku);
                } else {
                  warningProducts.push(product.sku);
                }
              }
              break;
              
            case 'category':
              // Simular validação de categoria
              if (!product.category || product.category === 'Sem categoria') {
                invalidProducts.push(product.sku);
              }
              break;
              
            case 'weight':
            case 'dimensions':
              // Simular validação de peso e dimensões para Shopee
              if (marketplaceId === 'shopee') {
                if (!product.attributes?.[req.id]) {
                  invalidProducts.push(product.sku);
                }
              }
              break;
          }
        });
        
        if (invalidProducts.length > 0) {
          status = 'invalid';
          details = `${invalidProducts.length} produto(s) com problema: ${invalidProducts.slice(0, 3).join(', ')}${invalidProducts.length > 3 ? '...' : ''}`;
        } else if (warningProducts.length > 0) {
          status = 'warning';
          details = `${warningProducts.length} produto(s) com aviso: ${warningProducts.slice(0, 3).join(', ')}${warningProducts.length > 3 ? '...' : ''}`;
        } else {
          details = `${products.length} produto(s) válido(s)`;
        }
        
        return {
          ...req,
          status,
          details
        };
      });
      
      results[marketplaceId] = validatedRequirements;
    }
    
    setValidationResults(results);
    setCurrentStep('validation');
  };

  // Simular publicação
  const handlePublish = async () => {
    setIsPublishing(true);
    setCurrentStep('publishing');
    setPublishProgress(0);
    
    const results: PublishResult[] = [];
    const totalOperations = products.length * selectedMarketplaces.length;
    let completedOperations = 0;
    
    for (const product of products) {
      for (const marketplaceId of selectedMarketplaces) {
        // Simular delay de publicação
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simular resultado da publicação
        const hasErrors = validationResults[marketplaceId]?.some(req => req.status === 'invalid');
        const hasWarnings = validationResults[marketplaceId]?.some(req => req.status === 'warning');
        
        let status: PublishResult['status'] = 'success';
        let message = '';
        
        if (hasErrors) {
          status = 'error';
          message = 'Produto não atende aos requisitos obrigatórios';
        } else if (hasWarnings) {
          status = 'warning';
          message = 'Produto publicado com avisos';
        } else {
          status = 'success';
          message = isDryRun ? 'Validação bem-sucedida (dry-run)' : 'Produto publicado com sucesso';
        }
        
        results.push({
          productId: product.id,
          marketplace: marketplaceId,
          status,
          message,
          externalId: status === 'success' ? `${marketplaceId.toUpperCase()}-${Math.random().toString(36).substr(2, 9)}` : undefined,
          url: status === 'success' ? `https://${marketplaceId}.com/item/${product.sku}` : undefined
        });
        
        completedOperations++;
        setPublishProgress((completedOperations / totalOperations) * 100);
      }
    }
    
    setPublishResults(results);
    setIsPublishing(false);
    setCurrentStep('results');
    
    if (onPublish) {
      onPublish(results);
    }
    
    toast({
      title: isDryRun ? "Validação concluída" : "Publicação concluída",
      description: `${results.filter(r => r.status === 'success').length} de ${results.length} operações bem-sucedidas`,
    });
  };

  const getOverallStatus = (marketplaceId: string) => {
    const requirements = validationResults[marketplaceId] || [];
    const hasInvalid = requirements.some(req => req.status === 'invalid');
    const hasWarning = requirements.some(req => req.status === 'warning');
    
    if (hasInvalid) return 'invalid';
    if (hasWarning) return 'warning';
    return requirements.length > 0 ? 'valid' : 'pending';
  };

  const canPublish = () => {
    return selectedMarketplaces.every(marketplaceId => {
      const status = getOverallStatus(marketplaceId);
      return status === 'valid' || status === 'warning';
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Publicar em Marketplaces</h2>
          <p className="text-muted-foreground">
            {products.length} produto(s) selecionado(s) para publicação
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4">
        {[
          { id: 'setup', label: 'Configuração', icon: Settings },
          { id: 'validation', label: 'Validação', icon: CheckCircle2 },
          { id: 'publishing', label: 'Publicação', icon: Upload },
          { id: 'results', label: 'Resultados', icon: Eye }
        ].map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = ['setup', 'validation', 'publishing', 'results'].indexOf(currentStep) > index;
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex items-center space-x-2">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2
                ${isActive ? 'border-primary bg-primary text-primary-foreground' : ''}
                ${isCompleted ? 'border-green-500 bg-green-500 text-white' : ''}
                ${!isActive && !isCompleted ? 'border-muted-foreground text-muted-foreground' : ''}
              `}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-sm font-medium ${
                isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
              {index < 3 && (
                <div className={`w-8 h-0.5 ${
                  isCompleted ? 'bg-green-500' : 'bg-muted'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 'setup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Selecionar Marketplaces</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MARKETPLACES.map(marketplace => (
                    <Card key={marketplace.id} className={`cursor-pointer transition-all ${
                      selectedMarketplaces.includes(marketplace.id) ? 'ring-2 ring-primary' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedMarketplaces.includes(marketplace.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMarketplaces(prev => [...prev, marketplace.id]);
                              } else {
                                setSelectedMarketplaces(prev => prev.filter(id => id !== marketplace.id));
                              }
                            }}
                          />
                          <div className={`w-8 h-8 rounded ${marketplace.color} flex items-center justify-center`}>
                            <ShoppingCart className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{marketplace.name}</span>
                              {marketplace.isConnected ? (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Conectado
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Desconectado
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {marketplace.requirements.length} requisitos
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Opções de Publicação</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isDryRun}
                      onCheckedChange={(checked) => setIsDryRun(!!checked)}
                    />
                    <div>
                      <label className="font-medium">Modo Dry-Run (Simulação)</label>
                      <p className="text-sm text-muted-foreground">
                        Validar produtos sem publicar efetivamente nos marketplaces
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={validateProducts}
                  disabled={selectedMarketplaces.length === 0}
                  className="min-w-[120px]"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Validar Produtos
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'validation' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Validação de Requisitos</h3>
                <Button variant="outline" onClick={() => setCurrentStep('setup')}>
                  Voltar
                </Button>
              </div>

              <Tabs defaultValue={selectedMarketplaces[0]} className="w-full">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${selectedMarketplaces.length}, 1fr)` }}>
                  {selectedMarketplaces.map(marketplaceId => {
                    const marketplace = MARKETPLACES.find(m => m.id === marketplaceId);
                    const status = getOverallStatus(marketplaceId);
                    const StatusIcon = STATUS_CONFIG[status].icon;
                    
                    return (
                      <TabsTrigger key={marketplaceId} value={marketplaceId} className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded ${marketplace?.color} flex items-center justify-center`}>
                          <ShoppingCart className="w-3 h-3 text-white" />
                        </div>
                        <span>{marketplace?.name}</span>
                        <StatusIcon className={`w-4 h-4 ${STATUS_CONFIG[status].color}`} />
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {selectedMarketplaces.map(marketplaceId => {
                  const marketplace = MARKETPLACES.find(m => m.id === marketplaceId);
                  const requirements = validationResults[marketplaceId] || [];
                  
                  return (
                    <TabsContent key={marketplaceId} value={marketplaceId} className="space-y-4">
                      <div className="grid gap-4">
                        {requirements.map(req => {
                          const StatusIcon = STATUS_CONFIG[req.status].icon;
                          
                          return (
                            <Card key={req.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                  <div className={`p-2 rounded-full ${STATUS_CONFIG[req.status].bg}`}>
                                    <StatusIcon className={`w-4 h-4 ${STATUS_CONFIG[req.status].color}`} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">{req.label}</span>
                                      {req.required && (
                                        <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {req.description}
                                    </p>
                                    {req.details && (
                                      <p className={`text-sm mt-2 ${
                                        req.status === 'invalid' ? 'text-red-600' :
                                        req.status === 'warning' ? 'text-yellow-600' :
                                        'text-green-600'
                                      }`}>
                                        {req.details}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={handlePublish}
                  disabled={!canPublish() || isPublishing}
                  className="min-w-[120px]"
                >
                  {isPublishing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isDryRun ? 'Simular Publicação' : 'Publicar Produtos'}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'publishing' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {isDryRun ? 'Simulando Publicação...' : 'Publicando Produtos...'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  Processando {products.length} produto(s) em {selectedMarketplaces.length} marketplace(s)
                </p>
                <div className="max-w-md mx-auto">
                  <Progress value={publishProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {Math.round(publishProgress)}% concluído
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'results' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Resultados da Publicação</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setCurrentStep('setup')}>
                    Nova Publicação
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {publishResults.filter(r => r.status === 'success').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Sucessos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {publishResults.filter(r => r.status === 'warning').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Avisos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">
                      {publishResults.filter(r => r.status === 'error').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Erros</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Results */}
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {publishResults.map((result, index) => {
                    const product = products.find(p => p.id === result.productId);
                    const marketplace = MARKETPLACES.find(m => m.id === result.marketplace);
                    const StatusIcon = result.status === 'success' ? CheckCircle2 :
                                     result.status === 'warning' ? AlertCircle : AlertCircle;
                    
                    return (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${
                              result.status === 'success' ? 'bg-green-100' :
                              result.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                            }`}>
                              <StatusIcon className={`w-4 h-4 ${
                                result.status === 'success' ? 'text-green-600' :
                                result.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{product?.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {product?.sku}
                                </Badge>
                                <div className={`w-4 h-4 rounded ${marketplace?.color} flex items-center justify-center`}>
                                  <ShoppingCart className="w-2 h-2 text-white" />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {marketplace?.name}
                                </span>
                              </div>
                              <p className={`text-sm mt-1 ${
                                result.status === 'success' ? 'text-green-600' :
                                result.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {result.message}
                              </p>
                              {result.externalId && (
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    ID: {result.externalId}
                                  </Badge>
                                  {result.url && (
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Ver Produto
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
