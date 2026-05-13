import { formatCents } from '@/features/cashbox/lib/formatters';

/**
 * Color primario para todos los bars del feature reports. Coincide con el
 * acento "caja" (emerald-500) usado en los chips del header — mantiene
 * lectura consistente entre badges del header y barras del reporte.
 */
export const CHART_PRIMARY_COLOR = '#22c55e';

const CURRENCY_COMPACT = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0,
});

/**
 * Centavos → "S/ 500" sin decimales. Para tick labels en ejes donde el
 * espacio es limitado (con decimales se pisa el siguiente tick).
 */
export function formatCentsCompact(cents: number): string {
  return CURRENCY_COMPACT.format(cents / 100);
}

/**
 * Acepta el `tickFormatter` callback de Recharts (que pasa `value`
 * tipado como `unknown`/`number | string`). Devuelve la versión compacta
 * o el valor original si no es número.
 */
export function tickFormatterCents(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  return formatCentsCompact(value);
}

/** Wrapper para tick formatter que usa formatCents (con decimales). */
export function tickFormatterCentsFull(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  return formatCents(value);
}
