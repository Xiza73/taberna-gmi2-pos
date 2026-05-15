import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Inbox, Loader2, WifiOff } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { formatCents } from '@/features/cashbox/lib/formatters';
import type { StaffSalesReportItem } from '@/types/posReport';
import { useStaffSalesReport } from '../hooks/useStaffSalesReport';
import { defaultRange } from '../lib/dateRangeHelpers';
import { CHART_PRIMARY_COLOR, tickFormatterCents } from '../lib/chartFormatters';
import { ChartTooltip } from './ChartTooltip';
import { RangeFilters } from './RangeFilters';

const AXIS_TICK = { fontSize: 11, fill: 'var(--muted-foreground)' };
const AXIS_STROKE = 'var(--border)';
const RANGE_INVALID_ERROR = "El 'Desde' debe ser anterior o igual al 'Hasta'.";

interface Props {
  /** Solo true si el usuario es super_admin (controlado por el page). */
  enabled: boolean;
}

/**
 * Reporte de ventas por vendedor. La habilitación de la query depende
 * del rol (super_admin) Y del rango válido — el page pasa `enabled`
 * según el rol y este componente combina con la validación de rango.
 */
export function StaffSalesReport({ enabled }: Props) {
  const [range, setRange] = useState(() => defaultRange());
  const isInvalid = range.dateFrom > range.dateTo;
  const online = useOnlineStatus();
  const { data, isLoading, isFetching, isError } = useStaffSalesReport(
    range.dateFrom,
    range.dateTo,
    enabled && !isInvalid,
  );

  const showSkeleton = isLoading && !data && !isInvalid && enabled;

  return (
    <div className="space-y-5">
      {!online && <OfflineBanner />}
      <RangeFilters
        idPrefix="staff-sales-report"
        dateFrom={range.dateFrom}
        dateTo={range.dateTo}
        onChange={(partial) => setRange((prev) => ({ ...prev, ...partial }))}
        error={isInvalid ? RANGE_INVALID_ERROR : undefined}
      />

      {!isInvalid && enabled && isFetching && !showSkeleton && (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" />
          Actualizando…
        </span>
      )}

      {!enabled || isInvalid ? null : isError ? (
        <ErrorBox />
      ) : showSkeleton ? (
        <RangeSkeleton />
      ) : data ? (
        <Body dateFrom={data.dateFrom} dateTo={data.dateTo} items={data.items} />
      ) : null}
    </div>
  );
}

interface BodyProps {
  dateFrom: string;
  dateTo: string;
  items: StaffSalesReportItem[];
}

function Body({ dateFrom, dateTo, items }: BodyProps) {
  // Layout vertical: invertimos para que el top ranking quede arriba.
  const chartData = useMemo(() => [...items].reverse(), [items]);

  const totals = useMemo(() => {
    let count = 0;
    let amount = 0;
    for (const item of items) {
      count += item.count;
      amount += item.totalAmount;
    }
    return { count, amount };
  }, [items]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Rango: <span className="tabular-nums text-foreground">{dateFrom}</span>
        {' → '}
        <span className="tabular-nums text-foreground">{dateTo}</span>
      </p>

      {items.length === 0 ? (
        <EmptyBox text="Sin ventas para el rango seleccionado." />
      ) : (
        <>
          <div className="rounded-md border border-border bg-card/30 p-3">
            <ResponsiveContainer width="100%" height={Math.max(200, items.length * 38 + 40)}>
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  strokeOpacity={0.5}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={AXIS_TICK}
                  stroke={AXIS_STROKE}
                  tickLine={false}
                  tickFormatter={tickFormatterCents}
                />
                <YAxis
                  type="category"
                  dataKey="staffName"
                  tick={AXIS_TICK}
                  stroke={AXIS_STROKE}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', fillOpacity: 0.3 }}
                  content={<ChartTooltip currency />}
                />
                <Bar dataKey="totalAmount" fill={CHART_PRIMARY_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="text-left px-3 py-2" style={{ fontWeight: 500 }}>
                    Vendedor
                  </th>
                  <th className="text-right px-3 py-2 w-24" style={{ fontWeight: 500 }}>
                    Cant.
                  </th>
                  <th className="text-right px-3 py-2 w-32" style={{ fontWeight: 500 }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((item) => (
                  <tr key={item.staffId}>
                    <td className="px-3 py-2 text-foreground">{item.staffName}</td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ fontWeight: 500 }}>
                      {new Intl.NumberFormat('es-PE').format(item.count)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums" style={{ fontWeight: 500 }}>
                      {formatCents(item.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t border-border">
                <tr>
                  <td
                    className={cn(
                      'px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground',
                    )}
                    style={{ fontWeight: 500 }}
                  >
                    Totales
                  </td>
                  <td
                    className="px-3 py-2 text-right tabular-nums text-foreground"
                    style={{ fontWeight: 600 }}
                  >
                    {new Intl.NumberFormat('es-PE').format(totals.count)}
                  </td>
                  <td
                    className="px-3 py-2 text-right tabular-nums text-foreground"
                    style={{ fontWeight: 600 }}
                  >
                    {formatCents(totals.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ErrorBox() {
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive flex items-center gap-2"
    >
      <AlertTriangle size={16} />
      No se pudo cargar el reporte. Intenta de nuevo en unos segundos.
    </div>
  );
}

function OfflineBanner() {
  return (
    <div
      role="status"
      className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2"
    >
      <WifiOff size={14} />
      <span>Sin conexión — los datos pueden no estar actualizados.</span>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-border py-10 px-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
      <Inbox size={20} className="text-muted-foreground/60" />
      {text}
    </div>
  );
}

function RangeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card/30 h-64 animate-pulse" />
      <div className="rounded-md border border-border bg-card/30 h-40 animate-pulse" />
    </div>
  );
}
