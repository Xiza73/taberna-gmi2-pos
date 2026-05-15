import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Inbox, Loader2, WifiOff } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { formatCents } from '@/features/cashbox/lib/formatters';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, getStatusChipClasses } from '@/features/sales';
import type { OrderStatus, PaymentMethod } from '@/types/posOrder';
import type {
  DailyReportPaymentMethodBreakdown,
  DailyReportStatusBreakdown,
  DailyReportTopProduct,
} from '@/types/posReport';
import { useDailyReport } from '../hooks/useDailyReport';
import { todayIso } from '../lib/dateRangeHelpers';
import { CHART_PRIMARY_COLOR, tickFormatterCents } from '../lib/chartFormatters';
import { ChartTooltip } from './ChartTooltip';

const NATIVE_INPUT_CLASSES =
  'h-11 rounded-md border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-50 disabled:cursor-not-allowed tabular-nums';

const AXIS_TICK = { fontSize: 11, fill: 'var(--muted-foreground)' };
const AXIS_STROKE = 'var(--border)';

/**
 * Reporte del día: filtro por fecha + KPIs + 3 secciones (por método de
 * pago, por estado, top productos). Loading/error/empty manejados a
 * nivel componente.
 */
export function DailyReport() {
  const [date, setDate] = useState<string>(() => todayIso());
  const online = useOnlineStatus();
  const { data, isLoading, isFetching, isError } = useDailyReport(date);

  const showSkeleton = isLoading && !data;

  return (
    <div className="space-y-5">
      {!online && <OfflineBanner />}
      <div className="flex items-end gap-3">
        <div className="space-y-1.5">
          <label htmlFor="daily-report-date" className="block text-xs text-muted-foreground">
            Fecha
          </label>
          <input
            id="daily-report-date"
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => setDate(e.target.value)}
            className={cn(NATIVE_INPUT_CLASSES, 'w-44')}
          />
        </div>
        {isFetching && !showSkeleton && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground pb-3">
            <Loader2 size={12} className="animate-spin" />
            Actualizando…
          </span>
        )}
      </div>

      {isError ? (
        <ErrorBox />
      ) : showSkeleton ? (
        <DailySkeleton />
      ) : data ? (
        <DailyBody
          totalSales={data.totalSales}
          totalOrders={data.totalOrders}
          byPaymentMethod={data.byPaymentMethod}
          byStatus={data.byStatus}
          topProducts={data.topProducts}
        />
      ) : null}
    </div>
  );
}

interface BodyProps {
  totalSales: number;
  totalOrders: number;
  byPaymentMethod: DailyReportPaymentMethodBreakdown[];
  byStatus: DailyReportStatusBreakdown[];
  topProducts: DailyReportTopProduct[];
}

function DailyBody({ totalSales, totalOrders, byPaymentMethod, byStatus, topProducts }: BodyProps) {
  return (
    <div className="space-y-6">
      <KpiRow totalSales={totalSales} totalOrders={totalOrders} />
      <PaymentMethodSection items={byPaymentMethod} />
      <StatusSection items={byStatus} />
      <TopProductsSection items={topProducts} />
    </div>
  );
}

function KpiRow({ totalSales, totalOrders }: { totalSales: number; totalOrders: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <KpiCard label="Total ventas" value={formatCents(totalSales)} />
      <KpiCard
        label="Total órdenes"
        value={`${new Intl.NumberFormat('es-PE').format(totalOrders)} órdenes`}
      />
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card/30 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className="mt-1 text-2xl tabular-nums"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
      >
        {value}
      </p>
    </div>
  );
}

function PaymentMethodSection({ items }: { items: DailyReportPaymentMethodBreakdown[] }) {
  const chartData = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        label: paymentLabel(item.paymentMethod),
      })),
    [items],
  );

  return (
    <section className="space-y-3">
      <SectionTitle>Por método de pago</SectionTitle>
      {items.length === 0 ? (
        <EmptySection text="Sin datos para este día." />
      ) : (
        <>
          <div className="rounded-md border border-border bg-card/30 p-3">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis dataKey="label" tick={AXIS_TICK} stroke={AXIS_STROKE} tickLine={false} />
                <YAxis
                  tick={AXIS_TICK}
                  stroke={AXIS_STROKE}
                  tickLine={false}
                  tickFormatter={tickFormatterCents}
                  width={70}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', fillOpacity: 0.3 }}
                  content={<ChartTooltip currency />}
                />
                <Bar dataKey="total" fill={CHART_PRIMARY_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <SimpleTable
            headers={['Método', 'Cant.', 'Total']}
            rows={items.map((item) => [
              paymentLabel(item.paymentMethod),
              new Intl.NumberFormat('es-PE').format(item.count),
              formatCents(item.total),
            ])}
            alignRight={[false, true, true]}
          />
        </>
      )}
    </section>
  );
}

