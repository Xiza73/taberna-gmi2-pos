import Dexie, { type Table } from 'dexie';

/**
 * IndexedDB local del POS — base del modo offline-first. Las tablas están
 * declaradas pero NO se usan todavía: cada feature las llena cuando
 * aterriza. La idea es que el bootstrap deje la DB lista para no tener
 * que migrar versions cuando se agregue el primer use case.
 *
 * Convenciones:
 * - Las tablas que cachean datos del back tienen `syncedAt: number`
 *   (timestamp ms) para saber cuándo se refrescaron.
 * - Las tablas de "cola" (acciones pendientes de sync) llevan
 *   `createdAt`, `attempts`, `lastError`.
 *
 * Versionado: cualquier cambio de schema requiere bumpear `version()`
 * y agregar migración. Ver https://dexie.org/docs/Tutorial/Design#database-versioning
 */

/** Snapshot de un producto cacheado del catálogo. */
export interface CachedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  /** Stock conocido al momento del cacheo — el back valida al crear orden. */
  stock: number;
  images: string[];
  categoryId: string;
  isActive: boolean;
  /** ms epoch — última vez que se sincronizó del back. */
  syncedAt: number;
}

/** Venta POS pendiente de sync con el back (creada estando offline). */
export interface PendingPosOrder {
  /** UUID local generado en el cliente. NO es el orderNumber del back. */
  localId: string;
  /** Payload completo del POST /admin/pos/orders. */
  payload: Record<string, unknown>;
  /** ms epoch — cuándo se creó localmente. */
  createdAt: number;
  /** Intentos de sync acumulados. */
  attempts: number;
  /** Mensaje del último error de sync (si lo hubo). */
  lastError: string | null;
}

class PosDb extends Dexie {
  products!: Table<CachedProduct, string>;
  pendingOrders!: Table<PendingPosOrder, string>;

  constructor() {
    super('gmi2-pos');
    this.version(1).stores({
      // index sobre `name` para búsqueda rápida y `categoryId` para filtros.
      products: 'id, name, categoryId, syncedAt',
      pendingOrders: 'localId, createdAt',
    });
  }
}

export const db = new PosDb();
