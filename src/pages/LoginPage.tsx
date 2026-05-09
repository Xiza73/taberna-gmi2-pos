import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import { ApiError } from '@/api/errors';

/**
 * Login del staff. Misma estética que el backoffice (dark theme, form
 * compacto). Después del login, si el rol es `user`, redirigimos a una
 * pantalla de "sin permisos" (se agrega cuando hagamos esa página real).
 *
 * Este es el bootstrap — la UI es básica. Cuando llegue el código de
 * Figma del POS, reemplazamos.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Completá email y contraseña.');
      return;
    }
    try {
      await login({ email, password });
      toast.success('Sesión iniciada');
      void navigate({ to: '/' });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 401
            ? 'Email o contraseña incorrectos.'
            : err.message
          : 'No se pudo iniciar sesión. Intentá de nuevo.';
      setError(msg);
    }
  }

  return (
    <div className="bg-card border border-border rounded-md p-6 space-y-4">
      <header className="space-y-1">
        <h1
          className="text-xl"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          Iniciar sesión
        </h1>
        <p className="text-xs text-muted-foreground">
          Accedé con tu cuenta de staff.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-sm">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoggingIn}
            required
            className="w-full h-11 rounded-md border border-border bg-input-background px-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="login-password" className="block text-sm">
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoggingIn}
            required
            className="w-full h-11 rounded-md border border-border bg-input-background px-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring disabled:opacity-50"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full h-12 rounded-md bg-primary text-primary-foreground text-sm tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontWeight: 500 }}
        >
          {isLoggingIn ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
