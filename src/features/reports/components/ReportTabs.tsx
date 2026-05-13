import { cn } from '@/utils/cn';

export type ReportTab = 'daily' | 'paymentMethod' | 'staff';

interface Tab {
  id: ReportTab;
  label: string;
}

const ALL_TABS: Tab[] = [
  { id: 'daily', label: 'Diario' },
  { id: 'paymentMethod', label: 'Por método de pago' },
  { id: 'staff', label: 'Por vendedor' },
];

interface Props {
  active: ReportTab;
  onChange: (next: ReportTab) => void;
  /** Si false, el tab "Por vendedor" no se renderiza (solo super_admin). */
  showStaff: boolean;
}

const TAB_BASE_CLASSES =
  'px-3 py-1.5 rounded-sm text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30';
const TAB_ACTIVE_CLASSES = 'bg-muted text-foreground';
const TAB_INACTIVE_CLASSES = 'text-muted-foreground hover:bg-muted/40 hover:text-foreground';

/**
 * Tab bar para Reportes. Botones simples (no Radix Tabs — no está
 * instalado y este v0 no necesita aria-tabpanel/keyboard nav extra,
 * los buttons ya son accesibles).
 */
export function ReportTabs({ active, onChange, showStaff }: Props) {
  const visible = showStaff ? ALL_TABS : ALL_TABS.filter((t) => t.id !== 'staff');

  return (
    <div
      role="tablist"
      aria-label="Tipos de reporte"
      className="inline-flex items-center gap-1 rounded-md border border-border bg-card/30 p-1"
    >
      {visible.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(TAB_BASE_CLASSES, isActive ? TAB_ACTIVE_CLASSES : TAB_INACTIVE_CLASSES)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
