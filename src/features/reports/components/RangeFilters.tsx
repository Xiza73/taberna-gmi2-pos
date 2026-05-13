import { cn } from '@/utils/cn';
import { todayIso } from '../lib/dateRangeHelpers';

const NATIVE_INPUT_CLASSES =
  'h-11 rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-50 disabled:cursor-not-allowed tabular-nums';

interface Props {
  /** Prefijo único usado para los `id` y `for` de los inputs (evita colisión entre tabs). */
  idPrefix: string;
  dateFrom: string;
  dateTo: string;
  onChange: (next: { dateFrom?: string; dateTo?: string }) => void;
  /** Mensaje de error inline (ej: rango inválido). Si presente, se muestra debajo. */
  error?: string;
}

/**
 * Par de inputs `<input type="date">` para filtrar reportes por rango.
 * Hace validación visual del rango pero NO bloquea el cambio: el caller
 * decide si dispara la query o no según el `error`.
 */
export function RangeFilters({ idPrefix, dateFrom, dateTo, onChange, error }: Props) {
  const todayMax = todayIso();
  const fromId = `${idPrefix}-from`;
  const toId = `${idPrefix}-to`;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <div className="space-y-1.5">
          <label htmlFor={fromId} className="block text-xs text-muted-foreground">
            Desde
          </label>
          <input
            id={fromId}
            type="date"
            value={dateFrom}
            max={todayMax}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
            className={cn(NATIVE_INPUT_CLASSES, 'w-full')}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={toId} className="block text-xs text-muted-foreground">
            Hasta
          </label>
          <input
            id={toId}
            type="date"
            value={dateTo}
            max={todayMax}
            onChange={(e) => onChange({ dateTo: e.target.value })}
            className={cn(NATIVE_INPUT_CLASSES, 'w-full')}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
