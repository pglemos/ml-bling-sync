"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/card';
import { Button } from '@/components/shared/button';
import { Badge } from '@/components/shared/badge';
import { Progress } from '@/components/shared/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/select';
import { Input } from '@/components/shared/input';
import { Label } from '@/components/shared/label';
import { Separator } from '@/components/shared/separator';
// Removed ScrollArea import - using native overflow
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart3,
  Activity,
  Zap,
  Calendar,
  Filter
} from 'lucide-react';

interface SyncJob {
  id: string;
  integration_id: string;
  integration_name?: string;
  sync_type: 'products' | 'inventory' | 'orders';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  progress: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  result?: any;
  error_message?: string;
}

interface QueueStats {
  total_jobs: number;
  queued_jobs: number;
  running_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  workers_active: number;
  avg_processing_time: number;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status: string;
}

const SyncDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [selectedSyncType, setSelectedSyncType] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('normal');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch data functions
  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedIntegration) params.append('integration_id', selectedIntegration);
      if (selectedSyncType) params.append('sync_type', selectedSyncType);
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await fetch(`/api/sync/jobs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/sync/queue/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchJobs(), fetchStats(), fetchIntegrations()]);
    setLoading(false);
  };

  // Auto refresh
  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedIntegration, selectedSyncType, filterStatus]);

  // Create sync job
  const createSyncJob = async () => {
    if (!selectedIntegration || !selectedSyncType) {
      alert('Por favor, selecione uma integração e tipo de sincronização');
      return;
    }

    try {
      const response = await fetch('/api/sync/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integration_id: selectedIntegration,
          sync_type: selectedSyncType,
          priority: selectedPriority,
        }),
      });

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(`Erro ao criar job: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error creating sync job:', error);
      alert('Erro ao criar job de sincronização');
    }
  };

  // Cancel sync job
  const cancelSyncJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/sync/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(`Erro ao cancelar job: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error cancelling sync job:', error);
      alert('Erro ao cancelar job');
    }
  };

  // Quick sync
  const quickSync = async (integrationId: string, syncType: string) => {
    try {
      const response = await fetch(`/api/sync/integrations/${integrationId}/sync/${syncType}`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchData();
      } else {
        const error = await response.json();
        alert(`Erro ao iniciar sincronização: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error starting quick sync:', error);
      alert('Erro ao iniciar sincronização rápida');
    }
  };

  // Status badge component
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const variants: Record<string, { variant: any; icon: React.ReactNode }> = {
      queued: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      running: { variant: 'default', icon: <Activity className="w-3 h-3" /> },
      completed: { variant: 'success', icon: <CheckCircle className="w-3 h-3" /> },
      failed: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
      cancelled: { variant: 'outline', icon: <Square className="w-3 h-3" /> },
    };

    const config = variants[status] || variants.queued;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.toUpperCase()}
      </Badge>
    );
  };

  // Priority badge component
  const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || colors.normal}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Sincronização</h1>
          <p className="text-muted-foreground">Gerencie e monitore jobs de sincronização</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto Refresh
          </Button>
          <Button onClick={fetchData} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Jobs</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_jobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Na Fila</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.queued_jobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Executando</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.running_jobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workers Ativos</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.workers_active}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Jobs de Sincronização</TabsTrigger>
          <TabsTrigger value="create">Criar Job</TabsTrigger>
        </TabsList>

        {/* Jobs List Tab */}
        <TabsContent value="jobs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="filter-integration">Integração</Label>
                  <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as integrações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as integrações</SelectItem>
                      {integrations.map((integration) => (
                        <SelectItem key={integration.id} value={integration.id}>
                          {integration.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filter-type">Tipo de Sincronização</Label>
                  <Select value={selectedSyncType} onValueChange={setSelectedSyncType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os tipos</SelectItem>
                      <SelectItem value="products">Produtos</SelectItem>
                      <SelectItem value="inventory">Inventário</SelectItem>
                      <SelectItem value="orders">Pedidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filter-status">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      <SelectItem value="queued">Na Fila</SelectItem>
                      <SelectItem value="running">Executando</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs List */}
          <Card>
            <CardHeader>
              <CardTitle>Jobs de Sincronização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto">
                <div className="space-y-4">
                  {jobs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum job encontrado
                    </div>
                  ) : (
                    jobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <StatusBadge status={job.status} />
                            <PriorityBadge priority={job.priority} />
                            <span className="font-medium">
                              {job.integration_name || job.integration_id}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {job.sync_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {job.status === 'running' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelSyncJob(job.id)}
                              >
                                <Square className="w-4 h-4 mr-1" />
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>

                        {job.status === 'running' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progresso</span>
                              <span>{job.progress}%</span>
                            </div>
                            <Progress value={job.progress} className="w-full" />
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Criado:</span>
                            <div>{new Date(job.created_at).toLocaleString('pt-BR')}</div>
                          </div>
                          {job.started_at && (
                            <div>
                              <span className="text-muted-foreground">Iniciado:</span>
                              <div>{new Date(job.started_at).toLocaleString('pt-BR')}</div>
                            </div>
                          )}
                          {job.completed_at && (
                            <div>
                              <span className="text-muted-foreground">Concluído:</span>
                              <div>{new Date(job.completed_at).toLocaleString('pt-BR')}</div>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">ID:</span>
                            <div className="font-mono text-xs">{job.id.slice(0, 8)}...</div>
                          </div>
                        </div>

                        {job.error_message && (
                          <div className="bg-red-50 border border-red-200 rounded p-3">
                            <div className="flex items-center gap-2 text-red-800">
                              <AlertCircle className="w-4 h-4" />
                              <span className="font-medium">Erro:</span>
                            </div>
                            <div className="text-red-700 text-sm mt-1">{job.error_message}</div>
                          </div>
                        )}

                        {job.result && job.status === 'completed' && (
                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            <div className="flex items-center gap-2 text-green-800">
                              <CheckCircle className="w-4 h-4" />
                              <span className="font-medium">Resultado:</span>
                            </div>
                            <div className="text-green-700 text-sm mt-1">
                              {JSON.stringify(job.result, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Job Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Job de Sincronização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-integration">Integração</Label>
                  <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma integração" />
                    </SelectTrigger>
                    <SelectContent>
                      {integrations.map((integration) => (
                        <SelectItem key={integration.id} value={integration.id}>
                          {integration.name} ({integration.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="create-type">Tipo de Sincronização</Label>
                  <Select value={selectedSyncType} onValueChange={setSelectedSyncType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="products">Produtos</SelectItem>
                      <SelectItem value="inventory">Inventário</SelectItem>
                      <SelectItem value="orders">Pedidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="create-priority">Prioridade</Label>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <Button onClick={createSyncJob} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Criar Job de Sincronização
              </Button>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default SyncDashboard;
