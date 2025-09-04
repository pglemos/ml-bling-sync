"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Grid3X3,
  List,
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShoppingBag,
  ArrowUpDown,
  ChevronDown,
  X,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { Badge } from "@/components/shared/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Checkbox } from "@/components/shared/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/shared/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/select";
import { useToast } from "@/components/shared/use-toast";
import ChannelPublisher from "./ChannelPublisher";
import { Product } from "@/types/product";

interface ProductListingPremiumProps {
  onCreateProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
  onDuplicateProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}

export function ProductListingPremium({
  onCreateProduct,
  onEditProduct,
  onViewProduct,
  onDuplicateProduct,
  onDeleteProduct,
}: ProductListingPremiumProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showChannelPublisher, setShowChannelPublisher] = useState(false);

  // Mock data
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: "1",
        name: "Smartphone Galaxy S24",
        sku: "GALAXY-S24-001",
        price: 2999.99,
        stock: 45,
        category: "Eletrônicos",
        status: "active",
        images: ["/placeholder-product.svg"],
        description: "Smartphone Samsung Galaxy S24 com 256GB",
        marketplaces: ["mercadolivre", "shopee"],
        provider: "manual",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T14:30:00Z",
        sync_status: {
          mercadolivre: "synced",
          shopee: "synced",
          amazon: "not_synced",
          magalu: "not_synced"
        }
      },
      {
        id: "2",
        name: "Notebook Dell Inspiron",
        sku: "DELL-INSP-001",
        price: 3499.99,
        stock: 12,
        category: "Informática",
        status: "active",
        images: ["/placeholder-product.svg"],
        description: "Notebook Dell Inspiron 15 com Intel i7",
        marketplaces: ["mercadolivre"],
        provider: "manual",
        created_at: "2024-01-10T08:00:00Z",
        updated_at: "2024-01-18T16:45:00Z",
        sync_status: {
          mercadolivre: "synced",
          shopee: "not_synced",
          amazon: "not_synced",
          magalu: "not_synced"
        }
      },
      {
        id: "3",
        name: "Fone Bluetooth Sony",
        sku: "SONY-BT-001",
        price: 299.99,
        stock: 0,
        category: "Áudio",
        status: "inactive",
        images: ["/placeholder-product.svg"],
        description: "Fone de ouvido Bluetooth Sony WH-1000XM4",
        marketplaces: [],
        provider: "manual",
        created_at: "2024-01-05T12:00:00Z",
        updated_at: "2024-01-15T09:20:00Z",
        sync_status: {
          mercadolivre: "not_synced",
          shopee: "not_synced",
          amazon: "not_synced",
          magalu: "not_synced"
        }
      }
    ];

    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 1000);
  }, []);

  const refetch = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const categories = useMemo(() => {
    const cats = products.map(p => p.category);
    return Array.from(new Set(cats));
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || product.status === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Product];
      let bValue: any = b[sortBy as keyof Product];
      
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredAndSortedProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case "publish":
        setShowChannelPublisher(true);
        break;
      case "export":
        toast({
          title: "Exportação iniciada",
          description: `${selectedProducts.length} produto(s) serão exportados.`,
        });
        break;
      case "delete":
        toast({
          title: "Produtos removidos",
          description: `${selectedProducts.length} produto(s) foram removidos.`,
          variant: "destructive",
        });
        setSelectedProducts([]);
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">Inativo</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Rascunho</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Sem estoque</Badge>;
    } else if (stock < 10) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Baixo estoque</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">{stock} unidades</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar produtos</h3>
          <p className="text-muted-foreground mb-4">Ocorreu um erro ao carregar os produtos.</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total de Produtos</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Produtos Ativos</p>
                <p className="text-2xl font-bold">{products.filter(p => p.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Baixo Estoque</p>
                <p className="text-2xl font-bold">{products.filter(p => p.stock < 10 && p.stock > 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Valor Total</p>
                <p className="text-2xl font-bold">R$ {products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-l-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
              
              <Button onClick={onCreateProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedProducts.length} produto(s) selecionado(s)
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction("publish")}
                  >
                    Publicar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction("export")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction("delete")}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedProducts([])}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Products Table */}
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left">
                    <Checkbox
                      checked={selectedProducts.length === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-4 text-left font-medium">Produto</th>
                  <th className="p-4 text-left font-medium">SKU</th>
                  <th className="p-4 text-left font-medium">Preço</th>
                  <th className="p-4 text-left font-medium">Estoque</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Canais</th>
                  <th className="p-4 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredAndSortedProducts.map((product) => {
                    const isSelected = selectedProducts.includes(product.id);
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                              {product.images && product.images.length > 0 ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{product.sku}</code>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">R$ {product.price.toLocaleString()}</span>
                        </td>
                        <td className="p-4">
                          {getStockBadge(product.stock)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(product.status)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {product.marketplaces && product.marketplaces.length > 0 ? (
                              product.marketplaces.map(marketplace => (
                                <Badge key={marketplace} variant="outline" className="text-xs">
                                  {marketplace === "mercadolivre" ? "ML" : marketplace === "shopee" ? "Shopee" : marketplace}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">Nenhum</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => onEditProduct?.(product)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDuplicateProduct?.(product)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onDeleteProduct?.(product)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Channel Publisher Modal */}
      {showChannelPublisher && (
        <ChannelPublisher
          products={selectedProducts.map(id => filteredAndSortedProducts.find(p => p.id === id)!).filter(Boolean)}
          onClose={() => setShowChannelPublisher(false)}
          onPublish={(results) => {
            const successCount = results.filter(r => r.status === 'success').length;
            const errorCount = results.filter(r => r.status === 'error').length;
            
            toast({
              title: "Publicação concluída",
              description: `${successCount} produto(s) publicado(s) com sucesso${errorCount > 0 ? `, ${errorCount} com erro(s)` : ''}.`,
            });
            setShowChannelPublisher(false);
            setSelectedProducts([]);
          }}
        />
      )}
    </div>
  );
}

// Grid Card Component
interface ProductGridCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

function ProductGridCard({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: ProductGridCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">Inativo</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Rascunho</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Sem estoque</Badge>;
    } else if (stock < 10) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Baixo estoque</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">{stock} unidades</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
          />
          <DropdownMenu>
            <DropdownMenuTrigger>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              width={128}
              height={128}
              className="object-cover w-full h-full"
            />
          ) : (
            <Package className="h-8 w-8 text-gray-400" />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{product.category}</p>
          <code className="bg-gray-100 px-2 py-1 rounded text-xs">{product.sku}</code>
          
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">R$ {product.price.toLocaleString()}</span>
            {getStockBadge(product.stock)}
          </div>
          
          <div className="flex items-center justify-between">
            {getStatusBadge(product.status)}
            <div className="flex space-x-1">
              {product.marketplaces && product.marketplaces.length > 0 ? (
                product.marketplaces.slice(0, 2).map(marketplace => (
                  <Badge key={marketplace} variant="outline" className="text-xs">
                    {marketplace === "mercadolivre" ? "ML" : marketplace === "shopee" ? "Shopee" : marketplace}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Nenhum canal</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
