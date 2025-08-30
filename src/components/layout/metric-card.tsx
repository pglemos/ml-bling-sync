import { Card, CardContent } from "@/components/ui/card";
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
  icon: "trending",
  description 
}: MetricCardProps) {
  const Icon = iconMap[icon as keyof typeof iconMap] || TrendingUp;
  
  const changeColor = changeType === "positive" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";
  
  return (
    <Card className="card-premium p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <span className={`text-xs font-semibold ${changeColor} px-2 py-1 rounded-full`}>
            {changeType === "positive" ? "+" : ""}{change}
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
      <p className="text-3xl font-bold metric-number mt-2">{value}</p>
      {description && (
        <p className="text-sm text-gray-500 mt-2">{description}</p>
      )}
    </Card>
  );
}
