"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MetricCard } from "@/components/layout/metric-card";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, RefreshCw, Upload, Download, Filter, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          router.push("/login");
        } else {
          setUser(session.user);
          setLoading(false);
        }
      }
    );

    checkUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Vendas Hoje"
          value="R$ 24.890"
          change="12.5%"
          changeType="positive"
          icon="trending"
          description="vs. R$ 22.150 ontem"
        />
        <MetricCard
          title="Pedidos"
          value="1.847"
          change="8.2%"
          changeType="positive"
          icon="shopping"
          description="47 novos hoje"
        />
        <MetricCard
          title="Produtos"
          value="2.156"
          icon="package"
          description="856 sincronizados"
        />
        <MetricCard
          title="Clientes"
          value="3.241"
          change="15"
          changeType="positive"
          icon="users"
          description="15 novos hoje"
        />
      </div>

      {/* Charts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card-premium p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Receita dos Últimos 7 Dias</h3>
              <p className="text-gray-500 mt-1">Acompanhe o crescimento diário</p>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm">7D</button>
              <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">30D</button>
              <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">90D</button>
            </div>
          </div>
          <div className="h-72 flex items-end justify-between space-x-3">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, index) => (
              <div key={day} className="flex flex-col items-center group">
                <div 
                  className="chart-bar w-12 cursor-pointer" 
                  style={{ height: `${35 + (Math.random() * 60)}%` }}
                ></div>
                <span className="text-sm text-gray-500 mt-3 font-medium">{day}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="card-premium p-8 rounded-2xl">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Ações Rápidas</h3>
          <div className="space-y-4">
            <button className="w-full flex items-center p-4 text-left bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl transition-all duration-300 border border-green-100 hover:border-green-200">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Sincronizar Produtos</p>
                <p className="text-sm text-gray-600">ML  Bling automático</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
            </button>
            
            <button className="w-full flex items-center p-4 text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl transition-all duration-300 border border-blue-100 hover:border-blue-200">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Importar Planilha</p>
                <p className="text-sm text-gray-600">Upload em lote CSV/Excel</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
            </button>
            
            <button className="w-full flex items-center p-4 text-left bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl transition-all duration-300 border border-purple-100 hover:border-purple-200">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Exportar Relatório</p>
                <p className="text-sm text-gray-600">Dados completos PDF/Excel</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
            </button>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="card-premium rounded-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Atividade Recente</h3>
              <p className="text-gray-500 mt-1">Últimas transações e sincronizações</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filtrar</span>
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Data</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <span className="text-white font-bold text-sm">MS</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Maria Santos</p>
                      <p className="text-sm text-gray-500">maria@email.com</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 text-sm font-medium text-gray-900">iPhone 15 Pro Max 256GB</td>
                <td className="px-6 py-6">
                  <span className="status-badge bg-green-100 text-green-800">Entregue</span>
                </td>
                <td className="px-6 py-6 text-sm font-bold text-gray-900">R$ 8.999,00</td>
                <td className="px-6 py-6 text-sm text-gray-500">Hoje, 14:30</td>
                <td className="px-8 py-6 text-right">
                  <button className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">Ver detalhes</button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <span className="text-white font-bold text-sm">CL</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Carlos Lima</p>
                      <p className="text-sm text-gray-500">carlos@email.com</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 text-sm font-medium text-gray-900">MacBook Air M3 512GB</td>
                <td className="px-6 py-6">
                  <span className="status-badge bg-yellow-100 text-yellow-800">Processando</span>
                </td>
                <td className="px-6 py-6 text-sm font-bold text-gray-900">R$ 12.999,00</td>
                <td className="px-6 py-6 text-sm text-gray-500">Ontem, 16:45</td>
                <td className="px-8 py-6 text-right">
                  <button className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">Ver detalhes</button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <span className="text-white font-bold text-sm">AC</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Ana Costa</p>
                      <p className="text-sm text-gray-500">ana@email.com</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6 text-sm font-medium text-gray-900">iPad Pro 12.9&quot; 1TB</td>
                <td className="px-6 py-6">
                  <span className="status-badge bg-blue-100 text-blue-800">Enviado</span>
                </td>
                <td className="px-6 py-6 text-sm font-bold text-gray-900">R$ 7.499,00</td>
                <td className="px-6 py-6 text-sm text-gray-500">2 dias atrás</td>
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
