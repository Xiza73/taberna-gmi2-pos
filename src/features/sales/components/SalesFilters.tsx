import { type ChangeEvent, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import type {
  OrderStatus,
  PaymentMethod,
  PosOrderFilters,
} from '@/types/posOrder';
import { POS_PAYMENT_METHODS } from '@/features/sale/lib/labels';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../lib/labels';

/**
 * Estados visibles en el filtro v0. Pending/processing/shipped/delivered
 * no son comunes en POS (ventas presenciales arrancan `paid` o, sólo si
 * el método es mercadopago, `pending`).
 */
const VISIBLE_STATUSES: OrderStatus[] = ['paid', 'cancelled', 'refunded'];

interface Props {
  /** Fecha actualmente seleccionada (`YYYY-MM-DD`). */
  date: string;
  /** Estado actualmente seleccionado (undefined = todos). */
  status: OrderStatus | undefined;
  /** Método de pago seleccionado (undefined = todos). */
  paymentMethod: PaymentMethod | undefined;
  /** Texto de búsqueda crudo (no debounceado — el componente debouncea). */
  search: string;
  /** Aplica un cambio parcial a los filtros. */
  onChange: (partial: Partial<Pick<PosOrderFilters, 'status' | 'paymentMethod' | 'search'>> & { date?: string }) => void;
  disabled?: boolean;
}

const NATIVE_INPUT_CLASSES =
  'h-11 rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * Barra de filtros para `Ventas del día`.
 *
 * - Fecha: input nativo `date` (la tablet abre el picker del SO)
 * - Estado: select nativo con opciones del enum
 * - Método de pago: select nativo
 * - Búsqueda: text input por orderNumber con debounce 300ms
 *
 * Se evita librería de UI para selects/date porque shadcn no está
 * instalado en el POS y este v0 no necesita combobox/typeahead.
 */
export function SalesFilters({
  date,
  status,
  paymentMethod,
  search,
  onChange,
  disabled = false,
}: Props) {
  // Debounce local del input de búsqueda: el padre sólo recibe el valor
  // estabilizado, así no dispara queries por cada tecla.
  const [searchInput, setSearchInput] = useState(search);

  // Si el padre resetea/cambia search desde afuera, sincronizamos.
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (searchInput === search) return;
    const id = window.setTimeout(() => {
      onChange({ search: searchInput });
    }, 300);
    return () => window.clearTimeout(id);
    // onChange y search no se incluyen para evitar loops: el efecto sólo
    // debe disparar cuando cambia el texto local.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function handleStatus(e: ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    onChange({ status: v === '' ? undefined : (v as OrderStatus) });
  }

  function handlePayment(e: ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    onChange({ paymentMethod: v === '' ? undefined : (v as PaymentMethod) });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="space-y-1.5">
        <label htmlFor="sales-filter-date" className="block text-xs text-muted-foreground">
          Fecha
        </label>
        <input
          id="sales-filter-date"
          type="date"
          value={date}
          onChange={(e) => onChange({ date: e.target.value })}
          disabled={disabled}
          className={cn(NATIVE_INPUT_CLASSES, 'w-full tabular-nums')}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="sales-filter-status" className="block text-xs text-muted-foreground">
          Estado
        </label>
        <select
          id="sales-filter-status"
          value={status ?? ''}
          onChange={handleStatus}
          disabled={disabled}
          className={cn(NATIVE_INPUT_CLASSES, 'w-full appearance-none pr-8')}
        >
          <option value="">Todos</option>
          {VISIBLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="sales-filter-payment" className="block text-xs text-muted-foreground">
          Método de pago
        </label>
        <select
          id="sales-filter-payment"
          value={paymentMethod ?? ''}
          onChange={handlePayment}
          disabled={disabled}
          className={cn(NATIVE_INPUT_CLASSES, 'w-full appearance-none pr-8')}
        >
          <option value="">Todos</option>
          {POS_PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="sales-filter-search" className="block text-xs text-muted-foreground">
          Búsqueda por número
        </label>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            id="sales-filter-search"
            type="search"
            inputMode="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ORD-20260513-..."
            disabled={disabled}
            className={cn(NATIVE_INPUT_CLASSES, 'w-full pl-9')}
          />
        </div>
      </div>
    </div>
  );
}
