import React, { useState, useEffect } from 'react';
import { BlingConnector, SKUMapping, SKUReconciliationResult } from '../connectors/bling/BlingConnector';

interface SKUMappingManagerProps {
  connector: BlingConnector;
  onMappingUpdate?: () => void;
}

interface PendingMapping {
  supplier_sku: string;
  suggested_master_sku: string;
  confidence_score: number;
  custom_master_sku?: string;
}

export const SKUMappingManager: React.FC<SKUMappingManagerProps> = ({ 
  connector, 
  onMappingUpdate 
}) => {
  const [reconciliationData, setReconciliationData] = useState<SKUReconciliationResult | null>(null);
  const [pendingMappings, setPendingMappings] = useState<PendingMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'mapped' | 'conflicts'>('pending');
  const [bulkMappings, setBulkMappings] = useState<string>('');

  useEffect(() => {
    loadReconciliationData();
  }, []);

  const loadReconciliationData = async () => {
    setLoading(true);
    try {
      const data = await connector.getSKUReconciliationReport();
      setReconciliationData(data);
      
      // Load pending mappings with suggestions
      const pending = await Promise.all(
        data.pending.map(async (sku) => {
          const suggestion = await connector.attemptAutoMapping(sku);
          return {
            supplier_sku: sku,
            suggested_master_sku: suggestion.master_sku,
            confidence_score: suggestion.confidence_score
          };
        })
      );
      setPendingMappings(pending);
    } catch (error) {
      console.error('Failed to load reconciliation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMapping = async (supplierSku: string, masterSku: string) => {
    try {
      await connector.createManualMapping(supplierSku, masterSku);
      await loadReconciliationData();
      onMappingUpdate?.();
    } catch (error) {
      console.error('Failed to create mapping:', error);
    }
  };

  const handleBulkMappings = async () => {
    try {
      const mappings = bulkMappings
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [supplier_sku, master_sku] = line.split(',').map(s => s.trim());
          return { supplier_sku, master_sku };
        })
        .filter(mapping => mapping.supplier_sku && mapping.master_sku);
      
      await connector.bulkCreateMappings(mappings);
      setBulkMappings('');
      await loadReconciliationData();
      onMappingUpdate?.();
    } catch (error) {
      console.error('Failed to create bulk mappings:', error);
    }
  };

  const updateCustomMasterSku = (supplierSku: string, customSku: string) => {
    setPendingMappings(prev => 
      prev.map(mapping => 
        mapping.supplier_sku === supplierSku 
          ? { ...mapping, custom_master_sku: customSku }
          : mapping
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando dados de reconciliação...</span>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary mb-2">Gerenciamento de Mapeamento de SKUs</h2>
        <p className="text-muted">
          Gerencie o mapeamento entre SKUs do fornecedor e SKUs mestres para sincronização precisa.
        </p>
      </div>

      {/* Statistics */}
      {reconciliationData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{reconciliationData.mapped.length}</div>
            <div className="text-sm text-green-700">SKUs Mapeados</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{reconciliationData.pending.length}</div>
            <div className="text-sm text-yellow-700">Pendentes</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{reconciliationData.conflicts.length}</div>
            <div className="text-sm text-red-700">Conflitos</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-surface mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'pending', label: 'Pendentes', count: reconciliationData?.pending.length || 0 },
            { id: 'mapped', label: 'Mapeados', count: reconciliationData?.mapped.length || 0 },
            { id: 'conflicts', label: 'Conflitos', count: reconciliationData?.conflicts.length || 0 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-muted hover:text-primary hover:border-surface'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Pending Mappings Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">SKUs Pendentes de Mapeamento</h3>
            <button
              onClick={loadReconciliationData}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Atualizar
            </button>
          </div>
          
          {pendingMappings.length === 0 ? (
            <div className="text-center py-8 text-muted">
              Nenhum SKU pendente de mapeamento
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMappings.map(mapping => (
                <div key={mapping.supplier_sku} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-primary">
                        SKU Fornecedor: {mapping.supplier_sku}
                      </div>
                      <div className="text-sm text-muted">
                        Sugestão: {mapping.suggested_master_sku} 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          mapping.confidence_score > 0.8 
                            ? 'bg-green-100 text-green-800'
                            : mapping.confidence_score > 0.6
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(mapping.confidence_score * 100)}% confiança
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="SKU Master personalizado"
                        value={mapping.custom_master_sku || ''}
                        onChange={(e) => updateCustomMasterSku(mapping.supplier_sku, e.target.value)}
                        className="px-3 py-1 border border-surface rounded-md bg-surface text-sm"
                      />
                      <button
                        onClick={() => handleCreateMapping(
                          mapping.supplier_sku, 
                          mapping.custom_master_sku || mapping.suggested_master_sku
                        )}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        Mapear
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bulk Mapping */}
          <div className="mt-8 border-t pt-6">
            <h4 className="text-md font-medium mb-3">Mapeamento em Lote</h4>
            <div className="space-y-3">
              <textarea
                value={bulkMappings}
                onChange={(e) => setBulkMappings(e.target.value)}
                placeholder="Cole os mapeamentos no formato: SKU_FORNECEDOR,SKU_MASTER (um por linha)"
                className="w-full h-32 px-3 py-2 border border-surface rounded-md bg-surface text-sm"
              />
              <button
                onClick={handleBulkMappings}
                disabled={!bulkMappings.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Criar Mapeamentos em Lote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mapped SKUs Tab */}
      {activeTab === 'mapped' && reconciliationData && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">SKUs Mapeados</h3>
          {reconciliationData.mapped.length === 0 ? (
            <div className="text-center py-8 text-muted">
              Nenhum SKU mapeado ainda
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-card-theme">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      SKU Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      SKU Master
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Confiança
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-gray-200">
                  {reconciliationData.mapped.map(mapping => (
                    <tr key={mapping.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                        {mapping.supplier_sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                        {mapping.master_sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          mapping.mapping_type === 'manual'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {mapping.mapping_type === 'manual' ? 'Manual' : 'Automático'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                        {Math.round(mapping.confidence_score * 100)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {new Date(mapping.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Conflicts Tab */}
      {activeTab === 'conflicts' && reconciliationData && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Conflitos de Mapeamento</h3>
          {reconciliationData.conflicts.length === 0 ? (
            <div className="text-center py-8 text-muted">
              Nenhum conflito detectado
            </div>
          ) : (
            <div className="space-y-3">
              {reconciliationData.conflicts.map((conflict, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="font-medium text-red-900">
                    SKU Fornecedor: {conflict.supplier_sku}
                  </div>
                  <div className="text-sm text-red-700 mt-1">
                    Candidatos: {conflict.candidates.join(', ')}
                  </div>
                  <div className="mt-2">
                    <button className="px-3 py-1 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 text-sm">
                      Resolver Conflito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SKUMappingManager;
