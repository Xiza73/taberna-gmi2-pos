import { useEffect } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { onAuthExpired } from '@/api/tokens';

/**
 * Root layout. Renderiza el Outlet, Toaster global, y dispara el listener
 * de `gmi2:pos:auth-expired` que limpia la sesión + redirige al login.
 */
export function RootLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthExpired(() => {
      void navigate({ to: '/login' });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
      <Toaster theme="dark" position="top-right" richColors closeButton />
    </div>
  );
}
