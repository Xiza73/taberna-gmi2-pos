import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPEN } from '@/utils/format';
import {
  selectItemCount,
  selectSubtotal,
  useSaleStore,
} from '../store/saleStore';
import { SaleItemRow } from './SaleItemRow';

interface Props {
  onCharge: () => void;
}

/**
 * Sidebar fija con la venta en curso. Lista de items + total + botón
 * "Cobrar". El layout padre (NewSalePage) la posiciona; este componente
 * solo se ocupa de su propio scroll interno.
 */
export function SaleCartSidebar({ onCharge }: Props) {
  const items = useSaleStore((s) => s.items);
  const updateQuantity = useSaleStore((s) => s.updateQuantity);
  const removeItem = useSaleStore((s) => s.removeItem);
  const itemCount = useSaleStore(selectItemCount);
  const subtotal = useSaleStore(selectSubtotal);

  return (
    <aside className="h-full flex flex-col bg-card border-l border-border">
      <header className="px-4 py-3 border-b border-border shrink-0">
        <h2
          className="text-base"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
        >
          Venta en curso
        </h2>
        {itemCount > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </p>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.productId}>
                <SaleItemRow
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="px-4 py-4 border-t border-border bg-muted/20 space-y-3 shrink-0">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span
            className="text-2xl tabular-nums"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            {formatPEN(subtotal)}
          </span>
        </div>
        <Button
          size="touch"
          width="full"
          onClick={onCharge}
          disabled={items.length === 0}
        >
          Cobrar
        </Button>
      </footer>
    </aside>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
        <ShoppingCart size={20} className="text-muted-foreground" />
      </div>
      <p className="text-sm" style={{ fontWeight: 500 }}>
        Sin productos
      </p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
        Tocá un producto del catálogo para sumarlo a la venta.
      </p>
    </div>
  );
}
