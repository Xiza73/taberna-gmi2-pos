import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/api/productsApi';
import { db, type CachedProduct } from '@/db';
import type { Product } from '@/types/product';

/**
 * Hook principal del catálogo offline. Dexie es la fuente de verdad para
 * la UI: el grid se renderiza desde IndexedDB y la sincronización con el
 * back es asíncrona (separada en una mutation).
 *
 * Triggers de sync:
 * - On mount si el cache está vacío o stale (>10m) y `navigator.onLine`
 * - Al volver la conexión (evento `online` del window)
 * - Manual via `refresh()`
 *
 * Estrategia: full replace. Limpiamos la tabla y reemplazamos con los
 * registros frescos. El catálogo es chico para v0; partial sync es
 * overkill.
 */

export const cachedProductsKeys = {
  all: ['cachedProducts'] as const,
};

interface UseCachedProductsReturn {
  products: CachedProduct[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  syncError: Error | null;
  refresh: () => void;
}

const STALE_THRESHOLD_MS = 10 * 60_000;
/**
 * El back limita `MAX_PAGE_SIZE = 50` (ver
 * `docs/backend-mirror/modules/shared.md`). Iteramos páginas hasta agotar
 * el total.
 */
const SYNC_PAGE_SIZE = 50;

export function useCachedProducts(): UseCachedProductsReturn {
  const queryClient = useQueryClient();

  const cacheQuery = useQuery({
    queryKey: cachedProductsKeys.all,
    queryFn: () => db.products.toArray(),
    // Manejamos la invalidación a mano cuando termina el sync.
    staleTime: Infinity,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const fresh = await fetchAllProducts();
      const now = Date.now();
      const records: CachedProduct[] = fresh.map((p) => mapProductToCached(p, now));
      await db.transaction('rw', db.products, async () => {
        await db.products.clear();
        await db.products.bulkPut(records);
      });
      return records.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cachedProductsKeys.all });
    },
  });

  const products = cacheQuery.data ?? [];
  const lastSyncedAt = computeOldestSyncedAt(products);

  useEffect(() => {
    if (cacheQuery.isLoading) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    if (syncMutation.isPending) return;
    const isEmpty = products.length === 0;
    const isStale =
      lastSyncedAt === null || Date.now() - lastSyncedAt > STALE_THRESHOLD_MS;
    if (isEmpty || isStale) {
      syncMutation.mutate();
    }
    // mutate identity is stable y depende solo de la query; React Query
    // garantiza estabilidad. eslint no lo detecta — silenciamos a propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheQuery.isLoading, lastSyncedAt]);

  useEffect(() => {
    function onOnline() {
      if (!syncMutation.isPending) {
        syncMutation.mutate();
      }
    }
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    products,
    isLoading: cacheQuery.isLoading,
    isSyncing: syncMutation.isPending,
    lastSyncedAt,
    syncError: syncMutation.error,
    refresh: () => syncMutation.mutate(),
  };
}

function computeOldestSyncedAt(products: CachedProduct[]): number | null {
  if (products.length === 0) return null;
  let min: number | null = null;
  for (const p of products) {
    if (min === null || p.syncedAt < min) min = p.syncedAt;
  }
  return min;
}

async function fetchAllProducts(): Promise<Product[]> {
  const out: Product[] = [];
  let page = 1;
  // Guard contra loops infinitos si el back devuelve algo raro.
  const MAX_PAGES = 100;
  while (page <= MAX_PAGES) {
    const r = await productsApi.list({
      page,
      limit: SYNC_PAGE_SIZE,
      sortBy: 'name',
    });
    out.push(...r.items);
    if (out.length >= r.total || r.items.length === 0) break;
    page++;
  }
  return out;
}

function mapProductToCached(p: Product, syncedAt: number): CachedProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    stock: p.stock,
    images: p.images,
    categoryId: p.categoryId,
    isActive: p.isActive,
    syncedAt,
  };
}
