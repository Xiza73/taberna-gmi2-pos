import { useState } from 'react';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { RefreshCatalogButton } from '@/features/catalog';
import {
  ChargeModal,
  ProductGrid,
  SaleCartSidebar,
  SaleSuccessOverlay,
  useSaleStore,
} from '@/features/sale';
import type { PosOrderResponse } from '@/types/posOrder';

/**
 * Pantalla principal del POS — "Nueva venta". Layout split: catálogo a
 * la izquierda + sidebar de venta a la derecha. En tablet portrait las
 * dos secciones se apilan (sidebar arriba con scroll, catálogo abajo);
 * el target principal es tablet landscape.
 *
 * Si el rol del staff es `user`, mostramos "sin permisos" — backstop al
 * 403 que vendría del back de cualquier modo.
 */
export function NewSalePage() {
  const { me, canUsePos } = useAuth();
  const addItem = useSaleStore((s) => s.addItem);
  const clear = useSaleStore((s) => s.clear);
  const [isChargeOpen, setIsChargeOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<PosOrderResponse | null>(null);

  if (!canUsePos) {
    return (
      <main className="h-full flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10">
            <ShieldOff size={26} className="text-destructive" />
          </div>
          <h1
            className="text-2xl"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Sin permisos
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            El POS está disponible solo para administradores.
            {me && ` Tu cuenta (${me.name}) tiene rol "${me.role}".`}
          </p>
          <p className="text-xs text-muted-foreground/70">
            Pedile a un super admin que ajuste tu rol desde el backoffice.
          </p>
        </div>
      </main>
    );
  }

  function handleNewSale() {
    setCompletedOrder(null);
    clear();
  }

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
      <div className="overflow-hidden flex flex-col min-h-0">
        <div className="px-4 lg:px-6 pt-3 pb-1 shrink-0">
          <RefreshCatalogButton />
        </div>
        <div className="flex-1 min-h-0">
          <ProductGrid onProductClick={addItem} />
        </div>
      </div>
      <div className="overflow-hidden border-t lg:border-t-0 border-border">
        <SaleCartSidebar onCharge={() => setIsChargeOpen(true)} />
      </div>

      <ChargeModal
        open={isChargeOpen}
        onOpenChange={setIsChargeOpen}
        onSuccess={(result) => {
          setIsChargeOpen(false);
          if (result.kind === 'synced') {
            setCompletedOrder(result.order);
          } else {
            // Venta encolada offline: el toast informa al cajero, no
            // mostramos el overlay (no hay orderNumber todavía). El cart
            // se limpia para arrancar la siguiente venta de inmediato.
            clear();
          }
        }}
      />

      <SaleSuccessOverlay order={completedOrder} onNewSale={handleNewSale} />
    </div>
  );
}
