"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { RefreshCw, Package, Upload, Eye, Settings, Search, Filter, Plus, Download, TrendingUp, ShoppingBag, AlertCircle, CheckCircle2 } from "lucide-react";

const ProductGrid = dynamic(() => import("@/components/product/ProductGrid").then(mod => ({ default: mod.ProductGrid })), {
  loading: () => <div className="flex items-center justify-center h-64"><RefreshCw className="h-6 w-6 animate-spin" /></div>
});

const ProductCreateWizard = dynamic(() => import("@/components/product/ProductCreateWizard").then(mod => ({ default: mod.ProductCreateWizard })), {
  loading: () => <div className="flex items-center justify-center h-32"><RefreshCw className="h-4 w-4 animate-spin" /></div>
});

const ProductCreateWizardPremium = dynamic(() => import("@/components/product/ProductCreateWizardPremium").then(mod => ({ default: mod.ProductCreateWizardPremium })), {
  loading: () => <div className="flex items-center justify-center h-32"><RefreshCw className="h-4 w-4 animate-spin" /></div>
});



import { Product } from "@/types/product";
import { Button } from "@/components/shared/button";
const KeyboardShortcutsHelp = dynamic(() => import("@/components/shared/keyboard-shortcuts-help").then(mod => ({ default: mod.KeyboardShortcutsHelp })));

import { useKeyboardShortcutsHelp } from "@/components/shared/keyboard-shortcuts-help";


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/tabs";
import { Badge } from "@/components/shared/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/shared/dialog";
import { Input } from "@/components/shared/input";
import { Label } from "@/components/shared/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shared/select";
import { Checkbox } from "@/components/shared/checkbox";
import { useToast } from "@/components/shared/use-toast";

type Integration = {
  id: string;
  provider: string;
  access_token: string;
};

const MARKETPLACES = [
  { id: "mercadolivre", name: "Mercado Livre", color: "bg-yellow-500", logo: "/mercadolivre-logo.png" },
  { id: "shopee", name: "Shopee", color: "bg-orange-500", logo: "/shopee-logo.svg" },
  { id: "amazon", name: "Amazon", color: "bg-orange-400", logo: "/amazon-logo.svg" },
  { id: "magalu", name: "Magazine Luiza", color: "bg-blue-600", logo: "/magalu-logo.svg" }
];

// Mock data for development
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Smartphone Samsung Galaxy A54 128GB",
    sku: "SAM-A54-128",
    category: "Eletrônicos",
    price: 1299.99,
    stock: 25,
    images: ["/placeholder-product.svg"],
    status: "active",
    marketplaces: ["mercadolivre", "shopee"],
    provider: "manual",
    description: "Smartphone com tela de 6.4 polegadas e câmera tripla",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    sync_status: {
      mercadolivre: "synced",
      shopee: "not_synced",
      amazon: "not_synced",
      magalu: "not_synced"
    }
  },
  {
    id: "2",
    name: "Notebook Lenovo IdeaPad 3 Intel Core i5",
    sku: "LEN-IP3-I5",
    category: "Informática",
    price: 2499.99,
    stock: 8,
    images: ["/placeholder-product.svg"],
    status: "active",
    marketplaces: ["amazon"],
    provider: "manual",
    description: "Notebook para uso profissional e estudos",
    created_at: "2024-01-14T15:30:00Z",
    updated_at: "2024-01-14T15:30:00Z",
    sync_status: {
      mercadolivre: "not_synced",
      shopee: "not_synced",
      amazon: "synced",
      magalu: "not_synced"
    }
  },
  {
    id: "3",
    name: "Fone de Ouvido Bluetooth JBL Tune 510BT",
    sku: "JBL-T510BT",
    category: "Áudio",
    price: 199.99,
    stock: 0,
    images: ["/placeholder-product.svg"],
    status: "inactive",
    marketplaces: ["mercadolivre", "magalu"],
    provider: "manual",
    description: "Fone de ouvido sem fio com qualidade JBL",
    created_at: "2024-01-13T09:15:00Z",
    updated_at: "2024-01-13T09:15:00Z",
    sync_status: {
      mercadolivre: "error",
      shopee: "not_synced",
      amazon: "not_synced",
      magalu: "synced"
    }
  },
  {
    id: "4",
    name: "Smart TV LG 55 4K UHD",
    sku: "LG-55UK6360",
    category: "TV e Vídeo",
    price: 2199.99,
    stock: 12,
    images: ["/placeholder-product.svg"],
    status: "active",
    marketplaces: ["mercadolivre", "amazon", "magalu"],
    provider: "manual",
    description: "Smart TV com resolução 4K e sistema webOS",
    created_at: "2024-01-12T14:20:00Z",
    updated_at: "2024-01-12T14:20:00Z",
    sync_status: {
      mercadolivre: "synced",
      shopee: "not_synced",
      amazon: "synced",
      magalu: "not_synced"
    }
  },
  {
    id: "5",
    name: "Tênis Nike Air Max 270",
    sku: "NIKE-AM270",
    category: "Calçados",
    price: 599.99,
    stock: 35,
    images: ["/placeholder-product.svg"],
    status: "active",
    marketplaces: ["shopee"],
    provider: "manual",
    description: "Tênis esportivo com tecnologia Air Max",
    created_at: "2024-01-11T11:45:00Z",
    updated_at: "2024-01-11T11:45:00Z",
    sync_status: {
      mercadolivre: "not_synced",
      shopee: "synced",
      amazon: "not_synced",
      magalu: "not_synced"
    }
  },
  {
    id: "6",
    name: "Cafeteira Elétrica Philco PH31",
    sku: "PHI-PH31",
    category: "Eletrodomésticos",
    price: 89.99,
    stock: 18,
    images: ["/placeholder-product.svg"],
    status: "draft",
    marketplaces: [],
    provider: "manual",
    description: "Cafeteira elétrica para 30 xícaras",
    created_at: "2024-01-10T16:30:00Z",
    updated_at: "2024-01-10T16:30:00Z",
    sync_status: {
      mercadolivre: "not_synced",
      shopee: "not_synced",
      amazon: "not_synced",
      magalu: "not_synced"
    }
  }
];

