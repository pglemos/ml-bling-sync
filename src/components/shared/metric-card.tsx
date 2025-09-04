import { Card, CardContent } from "@/components/shared/card";
import { TrendingUp, ShoppingBag, Package, Users } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative";
  icon: React.ReactNode;
  description?: string;
}

const iconMap = {
  trending: TrendingUp,
  shopping: ShoppingBag,
  package: Package,
  users: Users
};

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = "positive", 
  icon = "trending",
  description 
}: MetricCardProps) {
  const Icon = iconMap[icon as keyof typeof iconMap] || TrendingUp;
  
  const changeColor = changeType === "positive" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";
  
  return (
    <Card className="card-premium p-6 rounded-2xl card-hover transition-all duration-300 hover:shadow-xl group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-110">
          <Icon className="w-6 h-6 text-white transition-transform duration-300 group-hover:rotate-12" />
        </div>
        {change && (
          <span className={`text-xs font-semibold ${changeColor} px-2 py-1 rounded-full transition-all duration-300 group-hover:scale-105 animate-pulse`}>
            {changeType === "positive" ? "+" : ""}{change}
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wide transition-colors duration-300 group-hover:text-primary">{title}</h3>
      <p className="text-3xl font-bold gradient-text mt-2 transition-all duration-300 group-hover:scale-105">{value}</p>
      {description && (
        <p className="text-sm text-muted mt-2 transition-colors duration-300 group-hover:text-muted">{description}</p>
      )}
    </Card>
  );
}
