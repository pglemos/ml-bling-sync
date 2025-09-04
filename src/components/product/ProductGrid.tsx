"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid, List, Plus } from "lucide-react";
import { Button } from "@/components/shared/button";
import { Skeleton } from "@/components/shared/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/shared/toggle-group";
import { ProductCard, Product } from "./ProductCard";
import { ProductFilters, FilterState } from "./ProductFilters";
import { ProductGridSkeleton } from "@/components/shared/product-skeleton";
import { VirtualScroll } from "@/components/shared/virtual-scroll";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onCreateProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onDuplicateProduct?: (product: Product) => void;
  onViewProductDetails?: (product: Product) => void;
  onExportCSV?: () => void;
  className?: string;
}

type ViewMode = "grid" | "list";

const ITEMS_PER_PAGE = 24;

export const ProductGrid = React.memo(function ProductGrid({
  products,
  isLoading = false,
  onCreateProduct,
  onEditProduct,
  onDuplicateProduct,
  onViewProductDetails,
  onExportCSV,
  className,
}: ProductGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "",
    status: "",
    marketplace: "",
    priceRange: { min: null, max: null },
    stockRange: { min: null, max: null },
  });

  // Extract unique categories and marketplaces from products
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return Array.from(cats).sort();
  }, [products]);

  const marketplaces = useMemo(() => {
    const markets = new Set(
      products.flatMap((p) => p.marketplaces.map((m) => m.name))
    );
    return Array.from(markets).sort();
  }, [products]);

  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Status filter
      if (filters.status && product.status !== filters.status) {
        return false;
      }

      // Marketplace filter
      if (filters.marketplace) {
        const hasMarketplace = product.marketplaces.some(
          (m) => m.name === filters.marketplace
        );
        if (!hasMarketplace) return false;
      }

      // Price range filter
      if (filters.priceRange.min !== null && product.price < filters.priceRange.min) {
        return false;
      }
      if (filters.priceRange.max !== null && product.price > filters.priceRange.max) {
        return false;
      }

      // Stock range filter
      if (filters.stockRange.min !== null && product.stock < filters.stockRange.min) {
        return false;
      }
      if (filters.stockRange.max !== null && product.stock > filters.stockRange.max) {
        return false;
      }

      return true;
    });
  }, [products, filters]);

  // Paginate filtered products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // Reset to first page when filters change
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handleExportCSV = useCallback(() => {
    if (onExportCSV) {
      onExportCSV();
    } else {
      // Default CSV export implementation
      const csvContent = [
        ["SKU", "Nome", "Categoria", "Preço", "Estoque", "Status"].join(","),
        ...filteredProducts.map((product) =>
          [
            product.sku,
            `"${product.name}"`,
            product.category,
            product.price,
            product.stock,
            product.status,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `produtos_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [filteredProducts, onExportCSV]);



  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Produtos</h2>
          <p className="text-muted-foreground">
            {isLoading ? (
              "Carregando produtos..."
            ) : (
              `${filteredProducts.length} produto${filteredProducts.length !== 1 ? "s" : ""} encontrado${filteredProducts.length !== 1 ? "s" : ""}`
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
            className="border rounded-lg p-1"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Create Product Button */}
          <Button onClick={onCreateProduct} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ProductFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onExportCSV={handleExportCSV}
        categories={categories}
        marketplaces={marketplaces}
        isLoading={isLoading}
      />

      {/* Products Grid/List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProductGridSkeleton 
               count={ITEMS_PER_PAGE} 
               viewMode={viewMode}
               className={cn(
                 viewMode === "grid"
                   ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                   : ""
               )}
             />
          </motion.div>
        ) : paginatedProducts.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Grid className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-muted-foreground mb-6">
              {filters.search || filters.category || filters.status
                ? "Tente ajustar os filtros para encontrar produtos."
                : "Comece criando seu primeiro produto."}
            </p>
            <Button onClick={onCreateProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Produto
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key={`${viewMode}-${currentPage}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {paginatedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ProductCard
                      product={product}
                      onEdit={onEditProduct}
                      onDuplicate={onDuplicateProduct}
                      onViewDetails={onViewProductDetails}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <VirtualScroll
                items={paginatedProducts}
                itemHeight={120}
                containerHeight={600}
                renderItem={(product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="mb-4"
                  >
                    <ProductCard
                      product={product}
                      onEdit={onEditProduct}
                      onDuplicate={onDuplicateProduct}
                      onViewDetails={onViewProductDetails}
                      className="w-full"
                    />
                  </motion.div>
                )}
                className="space-y-4"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                  className="w-8 h-8 p-0"
                >
                  {pageNumber}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="px-2 text-muted-foreground">...</span>
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-8 h-8 p-0"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
});
