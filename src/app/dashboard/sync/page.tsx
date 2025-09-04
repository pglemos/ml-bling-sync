import { Metadata } from 'next';
import SyncDashboard from '@/components/sync/SyncDashboard';

export const metadata: Metadata = {
  title: 'Dashboard de Sincronização | ML-Bling Sync',
  description: 'Gerencie e monitore jobs de sincronização entre suas integrações',
};

export default function SyncPage() {
  return (
    <div className="container mx-auto py-6">
      <SyncDashboard />
    </div>
  );
}
