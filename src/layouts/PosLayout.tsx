import { Link, Outlet } from '@tanstack/react-router';
import { LogOut, Sparkles, User, WifiOff } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { CashRegisterStatusBadge } from '@/features/cashbox';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/utils/cn';

const NAV_BASE_CLASSES =
  'px-2.5 py-1 rounded-sm text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors';
const NAV_ACTIVE_CLASSES = 'bg-muted text-foreground';

/**
 * Layout principal de la app autenticada (staff). Header chico siempre
 * visible con: brand + nombre del staff + indicador online/offline +
 * botón cerrar sesión. El Outlet ocupa el resto de la pantalla.
 *
 * Optimizado para tablet landscape (resolución típica POS): el header
 * usa height 56px y deja máximo espacio para el canvas de venta.
 */
export function PosLayout() {
  const { me, logout, isLoggingOut } = useAuth();
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Sparkles size={14} className="text-primary-foreground" />
            </span>
            <span
              className="text-base tracking-tight"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              POS Lumière
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              to="/"
              className={NAV_BASE_CLASSES}
              activeProps={{ className: cn(NAV_BASE_CLASSES, NAV_ACTIVE_CLASSES) }}
              activeOptions={{ exact: true }}
            >
              Nueva venta
            </Link>
            <Link
              to="/sales"
              className={NAV_BASE_CLASSES}
              activeProps={{ className: cn(NAV_BASE_CLASSES, NAV_ACTIVE_CLASSES) }}
            >
              Ventas del día
            </Link>
            <Link
              to="/reports"
              className={NAV_BASE_CLASSES}
              activeProps={{ className: cn(NAV_BASE_CLASSES, NAV_ACTIVE_CLASSES) }}
            >
              Reportes
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!isOnline && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-amber-500/10 text-amber-400 text-xs">
              <WifiOff size={12} />
              <span className="hidden sm:inline">Modo offline</span>
            </span>
          )}
          <CashRegisterStatusBadge />
          {me && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <User size={14} />
              <span className="hidden sm:inline">{me.name}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            disabled={isLoggingOut}
            aria-label="Cerrar sesión"
            className="p-2 rounded-full text-foreground/70 hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
