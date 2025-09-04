"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/shared/skeleton";
import { Card, CardContent, CardHeader } from "@/components/shared/card";
import { RefreshCw, Package, BarChart3, Users, ShoppingCart } from "lucide-react";

// Enhanced loading spinner with icon
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  icon?: React.ComponentType<{ className?: string }>;
  text?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  icon: Icon = RefreshCw, 
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center gap-3"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Icon className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && (
        <motion.p 
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
}

// Page loading skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Chart skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// Table loading skeleton
export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Table header */}
      <div className="flex space-x-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div 
          key={i}
          className="flex space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          {Array.from({ length: 6 }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// Chart loading skeleton
export function ChartLoadingSkeleton() {
  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="relative">
        <Skeleton className="h-64 w-full" />
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
        >
          <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// Product grid loading skeleton
export function ProductGridLoadingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Navigation loading
export function NavigationLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner 
        size="lg" 
        icon={Package} 
        text="Carregando página..."
      />
    </div>
  );
}

// Data fetching loading states
export const LoadingStates = {
  Products: () => <LoadingSpinner icon={Package} text="Carregando produtos..." />,
  Orders: () => <LoadingSpinner icon={ShoppingCart} text="Carregando pedidos..." />,
  Customers: () => <LoadingSpinner icon={Users} text="Carregando clientes..." />,
  Dashboard: () => <LoadingSpinner icon={BarChart3} text="Carregando dashboard..." />,
  Charts: () => <ChartLoadingSkeleton />,
  Table: (rows?: number) => <TableLoadingSkeleton rows={rows} />,
  ProductGrid: (count?: number) => <ProductGridLoadingSkeleton count={count} />,
  Page: () => <PageLoadingSkeleton />,
  Navigation: () => <NavigationLoadingSkeleton />
};
