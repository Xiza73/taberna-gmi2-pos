import { useMemo, useState } from 'react';
import { ImageOff, Search, X } from 'lucide-react';
import { useCachedProducts, useCategories } from '@/features/catalog';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { CachedProduct } from '@/db';
import { cn } from '@/utils/cn';
import { formatPEN } from '@/utils/format';

interface Props {
  onProductClick: (product: CachedProduct) => void;
}

/**
 * Grid táctil de productos del catálogo. Fuente: cache Dexie (offline-first).
 * Los filtros (search con debounce 250ms + categoría) se aplican en memoria
 * sobre el array cacheado — no hay round-trip al back.
 *
 * Estados:
 * - Cargando cache → skeleton
 * - Cache vacío + sincronizando → "Cargando catálogo…"
 * - Cache vacío + offline → mensaje pidiendo conexión
 * - Cache con productos → grid filtrable
 */
export function ProductGrid({ onProductClick }: Props) {
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const search = useDebounce(searchInput, 250);

  const { topLevel: topCategories } = useCategories();
  const isOnline = useOnlineStatus();

  const { products, isLoading, isSyncing } = useCachedProducts();

  const filtered = useMemo<CachedProduct[]>(() => {
    const term = search.trim().toLowerCase();
    return products
      .filter((p) => p.isActive)
      .filter((p) => (selectedCategoryId ? p.categoryId === selectedCategoryId : true))
      .filter((p) => (term ? p.name.toLowerCase().includes(term) : true))
      .sort((a, b) => a.name.localeCompare(b.name, 'es-PE'));
  }, [products, search, selectedCategoryId]);

  const isCacheEmpty = !isLoading && products.length === 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Search + categories */}
      <div className="px-4 lg:px-6 py-3 border-b border-border space-y-3 shrink-0 bg-background">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="search"
            placeholder="Buscar producto…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-12 pl-10 pr-10 rounded-md border border-border bg-input-background text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
            autoFocus
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <CategoryPill
            active={selectedCategoryId === null}
            onClick={() => setSelectedCategoryId(null)}
          >
            Todas
          </CategoryPill>
          {topCategories.map((cat) => (
            <CategoryPill
              key={cat.id}
              active={selectedCategoryId === cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
            >
              {cat.name}
            </CategoryPill>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {isLoading ? (
          <ProductsSkeleton />
        ) : isCacheEmpty && isSyncing ? (
          <div className="rounded-md border border-border bg-card/50 p-10 text-center">
            <p className="text-base mb-1" style={{ fontWeight: 500 }}>
              Cargando catálogo…
            </p>
            <p className="text-sm text-muted-foreground">
              Descargando productos desde el servidor.
            </p>
          </div>
        ) : isCacheEmpty && !isOnline ? (
          <div className="rounded-md border border-border bg-card/50 p-10 text-center">
            <p className="text-base mb-1" style={{ fontWeight: 500 }}>
              Sin catálogo descargado
            </p>
            <p className="text-sm text-muted-foreground">
              Conéctate a internet para descargar productos.
            </p>
          </div>
        ) : isCacheEmpty ? (
          <div className="rounded-md border border-border bg-card/50 p-10 text-center">
            <p className="text-base mb-1" style={{ fontWeight: 500 }}>
              Catálogo vacío
            </p>
            <p className="text-sm text-muted-foreground">
              Toca "Refrescar catálogo" para descargar los productos.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-md border border-border bg-card/50 p-10 text-center">
            <p className="text-base mb-1" style={{ fontWeight: 500 }}>
              Sin resultados
            </p>
            <p className="text-sm text-muted-foreground">
              No encontramos productos con esos filtros.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onProductClick(product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onClick,
}: {
  product: CachedProduct;
  onClick: () => void;
}) {
  const isOutOfStock = product.stock === 0;
  const image = product.images[0];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isOutOfStock}
      className={cn(
        'group text-left bg-card border border-border rounded-md overflow-hidden',
        'transition-all hover:border-primary/40 hover:shadow-lg active:scale-[0.98]',
        isOutOfStock && 'opacity-50 cursor-not-allowed hover:border-border hover:shadow-none',
      )}
    >
      <div className="relative aspect-square bg-muted">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageOff size={28} />
          </div>
        )}
        {isOutOfStock && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] tracking-wider uppercase rounded-sm bg-foreground text-background">
            Agotado
          </span>
        )}
        {!isOutOfStock && product.stock < 5 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] tracking-wider uppercase rounded-sm bg-amber-500 text-amber-950">
            Stock bajo
          </span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </p>
        <p
          className="text-base text-foreground tabular-nums"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          {formatPEN(product.price)}
        </p>
      </div>
    </button>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-sm text-sm tracking-wide transition-colors shrink-0',
        active
          ? 'bg-foreground text-background'
          : 'bg-muted text-foreground hover:bg-secondary',
      )}
    >
      {children}
    </button>
  );
}

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-md overflow-hidden">
          <div className="aspect-square bg-muted" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-20 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
