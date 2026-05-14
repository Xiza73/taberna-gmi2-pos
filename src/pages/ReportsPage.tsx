import { useState } from 'react';
import { ShieldOff } from 'lucide-react';
import { OfflineNotice } from '@/components/OfflineNotice';
import { useAuth } from '@/features/auth';
import {
  DailyReport,
  PaymentMethodReport,
  ReportTabs,
  StaffSalesReport,
  type ReportTab,
} from '@/features/reports';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * Página de Reportes POS — slice 4 (Phase 3). Single page con 3 tabs:
 * Diario / Por método de pago / Por vendedor. El tab "Por vendedor" se
 * oculta para roles distintos a super_admin (el back devuelve 403 igual).
 */
export function ReportsPage() {
  const { me, role, canUsePos } = useAuth();
  const isOnline = useOnlineStatus();
  const [tab, setTab] = useState<ReportTab>('daily');
  const isSuperAdmin = role === 'super_admin';

  if (!canUsePos) {
    return (
      <main className="h-full flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10">
            <ShieldOff size={26} className="text-destructive" />
          </div>
          <h1 className="text-2xl" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
            Sin permisos
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esta pantalla está disponible solo para administradores.
            {me && ` Tu cuenta (${me.name}) tiene rol "${me.role}".`}
          </p>
        </div>
      </main>
    );
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

        {isOnline ? (
          <>
            <ReportTabs active={effectiveTab} onChange={setTab} showStaff={isSuperAdmin} />

            <section>
              {effectiveTab === 'daily' && <DailyReport />}
              {effectiveTab === 'paymentMethod' && <PaymentMethodReport />}
              {effectiveTab === 'staff' && <StaffSalesReport enabled={isSuperAdmin} />}
            </section>
          </>
        ) : (
          <OfflineNotice
            message="Los reportes requieren conexión a internet."
            hint="Vuelve a esta sección cuando tu conexión se restablezca."
          />
        )}
      </div>
    </main>
  );
}
