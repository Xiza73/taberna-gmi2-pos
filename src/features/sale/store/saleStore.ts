import { create } from 'zustand';
import type { Product } from '@/types/product';

/**
 * Item de la venta en curso. Es un snapshot del producto al momento de
 * agregarlo (precio, nombre, etc.). El back recalcula precio definitivo
 * al crear la orden — esto es solo para UI/UX local.
 */
export interface SaleItem {
  productId: string;
  productName: string;
  productImage: string | null;
  /** Cents PEN. */
  unitPrice: number;
  quantity: number;
  /** Stock conocido al agregar — usado para clamp en cantidad. */
  maxStock: number;
}

interface SaleState {
  items: SaleItem[];
  /** Si el producto ya está en el cart, incrementa cantidad (clamp a maxStock). */
  addItem: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  /** Limpia todos los items — se llama después de cobrar exitosamente. */
  clear: () => void;
}

/**
 * Store de la venta en curso del cajero. Sin `persist` — la sesión es
 * efímera (si refresca, se pierde, intencional para POS).
 *
 * En el futuro, cuando agreguemos modo offline + cola sync, este store
 * va a coexistir con la cola en IndexedDB pero NO se persiste él mismo;
 * la "venta en progreso" se descarta si el cajero cierra el browser.
 */
export const useSaleStore = create<SaleState>((set) => ({
  items: [],
  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      const maxStock = Math.max(product.stock, 0);
      if (maxStock === 0) {
        // Sin stock — no agregamos. La UI debería bloquear el botón antes,
        // pero esta es una guarda defensiva.
        return state;
      }
      if (existing) {
        const nextQty = Math.min(existing.quantity + 1, maxStock);
        return {
          items: state.items.map((i) =>
            i.productId === product.id ? { ...i, quantity: nextQty, maxStock } : i,
          ),
        };
      }
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        productImage: product.images[0] ?? null,
        unitPrice: product.price,
        quantity: 1,
        maxStock,
      };
      return { items: [...state.items, newItem] };
    });
  },
  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(Math.max(quantity, 1), i.maxStock) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    }));
  },
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },
  clear: () => set({ items: [] }),
}));

/** Selectores derivados (computed). Usar dentro de componentes así:
 *   const itemCount = useSaleStore(selectItemCount);
 *   const subtotal = useSaleStore(selectSubtotal);
 */
export const selectItemCount = (state: SaleState): number =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectSubtotal = (state: SaleState): number =>
  state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
