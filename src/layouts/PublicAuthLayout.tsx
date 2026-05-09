import { Outlet } from '@tanstack/react-router';
import { Sparkles } from 'lucide-react';

/**
 * Layout para páginas no autenticadas (login). Pantalla completa con
 * branding centrado arriba y form abajo. Diseñado para tablet portrait
 * y desktop.
 */
export function PublicAuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <span className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Sparkles size={20} className="text-primary-foreground" />
          </span>
          <span
            className="text-2xl tracking-tight"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            POS Lumière
          </span>
        </div>
        <p className="text-xs text-muted-foreground tracking-wider uppercase">
          Punto de venta
        </p>
      </header>
      <main className="w-full max-w-sm">
        <Outlet />
      </main>
    </div>
  );
}