export default function ProductsPage() {
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [usePremiumWizard, setUsePremiumWizard] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const { isOpen: isShortcutsHelpOpen, setIsOpen: setIsShortcutsHelpOpen } = useKeyboardShortcutsHelp();
  const { toast } = useToast();

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [duplicatingProduct, setDuplicatingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'n':
          event.preventDefault();
          setIsCreateWizardOpen(true);
          toast({
            title: "Atalho ativado",
            description: "Abrindo criador de produtos (N)",
          });
          break;
        case '/':
          event.preventDefault();
          const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            toast({
              title: "Atalho ativado",
              description: "Focando campo de busca (/)",
            });
          }
          break;
        case 'escape':
          if (isCreateWizardOpen) {
            setIsCreateWizardOpen(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCreateWizardOpen, toast]);

  // Calculate stats
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    inactive: products.filter(p => p.status === 'inactive').length,
    draft: products.filter(p => p.status === 'draft').length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleDuplicateProduct = (product: Product) => {
    setDuplicatingProduct(product);
  };

  const handleViewProductDetails = (product: Product) => {
    setViewingProduct(product);
  };

  const handleConfirmDuplicate = () => {
    if (duplicatingProduct) {
      const newProduct: Product = {
        ...duplicatingProduct,
        id: `${Date.now()}`,
        name: `${duplicatingProduct.name} (Cópia)`,
        sku: `${duplicatingProduct.sku}-COPY`,
      };
      setProducts([...products, newProduct]);
      setDuplicatingProduct(null);
      toast({
        title: "Produto duplicado",
        description: `${newProduct.name} foi criado com sucesso.`,
      });
    }
  };

  const handleExportCSV = () => {
    toast({
      title: "Exportação iniciada",
      description: "O arquivo CSV será baixado em breve.",
    });
  };

  const handleSyncProducts = async () => {
    if (selectedProducts.length === 0 || !selectedMarketplace) {
      toast({
        title: "Seleção inválida",
        description: "Selecione produtos e um marketplace para sincronizar.",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch("/api/products/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productIds: selectedProducts, marketplace: selectedMarketplace }),
      });
      if (response.ok) {
        setSelectedProducts([]);
        setSelectedMarketplace("");
        toast({
          title: "Sincronização concluída",
          description: "Os produtos foram sincronizados com sucesso.",
        });
      } else {
        throw new Error("Failed to sync products");
      }
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Ocorreu um erro ao sincronizar os produtos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleProductSelection = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-destructive mb-2">Erro ao carregar produtos</h2>
              <p className="text-muted-foreground mb-4">Ocorreu um erro ao carregar os produtos. Tente novamente.</p>
              <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        
        <Tabs defaultValue="products" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-surface/80 backdrop-blur-sm shadow-lg border border-surface">
              <TabsTrigger 
                value="products" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300"
              >
                <Package className="w-4 h-4 mr-2" />
                Gerenciar Produtos
              </TabsTrigger>
              <TabsTrigger 
                value="sync" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products" className="space-y-8">
            <ProductListingPremium
              onCreateProduct={(premium = false) => {
                setUsePremiumWizard(premium);
                setIsCreateWizardOpen(true);
              }}
              onEditProduct={handleEditProduct}
              onViewProduct={handleViewProductDetails}
              onDuplicateProduct={handleDuplicateProduct}
              onDeleteProduct={(product) => {
                // TODO: Implement delete functionality
                toast({
                  title: "Produto excluído",
                  description: `O produto ${product.name} foi excluído com sucesso.`,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="sync" className="space-y-6">
            <Card className="bg-surface/80 backdrop-blur-sm border border-surface shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-t-lg border-b border-surface">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-primary-foreground" />
                  </div>
                  Sincronização com Marketplaces
                </CardTitle>
                <CardDescription className="text-muted">
                  Selecione produtos e marketplace para sincronizar automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Marketplace de Destino</Label>
                  <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
                    <SelectTrigger className="h-12 bg-surface border-surface">
                      <SelectValue placeholder="Selecione um marketplace" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKETPLACES.map((marketplace) => (
                        <SelectItem key={marketplace.id} value={marketplace.id}>
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${marketplace.color}`} />
                            {marketplace.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Produtos para Sincronizar</Label>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="select-all"
                        checked={selectedProducts.length === products.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label htmlFor="select-all" className="text-sm font-medium">
                        Selecionar todos ({products.length})
                      </Label>
                    </div>
                  </div>

                  <div className="border border-surface rounded-xl max-h-96 overflow-y-auto bg-surface">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center space-x-4 p-4 border-b border-surface last:border-b-0 hover:bg-surface transition-colors">
                        <Checkbox
                          id={product.id}
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) => handleProductSelection(product.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Label htmlFor={product.id} className="font-semibold text-primary">
                              {product.name}
                            </Label>
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {product.sku}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted mt-1">
                            {product.category} • R$ {product.price.toFixed(2)} • Estoque: {product.stock}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSyncProducts} 
                    disabled={syncing || selectedProducts.length === 0 || !selectedMarketplace}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Sincronizar Produtos ({selectedProducts.length})
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {isCreateWizardOpen && !usePremiumWizard && (
          <ProductCreateWizard
            open={isCreateWizardOpen}
            onOpenChange={(open) => setIsCreateWizardOpen(open)}
            onSubmit={(formData) => {
              // Convert ProductFormData to Product
              const newProduct: Product = {
                id: `product_${Date.now()}`,
                name: formData.name,
                sku: formData.sku,
                category: formData.category,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                description: formData.description,
                images: formData.images.map(file => URL.createObjectURL(file)),
                status: 'active' as const,
                marketplaces: formData.marketplaces,
                provider: 'manual' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                sync_status: {
                  mercadolivre: 'not_synced' as const,
                  shopee: 'not_synced' as const,
                  amazon: 'not_synced' as const,
                  magalu: 'not_synced' as const
                }
              };
              setProducts([...products, newProduct]);
              setIsCreateWizardOpen(false);
              toast({
                title: "Produto criado",
                description: `${newProduct.name} foi criado com sucesso.`
              });
            }}
          />
        )}

        {isCreateWizardOpen && usePremiumWizard && (
          <ProductCreateWizardPremium
            open={isCreateWizardOpen}
            onOpenChange={(open) => setIsCreateWizardOpen(open)}
            onSubmit={(formData) => {
              // Convert ProductFormData to Product
              const newProduct: Product = {
                id: `product_${Date.now()}`,
                name: formData.name,
                sku: formData.sku,
                category: formData.category,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                description: formData.description,
                images: formData.images.map(file => URL.createObjectURL(file)),
                status: 'active' as const,
                marketplaces: formData.marketplaces,
                provider: 'manual' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                sync_status: {
                  mercadolivre: 'not_synced' as const,
                  shopee: 'not_synced' as const,
                  amazon: 'not_synced' as const,
                  magalu: 'not_synced' as const
                }
              };
              setProducts([...products, newProduct]);
              setIsCreateWizardOpen(false);
              toast({
                title: "Produto criado",
                description: `${newProduct.name} foi criado com sucesso.`
              });
            }}
          />
        )}

        {isShortcutsHelpOpen && (
          <KeyboardShortcutsHelp
            open={isShortcutsHelpOpen}
            onOpenChange={(open) => setIsShortcutsHelpOpen(open)}
          />
        )}

        {viewingProduct && (
          <Dialog open={!!viewingProduct} onOpenChange={(open) => !open && setViewingProduct(null)}>
            <DialogContent className="max-w-2xl bg-surface border border-surface">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Detalhes do Produto</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted">Nome</label>
                    <p className="text-primary font-medium">{viewingProduct.name}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted">SKU</label>
                    <p className="text-primary font-medium">{viewingProduct.sku}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted">Categoria</label>
                    <p className="text-primary font-medium">{viewingProduct.category}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted">Status</label>
                    <Badge className={viewingProduct.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {viewingProduct.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted">Preço</label>
                    <p className="text-primary font-medium text-lg">R$ {viewingProduct.price.toFixed(2)}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted">Estoque</label>
                    <p className="text-primary font-medium">{viewingProduct.stock} unidades</p>
                  </div>
                </div>
                {viewingProduct.images && viewingProduct.images[0] && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted">Imagem</label>
                    <img 
                      src={viewingProduct.images[0]} 
                      alt={viewingProduct.name} 
                      className="w-32 h-32 object-cover rounded-lg border border-surface" 
                    />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {duplicatingProduct && (
          <Dialog open={!!duplicatingProduct} onOpenChange={(open) => !open && setDuplicatingProduct(null)}>
            <DialogContent className="bg-surface border border-surface">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Duplicar Produto</DialogTitle>
              </DialogHeader>
              <p className="text-muted">Tem certeza que deseja duplicar o produto &quot;{duplicatingProduct.name}&quot;?</p>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={() => setDuplicatingProduct(null)} className="px-6">
                  Cancelar
                </Button>
                <Button onClick={handleConfirmDuplicate} className="px-6 bg-blue-500 hover:bg-blue-600">
                  Duplicar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
