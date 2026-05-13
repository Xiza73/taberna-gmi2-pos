/**
 * Helpers de fechas para los reportes POS. Usan la zona horaria local del
 * navegador (no UTC): el cajero piensa en su día calendario y los inputs
 * `<input type="date">` también devuelven valores locales.
 */

/** YYYY-MM-DD del día de hoy en hora local. */
export function todayIso(): string {
  return toIso(new Date());
}

/** YYYY-MM-DD para `daysAgo` días atrás desde hoy (hora local). */
export function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return toIso(d);
}

/**
 * Default usado por los reportes por rango: últimos 7 días inclusive
 * (hoy-6 .. hoy). Coincide con el "última semana" intuitivo.
 */
export function defaultRange(): { dateFrom: string; dateTo: string } {
  return { dateFrom: isoDaysAgo(6), dateTo: todayIso() };
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
