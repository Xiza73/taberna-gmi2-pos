import { ShieldOff } from 'lucide-react';
import { useAuth } from '@/features/auth';

interface NoPermissionsStateProps {
  message?: string;
}

/**
 * Estado "sin permisos" unificado para todas las pantallas del POS.
 *
 * Se usa cuando el staff logueado tiene rol `user` (no puede operar POS).
 * Backstop visual al 403 que el backend devolvería igual.
 */
export function NoPermissionsState({ message }: NoPermissionsStateProps) {
  const { me } = useAuth();
  return (
    <main className="h-full flex items-center justify-center p-6">
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
          {message ?? 'El POS está disponible solo para administradores.'}
          {me && ` Tu cuenta (${me.name}) tiene rol "${me.role}".`}
        </p>
        <p className="text-xs text-muted-foreground/70">
          Pedile a un super admin que ajuste tu rol desde el backoffice.
        </p>
      </div>
    </main>
  );
}
