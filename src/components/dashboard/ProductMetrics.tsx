"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Eye,
  RefreshCw,
  Download
} from "lucide-react";
import { motion } from "framer-motion";

// Lazy load heavy chart components
const BarChart = dynamic(() => import("recharts").then(mod => ({ default: mod.BarChart })), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded" />
});
const Bar = dynamic(() => import("recharts").then(mod => ({ default: mod.Bar })));
const XAxis = dynamic(() => import("recharts").then(mod => ({ default: mod.XAxis })));
const YAxis = dynamic(() => import("recharts").then(mod => ({ default: mod.YAxis })));
const CartesianGrid = dynamic(() => import("recharts").then(mod => ({ default: mod.CartesianGrid })));
const Tooltip = dynamic(() => import("recharts").then(mod => ({ default: mod.Tooltip })));
const ResponsiveContainer = dynamic(() => import("recharts").then(mod => ({ default: mod.ResponsiveContainer })));
const PieChart = dynamic(() => import("recharts").then(mod => ({ default: mod.PieChart })), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded" />
});
const Pie = dynamic(() => import("recharts").then(mod => ({ default: mod.Pie })));
const Cell = dynamic(() => import("recharts").then(mod => ({ default: mod.Cell })));

interface ProductMetricsProps {
  totalProducts?: number;
  syncedCount?: number;
  outOfStockCount?: number;
  nonPublishedCount?: number;
  stockByCategory?: Array<{ category: string; stock: number; products: number }>;
  marketplaceSync?: Array<{ marketplace: string; synced: number; total: number }>;
}

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  destructive: "hsl(var(--destructive))",
  warning: "hsl(var(--warning))"
};

const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.muted];

export default function ProductMetrics({
  totalProducts = 156,
  syncedCount = 142,
  outOfStockCount = 8,
  nonPublishedCount = 14,
  stockByCategory = [
    { category: "Eletrônicos", stock: 245, products: 45 },
    { category: "Informática", stock: 189, products: 32 },
    { category: "Áudio", stock: 156, products: 28 },
    { category: "Wearables", stock: 98, products: 18 },
    { category: "Tablets", stock: 67, products: 15 },
    { category: "Acessórios", stock: 234, products: 18 }
  ],
  marketplaceSync = [
    { marketplace: "Mercado Livre", synced: 89, total: 120 },
    { marketplace: "Shopee", synced: 67, total: 95 },
    { marketplace: "Amazon", synced: 45, total: 78 },
    { marketplace: "Magalu", synced: 34, total: 56 }
  ]
}: ProductMetricsProps) {
  const syncPercentage = Math.round((syncedCount / totalProducts) * 100);
  const lowStockPercentage = Math.round((outOfStockCount / totalProducts) * 100);

  const pieData = [
    { name: "Sincronizados", value: syncedCount, color: COLORS.primary },
    { name: "Não Publicados", value: nonPublishedCount, color: COLORS.warning },
    { name: "Sem Estoque", value: outOfStockCount, color: COLORS.destructive },
    { name: "Outros", value: totalProducts - syncedCount - nonPublishedCount - outOfStockCount, color: COLORS.muted }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Métricas de Produtos</h2>
          <p className="text-muted-foreground">Visão geral do seu catálogo e sincronização</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                +12% em relação ao mês passado
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sincronizados</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{syncedCount}</div>
              <p className="text-xs text-muted-foreground">
                {syncPercentage}% do total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
              <p className="text-xs text-muted-foreground">
                {lowStockPercentage}% do total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Não Publicados</CardTitle>
              <Eye className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{nonPublishedCount}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando publicação
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Stock by Category Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Estoque por Categoria</CardTitle>
              <CardDescription>
                Distribuição de estoque entre as categorias de produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stockByCategory}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="category" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar 
                    dataKey="stock" 
                    fill={COLORS.primary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Product Status Distribution */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Status dos Produtos</CardTitle>
              <CardDescription>
                Distribuição dos produtos por status de sincronização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Marketplace Sync Status */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Status de Sincronização por Marketplace</CardTitle>
            <CardDescription>
              Progresso da sincronização em cada marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketplaceSync.map((marketplace) => {
                const percentage = Math.round((marketplace.synced / marketplace.total) * 100);
                return (
                  <div key={marketplace.marketplace} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{marketplace.marketplace}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {marketplace.synced}/{marketplace.total}
                        </span>
                        <Badge variant={percentage >= 80 ? "default" : percentage >= 50 ? "secondary" : "destructive"}>
                          {percentage}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <motion.div 
                        className="bg-primary h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
