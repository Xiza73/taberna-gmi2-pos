import { ImageOff, Minus, Plus, Trash2 } from 'lucide-react';
import type { SaleItem } from '../store/saleStore';
import { formatPEN } from '@/utils/format';

interface Props {
  item: SaleItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

/**
 * Fila del cart de venta. Diseño compacto pero táctil — botones +/- de
 * 36px (cómodos en tablet sin ocupar mucho).
 */
export function SaleItemRow({ item, onUpdateQuantity, onRemove }: Props) {
  const subtotal = item.unitPrice * item.quantity;
  const canDec = item.quantity > 1;
  const canInc = item.quantity < item.maxStock;

  return (
    <article className="flex gap-3 py-3 border-b border-border last:border-b-0">
      <div className="shrink-0 w-12 h-12 bg-muted rounded-sm overflow-hidden">
        {item.productImage ? (
          <img
            src={item.productImage}
            alt={item.productName}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageOff size={16} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm leading-snug line-clamp-2 flex-1">{item.productName}</p>
          <button
            type="button"
            onClick={() => onRemove(item.productId)}
            aria-label="Quitar del cart"
            className="shrink-0 p-1 -m-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center border border-border rounded-sm overflow-hidden">
            <button
              type="button"
              onClick={() => canDec && onUpdateQuantity(item.productId, item.quantity - 1)}
              disabled={!canDec}
              aria-label="Disminuir cantidad"
              className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="w-9 h-9 flex items-center justify-center text-sm tabular-nums border-x border-border">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => canInc && onUpdateQuantity(item.productId, item.quantity + 1)}
              disabled={!canInc}
              aria-label="Aumentar cantidad"
              className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>

          <div className="text-right">
            <p
              className="text-sm tabular-nums"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              {formatPEN(subtotal)}
            </p>
            {item.quantity > 1 && (
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {formatPEN(item.unitPrice)} c/u
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
