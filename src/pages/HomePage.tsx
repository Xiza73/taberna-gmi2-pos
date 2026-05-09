import { ShieldOff, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/features/auth';

/**
 * Home placeholder. En el siguiente PR esta página se reemplaza por la
 * pantalla "Nueva venta" con grid de productos táctil + cart sidebar.
 *
 * Si el rol no puede operar el POS (rol `user`), mostramos mensaje
 * "Sin permisos" — los endpoints `/admin/pos/*` igual devolverían 403,
 * pero es mejor UX cortarlo en el front.
 */
export function HomePage() {
  const { me, canUsePos } = useAuth();

  if (!canUsePos) {
    return (
      <main className="min-h-full flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10">
            <ShieldOff size={26} className="text-destructive" />
          </div>
          <h1
            className="text-2xl"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Sin permisos
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            El POS está disponible solo para administradores.
            {me && ` Tu cuenta (${me.name}) tiene rol "${me.role}".`}
          </p>
          <p className="text-xs text-muted-foreground/70">
            Pedile a un super admin que ajuste tu rol desde el backoffice.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
          <ShoppingBag size={26} className="text-primary" />
        </div>
        <h1
          className="text-2xl"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          POS Lumière
        </h1>
        <p className="text-sm text-muted-foreground">
          Bootstrap inicial. La pantalla de "Nueva venta" entra en el siguiente PR.
        </p>
      </div>
    </main>
  );
}
