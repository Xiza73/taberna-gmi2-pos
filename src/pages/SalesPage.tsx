import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth';
import {
  SaleDetailModal,
  SalesFilters,
  SalesList,
  usePosOrders,
} from '@/features/sales';
import type {
  OrderStatus,
  PaymentMethod,
  PosOrderFilters,
} from '@/types/posOrder';

const PAGE_SIZE = 25;

/**
 * Devuelve la fecha de hoy en formato `YYYY-MM-DD` usando la zona horaria
 * local del navegador (no UTC) — el cajero piensa en su día calendario.
 */
function todayLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * `YYYY-MM-DD` → ISO `YYYY-MM-DDTHH:MM:SS.sssZ` para los bordes del día
 * en la zona horaria local del navegador. El back hace `BETWEEN` sobre
 * `createdAt`, que está en UTC, así que mandamos los bordes ya
 * normalizados al UTC equivalente.
 */
function dateBoundsLocal(date: string): { from: string; to: string } {
  const parts = date.split('-').map(Number);
  const year = parts[0] ?? 1970;
  const month = (parts[1] ?? 1) - 1;
  const day = parts[2] ?? 1;
  const from = new Date(year, month, day, 0, 0, 0, 0);
  const to = new Date(year, month, day, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

interface FilterState {
  date: string;
  status: OrderStatus | undefined;
  paymentMethod: PaymentMethod | undefined;
  search: string;
  page: number;
}

/**
 * Pantalla "Ventas del día" — slice 3a. Lista paginada con filtros y
 * modal de detalle read-only (sin acciones de anular/devolver, que
 * llegan en slices 3b y 3c).
 */
export function SalesPage() {
  const { me, canUsePos } = useAuth();
  const [filters, setFilters] = useState<FilterState>(() => ({
    date: todayLocal(),
    status: undefined,
    paymentMethod: undefined,
    search: '',
    page: 1,
  }));
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Construye el shape exacto que viaja al back. `dateFrom` y `dateTo`
  // se calculan desde `filters.date`. `search` se omite si está vacío
  // para no enviar `?search=` con string vacío.
  const queryFilters: PosOrderFilters = useMemo(() => {
    const { from, to } = dateBoundsLocal(filters.date);
    const trimmed = filters.search.trim();
    return {
      page: filters.page,
      limit: PAGE_SIZE,
      status: filters.status,
      paymentMethod: filters.paymentMethod,
      dateFrom: from,
      dateTo: to,
      search: trimmed === '' ? undefined : trimmed,
      sortBy: 'createdAt',
    };
  }, [filters]);

  const { data, isLoading, isFetching, isError } = usePosOrders(queryFilters);

  function patchFilters(
    partial: Partial<Pick<PosOrderFilters, 'status' | 'paymentMethod' | 'search'>> & {
      date?: string;
    },
  ) {
    // Cualquier cambio que no sea de página resetea la página a 1.
    setFilters((prev) => ({
      ...prev,
      ...partial,
      page: 1,
    }));
  }

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
            Esta pantalla está disponible solo para administradores.
            {me && ` Tu cuenta (${me.name}) tiene rol "${me.role}".`}
          </p>
        </div>
      </main>
    );
  }

  const total = data?.total ?? 0;
  const totalPages = total === 0 ? 1 : Math.ceil(total / PAGE_SIZE);
  const currentPage = filters.page;
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 lg:px-6 py-6 space-y-5">
        <header className="space-y-1">
          <h1
            className="text-2xl tracking-tight"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Ventas del día
          </h1>
          <p className="text-sm text-muted-foreground">
            Consulta las ventas registradas, filtra por fecha, estado o
            método de pago.
          </p>
        </header>

        <SalesFilters
          date={filters.date}
          status={filters.status}
          paymentMethod={filters.paymentMethod}
          search={filters.search}
          onChange={patchFilters}
          disabled={isLoading && !data}
        />

        {isError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            No se pudieron cargar las ventas. Intenta de nuevo en unos segundos.
          </div>
        )}

        <SalesList
          orders={data?.items ?? []}
          isLoading={isLoading || isFetching}
          onSelect={setSelectedOrderId}
        />

        {total > 0 && (
          <footer className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
            <p className="text-xs text-muted-foreground">
              Página {currentPage} de {totalPages} ·{' '}
              <span className="tabular-nums">{total}</span> resultados
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canPrev}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                }
              >
                <ChevronLeft size={14} />
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Siguiente
                <ChevronRight size={14} />
              </Button>
            </div>
          </footer>
        )}
      </div>

      <SaleDetailModal
        id={selectedOrderId}
        onOpenChange={(open) => {
          if (!open) setSelectedOrderId(null);
        }}
      />
    </main>
  );
}
