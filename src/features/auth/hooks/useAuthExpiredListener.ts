import { useEffect } from 'react';
import { toast } from 'sonner';
import { onAuthExpired } from '@/api/tokens';

/**
 * Suscribe a `gmi2:pos:auth-expired` y muestra un toast persistente al
 * cajero. NO redirige automáticamente — el cajero puede estar en medio
 * de una venta offline. Cuando vuelva la red, el refresh se reintenta
 * en la próxima request; si vuelve a fallar (refresh expirado), el
 * back manda 401 → `gmi2:pos:auth-expired` se vuelve a emitir y el
 * cajero lo verá. Cuando esté listo, va al login manualmente.
 */
export function useAuthExpiredListener(): void {
  useEffect(() => {
    const unsubscribe = onAuthExpired(() => {
      toast.error('Sesión expirada', {
        id: 'pos-auth-expired',
        description:
          'Tu sesión venció. Reconectate al volver online o iniciá sesión otra vez para continuar.',
        duration: Infinity,
      });
    });
    return unsubscribe;
  }, []);
}
