"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/shared/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shared/dropdown-menu";
import {
  Edit,
  Copy,
  MoreVertical,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  images: string[];
  status: "active" | "inactive" | "out_of_stock" | "pending";
  marketplaces: {
    name: string;
    logo: string;
    status: "synced" | "pending" | "error";
  }[];
  description?: string;
}

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  className?: string;
}

const statusConfig = {
  active: {
    label: "Ativo",
    variant: "default" as const,
    icon: CheckCircle,
    color: "text-green-600",
  },
  inactive: {
    label: "Inativo",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-muted",
  },
  out_of_stock: {
    label: "Sem Estoque",
    variant: "destructive" as const,
    icon: AlertTriangle,
    color: "text-red-600",
  },
  pending: {
    label: "Pendente",
    variant: "outline" as const,
    icon: Clock,
    color: "text-yellow-600",
  },
};

export const ProductCard = React.memo(function ProductCard({
  product,
  onEdit,
  onDuplicate,
  onViewDetails,
  className,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const statusInfo = statusConfig[product.status];
  const StatusIcon = statusInfo.icon;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return "text-red-600";
    if (stock < 10) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("group", className)}
    >
      <Card 
        className="h-full overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
        role="article"
        aria-label={`Produto ${product.name}`}
      >
        <CardHeader className="p-0 relative">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden bg-muted rounded-t-lg">
            {product.images.length > 0 && !imageError ? (
              <Image
                src={product.images[0]}
                alt={`Imagem do produto ${product.name}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 bg-muted-foreground/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm">Sem imagem</p>
                </div>
              </div>
            )}

            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                <StatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </Badge>
            </div>

            {/* Marketplace Badges */}
            {product.marketplaces.length > 0 && (
              <div className="absolute top-3 right-3 flex gap-1">
                {product.marketplaces.slice(0, 3).map((marketplace, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border shadow-sm flex items-center justify-center"
                    title={`${marketplace.name} - ${marketplace.status}`}
                  >
                    <Image
                      src={marketplace.logo}
                      alt={marketplace.name}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  </div>
                ))}
                {product.marketplaces.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border shadow-sm flex items-center justify-center text-xs font-medium">
                    +{product.marketplaces.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-surface/90 hover:bg-surface text-primary backdrop-blur-sm"
                  onClick={() => onEdit?.(product)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-surface/90 hover:bg-surface text-primary backdrop-blur-sm"
                  onClick={() => onViewDetails?.(product)}
                  aria-label={`Ver detalhes do produto ${product.name}`}
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 flex-1">
          {/* Product Name */}
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-brand transition-colors" id={`product-name-${product.id}`}>
            {product.name}
          </h3>

          {/* SKU and Category */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
              {product.sku}
            </span>
            <span className="truncate ml-2">{product.category}</span>
          </div>

          {/* Price */}
          <div className="text-2xl font-bold text-price mb-2">
            {formatPrice(product.price)}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Estoque:</span>
            <span className={cn("text-sm font-medium", getStockColor(product.stock))}>
              {product.stock} unidades
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(product)}
            className="flex-1 mr-2"
            aria-label={`Editar produto ${product.name}`}
          >
            <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
            Editar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
              aria-label={`Mais ações para ${product.name}`}
            >
              <MoreVertical className="w-4 h-4" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent aria-label="Menu de ações do produto">
              <DropdownMenuItem 
                onClick={() => onDuplicate?.(product)}
                aria-label={`Duplicar produto ${product.name}`}
              >
                <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onViewDetails?.(product)}
                aria-label={`Ver detalhes do produto ${product.name}`}
              >
                <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
                Ver Detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
    </motion.div>
  );
});
