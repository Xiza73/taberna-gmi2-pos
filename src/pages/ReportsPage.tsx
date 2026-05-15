import { useState } from 'react';
import { useAuth } from '@/features/auth';
import { NoPermissionsState } from '@/components/NoPermissionsState';
import {
  DailyReport,
  PaymentMethodReport,
  ReportTabs,
  StaffSalesReport,
  type ReportTab,
} from '@/features/reports';

/**
 * Página de Reportes POS — slice 4 (Phase 3). Single page con 3 tabs:
 * Diario / Por método de pago / Por vendedor. El tab "Por vendedor" se
 * oculta para roles distintos a super_admin (el back devuelve 403 igual).
 */
export function ReportsPage() {
  const { role, canUsePos } = useAuth();
  const [tab, setTab] = useState<ReportTab>('daily');
  const isSuperAdmin = role === 'super_admin';

  if (!canUsePos) {
    return <NoPermissionsState message="Esta pantalla está disponible solo para administradores." />;
  }

  // Defensa extra: si el rol cambia a no-super_admin mientras el tab
  // staff está activo (caso raro), volvemos a daily para no dejar el
  // tab huérfano renderizándose deshabilitado.
  const effectiveTab: ReportTab = tab === 'staff' && !isSuperAdmin ? 'daily' : tab;

  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 lg:px-6 py-6 space-y-5">
        <header className="space-y-1">
          <h1
            className="text-2xl tracking-tight"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Reportes
          </h1>
          <p className="text-sm text-muted-foreground">
            Resúmenes de ventas POS por día, método de pago y vendedor.
          </p>
        </header>

        <ReportTabs active={effectiveTab} onChange={setTab} showStaff={isSuperAdmin} />

        <section>
          {effectiveTab === 'daily' && <DailyReport />}
          {effectiveTab === 'paymentMethod' && <PaymentMethodReport />}
          {effectiveTab === 'staff' && <StaffSalesReport enabled={isSuperAdmin} />}
        </section>
      </div>
    </main>
  );
}
