"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MetricCard } from "@/components/shared/metric-card";
import dynamic from "next/dynamic";
import { MetricsSkeleton } from "@/components/shared/product-skeleton";

// Lazy load ProductMetrics component
const ProductMetrics = dynamic(
  () => import("@/components/dashboard/ProductMetrics"),
  {
    loading: () => <MetricsSkeleton />,
    ssr: false,
  }
);
import { Card, CardContent } from "@/components/shared/card";
import { BarChart3, Download, Filter } from "lucide-react";


export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);
      } catch (error) {
        console.error("Error checking user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="animate-scale-in" style={{animationDelay: '0.1s'}}>
          <MetricCard
            title="Vendas Hoje"
            value="R$ 24.890"
            change="12.5%"
            changeType="positive"
            icon="trending"
            description="vs. R$ 22.150 ontem"
          />
        </div>
        <div className="animate-scale-in" style={{animationDelay: '0.2s'}}>
          <MetricCard
            title="Pedidos"
            value="1.847"
            change="8.2%"
            changeType="positive"
            icon="shopping"
            description="47 novos hoje"
          />
        </div>
        <div className="animate-scale-in" style={{animationDelay: '0.3s'}}>
          <MetricCard
            title="Produtos"
            value="2.156"
            icon="package"
            description="856 sincronizados"
          />
        </div>
        <div className="animate-scale-in" style={{animationDelay: '0.4s'}}>
          <MetricCard
            title="Clientes"
            value="3.241"
            change="15"
            changeType="positive"
            icon="users"
            description="15 novos hoje"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="mb-8">
        {/* Revenue Chart */}
        <div className="card-premium p-8 rounded-2xl card-hover animate-slide-in-left" style={{animationDelay: '0.5s'}}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold gradient-text">Receita dos Últimos 7 Dias</h3>
              <p className="text-muted mt-1">Acompanhe o crescimento diário</p>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-sm btn-animate">7D</button>
              <button className="px-4 py-2 text-sm font-medium text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-300 btn-animate">30D</button>
          <button className="px-4 py-2 text-sm font-medium text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">90D</button>
            </div>
          </div>
          <div className="h-72 flex items-end justify-between space-x-3">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, index) => (
              <div key={day} className="flex flex-col items-center group">
                <div 
                  className="chart-bar w-12 cursor-pointer" 
                  style={{ height: `${35 + (Math.random() * 60)}%` }}
                ></div>
                <span className="text-sm text-muted mt-3 font-medium">{day}</span>
              </div>
            ))}
          </div>
        </div>
        

      </div>

      {/* Product Metrics */}
      <div className="mb-8">
        <ProductMetrics />
      </div>

      {/* Activity Table */}
      <div className="card-premium rounded-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-surface bg-gradient-to-r from-card-theme to-surface">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-primary">Atividade Recente</h3>
          <p className="text-muted mt-1">Últimas transações e sincronizações</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-sm font-medium text-muted hover:text-primary border border-surface rounded-lg hover:border-primary transition-colors flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filtrar</span>
              </button>
              <button className="px-4 py-2 text-sm font-medium text-muted hover:text-primary border border-surface rounded-lg hover:border-primary transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Cliente</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Produto</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Valor</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Data</th>
            <th className="px-8 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-gray-100">
              <tr className="hover:bg-primary/5 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <span className="text-primary-foreground font-bold text-sm">MS</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">Maria Santos</p>
              <p className="text-sm text-muted">maria@email.com</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 text-sm font-medium text-primary">iPhone 15 Pro Max 256GB</td>
                <td className="px-6 py-6">
                  <span className="status-badge bg-green-100 text-green-800">Entregue</span>
                </td>
                <td className="px-6 py-6 text-sm font-bold text-primary">R$ 8.999,00</td>
                <td className="px-6 py-6 text-sm text-muted">Hoje, 14:30</td>
                <td className="px-8 py-6 text-right">
                  <button className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">Ver detalhes</button>
                </td>
              </tr>
              <tr className="hover:bg-primary/5 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <span className="text-primary-foreground font-bold text-sm">CL</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">Carlos Lima</p>
                    <p className="text-sm text-muted">carlos@email.com</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 text-sm font-medium text-primary">MacBook Air M3 512GB</td>
                <td className="px-6 py-6">
                  <span className="status-badge bg-yellow-100 text-yellow-800">Processando</span>
                </td>
                <td className="px-6 py-6 text-sm font-bold text-primary">R$ 12.999,00</td>
                <td className="px-6 py-6 text-sm text-muted">Ontem, 16:45</td>
                <td className="px-8 py-6 text-right">
                  <button className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">Ver detalhes</button>
                </td>
              </tr>
              <tr className="hover:bg-primary/5 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <span className="text-primary-foreground font-bold text-sm">AC</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">Ana Costa</p>
                    <p className="text-sm text-muted">ana@email.com</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 text-sm font-medium text-primary">iPad Pro 12.9 inch 1TB</td>
                <td className="px-6 py-6">
                  <span className="status-badge bg-blue-100 text-blue-800">Enviado</span>
                </td>
                <td className="px-6 py-6 text-sm font-bold text-primary">R$ 7.499,00</td>
                <td className="px-6 py-6 text-sm text-muted">2 dias atrás</td>
                <td className="px-8 py-6 text-right">
                  <button className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">Ver detalhes</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
