"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDebouncedSearch } from "@/hooks/useDebounce";
import { Search, Filter, X, Download } from "lucide-react";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/select";
import { Badge } from "@/components/shared/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shared/popover";
import { Separator } from "@/components/shared/separator";

export interface FilterState {
  search: string;
  category: string;
  status: string;
  marketplace: string;
  priceRange: {
    min: number | null;
    max: number | null;
  };
  stockRange: {
    min: number | null;
    max: number | null;
  };
}

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onExportCSV: () => void;
  categories: string[];
  marketplaces: string[];
  isLoading?: boolean;
}

export function ProductFilters({
  filters,
  onFiltersChange,
  onExportCSV,
  categories,
  marketplaces,
  isLoading = false,
}: ProductFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { searchValue, debouncedSearchValue, setSearchValue } = useDebouncedSearch(filters.search, 300);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  useEffect(() => {
    if (debouncedSearchValue !== filters.search) {
      onFiltersChange({
        ...filters,
        search: debouncedSearchValue,
      });
    }
  }, [debouncedSearchValue, filters, onFiltersChange]);

  useEffect(() => {
    if (searchValue !== filters.search) {
      setSearchValue(filters.search);
    }
  }, [filters.search, searchValue, setSearchValue]);

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      category: "",
      status: "",
      marketplace: "",
      priceRange: { min: null, max: null },
      stockRange: { min: null, max: null },
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.status) count++;
    if (filters.marketplace) count++;
    if (filters.priceRange.min !== null || filters.priceRange.max !== null) count++;
    if (filters.stockRange.min !== null || filters.stockRange.max !== null) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Search and Main Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
          <Input
            placeholder="Buscar produtos por nome, SKU ou categoria..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 h-11"
            data-search-input
            aria-label="Campo de busca de produtos"
            role="searchbox"
          />
        </div>

        {/* Filter Button */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-11 relative">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtros</h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <Separator />

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => updateFilter("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => updateFilter("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="out_of_stock">Sem Estoque</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Marketplace Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Marketplace</label>
                <Select
                  value={filters.marketplace}
                  onValueChange={(value) => updateFilter("marketplace", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os marketplaces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os marketplaces</SelectItem>
                    {marketplaces.map((marketplace) => (
                      <SelectItem key={marketplace} value={marketplace}>
                        {marketplace}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Faixa de Preço (R$)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mín"
                    value={filters.priceRange.min || ""}
                    onChange={(e) =>
                      updateFilter("priceRange", {
                        ...filters.priceRange,
                        min: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Máx"
                    value={filters.priceRange.max || ""}
                    onChange={(e) =>
                      updateFilter("priceRange", {
                        ...filters.priceRange,
                        max: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>

              {/* Stock Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Faixa de Estoque</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mín"
                    value={filters.stockRange.min || ""}
                    onChange={(e) =>
                      updateFilter("stockRange", {
                        ...filters.stockRange,
                        min: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Máx"
                    value={filters.stockRange.max || ""}
                    onChange={(e) =>
                      updateFilter("stockRange", {
                        ...filters.stockRange,
                        max: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Export CSV Button */}
        <Button
          variant="outline"
          onClick={onExportCSV}
          disabled={isLoading}
          className="h-11"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Categoria: {filters.category}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilter("category", "")}
              />
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilter("status", "")}
              />
            </Badge>
          )}
          {filters.marketplace && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Marketplace: {filters.marketplace}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilter("marketplace", "")}
              />
            </Badge>
          )}
          {(filters.priceRange.min !== null || filters.priceRange.max !== null) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Preço: R$ {filters.priceRange.min || 0} - R$ {filters.priceRange.max || "∞"}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilter("priceRange", { min: null, max: null })}
              />
            </Badge>
          )}
          {(filters.stockRange.min !== null || filters.stockRange.max !== null) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Estoque: {filters.stockRange.min || 0} - {filters.stockRange.max || "∞"}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilter("stockRange", { min: null, max: null })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
