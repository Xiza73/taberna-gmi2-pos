/**
 * Helpers de formato específicos del feature cashbox. `formatCents` usa
 * la misma config que `utils/format.formatPEN` — se duplica acá para que
 * el feature sea autocontenido y no dependa de utils globales.
 */

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Centavos → "S/ 12,345.67" (formato es-PE). */
export function formatCents(cents: number): string {
  return CURRENCY_FORMATTER.format(cents / 100);
}

/**
 * "12345.67" o "12345,67" → centavos (number). Acepta separador decimal
 * con punto o coma para tablets cuyo teclado puede emitir cualquiera.
 * Devuelve NaN si el input es inválido o negativo.
 */
export function parseCurrencyInput(value: string): number {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  if (normalized === '') return NaN;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

/**
 * Devuelve el "hint" dinámico para inputs monetarios:
 *
 * - input vacío → muestra el hint base (instrucción para el cajero)
 * - input inválido (no parsea) → "Monto inválido..."
 * - input válido → "= S/ 500,00" (preview del monto formateado en soles)
 *
 * Esto resuelve la confusión "tipo 500, ¿son centavos o soles?" mostrando
 * en vivo cuánto va a enviarse formateado.
 */
export function computeAmountHint(value: string, baseHint: string): string {
  const trimmed = value.trim();
  if (!trimmed) return baseHint;
  const cents = parseCurrencyInput(trimmed);
  if (Number.isNaN(cents)) return 'Monto inválido. Usá números (ej: 150.00)';
  return `= ${formatCents(cents)}`;
}

/** ISO date string → "14:30" (24h, hora local del navegador). */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** ISO date string → "2h 15m" / "5m" / "<1m". */
export function formatElapsed(fromIso: string, now: number = Date.now()): string {
  return formatElapsedMs(new Date(fromIso).getTime(), now);
}

/** ms epoch → "2h 15m" / "5m" / "<1m". */
export function formatElapsedMs(fromMs: number, now: number = Date.now()): string {
  const elapsedMs = now - fromMs;
  const totalMinutes = Math.floor(elapsedMs / 60000);
  if (totalMinutes < 1) return '<1m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