function StatusSection({ items }: { items: DailyReportStatusBreakdown[] }) {
  return (
    <section className="space-y-3">
      <SectionTitle>Por estado</SectionTitle>
      {items.length === 0 ? (
        <EmptySection text="Sin datos para este día." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const status = item.status as OrderStatus;
            const label = ORDER_STATUS_LABELS[status] ?? humanizeRaw(item.status);
            return (
              <span
                key={item.status}
                className={cn(
                  'inline-flex items-center gap-2 px-2.5 py-1 rounded-sm text-xs',
                  getStatusChipClasses(status),
                )}
              >
                <span className="uppercase tracking-wide">{label}</span>
                <span
                  className="tabular-nums bg-background/30 px-1.5 py-0.5 rounded-sm"
                  style={{ fontWeight: 600 }}
                >
                  {item.count}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TopProductsSection({ items }: { items: DailyReportTopProduct[] }) {
  // Recharts en layout vertical pinta de abajo hacia arriba: invertimos
  // el dataset para que el más vendido quede arriba a simple vista.
  const chartData = useMemo(() => [...items].reverse(), [items]);

  return (
    <section className="space-y-3">
      <SectionTitle>Top productos</SectionTitle>
      {items.length === 0 ? (
        <EmptySection text="Sin productos vendidos este día." />
      ) : (
        <>
          <div className="rounded-md border border-border bg-card/30 p-3">
            <ResponsiveContainer width="100%" height={Math.max(180, items.length * 36 + 40)}>
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
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="productName"
                  tick={AXIS_TICK}
                  stroke={AXIS_STROKE}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', fillOpacity: 0.3 }}
                  content={<ChartTooltip suffix="unidades" />}
                />
                <Bar dataKey="quantity" fill={CHART_PRIMARY_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <SimpleTable
            headers={['Producto', 'Cant.', 'Total']}
            rows={items.map((item) => [
              item.productName,
              new Intl.NumberFormat('es-PE').format(item.quantity),
              formatCents(item.total),
            ])}
            alignRight={[false, true, true]}
          />
        </>
      )}
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs uppercase tracking-wide text-muted-foreground"
      style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
    >
      {children}
    </h2>
  );
}

function EmptySection({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-border py-6 px-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
      <Inbox size={18} className="text-muted-foreground/60" />
      {text}
    </div>
  );
}

interface SimpleTableProps {
  headers: string[];
  rows: string[][];
  alignRight: boolean[];
}

function SimpleTable({ headers, rows, alignRight }: SimpleTableProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-xs uppercase tracking-wide text-muted-foreground">
            {headers.map((h, i) => (
              <th
                key={h}
                className={cn('px-3 py-2', alignRight[i] ? 'text-right' : 'text-left')}
                style={{ fontWeight: 500 }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    'px-3 py-2',
                    alignRight[ci] ? 'text-right tabular-nums' : 'text-foreground',
                  )}
                  style={alignRight[ci] ? { fontWeight: 500 } : undefined}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DailySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-md border border-border bg-card/30 px-4 py-3 space-y-2">
            <div className="h-3 w-24 bg-muted/40 rounded-sm animate-pulse" />
            <div className="h-7 w-32 bg-muted/40 rounded-sm animate-pulse" />
          </div>
        ))}
      </div>
      <div className="rounded-md border border-border bg-card/30 h-64 animate-pulse" />
      <div className="rounded-md border border-border bg-card/30 h-32 animate-pulse" />
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
      data-testid="reports-offline-banner"
      className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2"
    >
      <WifiOff size={14} />
      <span>Sin conexión — los datos pueden no estar actualizados.</span>
    </div>
  );
}

function paymentLabel(raw: string): string {
  const known = PAYMENT_METHOD_LABELS[raw as PaymentMethod];
  return known ?? humanizeRaw(raw);
}

function humanizeRaw(raw: string): string {
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, ' ');
}
