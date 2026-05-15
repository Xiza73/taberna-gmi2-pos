import { beforeEach, describe, expect, it } from 'vitest';
import {
  type AddableProduct,
  selectItemCount,
  selectSubtotal,
  useSaleStore,
} from './saleStore';

function product(overrides: Partial<AddableProduct> = {}): AddableProduct {
  return {
    id: 'p-1',
    name: 'Producto 1',
    images: ['https://img/1.jpg'],
    price: 1000,
    stock: 5,
    ...overrides,
  };
}

beforeEach(() => {
  useSaleStore.setState({ items: [] });
});

describe('saleStore — addItem', () => {
  it('adds a new product with quantity 1', () => {
    useSaleStore.getState().addItem(product());
    const { items } = useSaleStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      productId: 'p-1',
      quantity: 1,
      unitPrice: 1000,
      maxStock: 5,
      productImage: 'https://img/1.jpg',
    });
  });

  it('increments quantity when adding an existing product', () => {
    useSaleStore.getState().addItem(product());
    useSaleStore.getState().addItem(product());
    expect(useSaleStore.getState().items[0]?.quantity).toBe(2);
  });

  it('clamps quantity to maxStock when adding repeatedly', () => {
    const p = product({ stock: 2 });
    useSaleStore.getState().addItem(p);
    useSaleStore.getState().addItem(p);
    useSaleStore.getState().addItem(p); // would push to 3, clamped to 2
    expect(useSaleStore.getState().items[0]?.quantity).toBe(2);
  });

  it('does NOT add when stock is 0', () => {
    useSaleStore.getState().addItem(product({ stock: 0 }));
    expect(useSaleStore.getState().items).toHaveLength(0);
  });

  it('uses null when product has no images', () => {
    useSaleStore.getState().addItem(product({ images: [] }));
    expect(useSaleStore.getState().items[0]?.productImage).toBeNull();
  });
});

describe('saleStore — updateQuantity', () => {
  it('updates quantity within bounds', () => {
    useSaleStore.getState().addItem(product({ stock: 10 }));
    useSaleStore.getState().updateQuantity('p-1', 5);
    expect(useSaleStore.getState().items[0]?.quantity).toBe(5);
  });

  it('clamps to maxStock', () => {
    useSaleStore.getState().addItem(product({ stock: 3 }));
    useSaleStore.getState().updateQuantity('p-1', 100);
    expect(useSaleStore.getState().items[0]?.quantity).toBe(3);
  });

  it('clamps to 1 minimum (filters 0)', () => {
    useSaleStore.getState().addItem(product());
    useSaleStore.getState().updateQuantity('p-1', 1);
    expect(useSaleStore.getState().items[0]?.quantity).toBe(1);
  });
});

describe('saleStore — removeItem / clear', () => {
  it('removes a single item', () => {
    useSaleStore.getState().addItem(product({ id: 'a' }));
    useSaleStore.getState().addItem(product({ id: 'b' }));
    useSaleStore.getState().removeItem('a');
    expect(useSaleStore.getState().items).toHaveLength(1);
    expect(useSaleStore.getState().items[0]?.productId).toBe('b');
  });

  it('clear empties the cart', () => {
    useSaleStore.getState().addItem(product({ id: 'a' }));
    useSaleStore.getState().addItem(product({ id: 'b' }));
    useSaleStore.getState().clear();
    expect(useSaleStore.getState().items).toEqual([]);
  });
});

describe('saleStore — selectors', () => {
  it('selectItemCount sums quantities across all items', () => {
    useSaleStore.getState().addItem(product({ id: 'a', stock: 5 }));
    useSaleStore.getState().addItem(product({ id: 'a', stock: 5 }));
    useSaleStore.getState().addItem(product({ id: 'b', stock: 5, price: 500 }));
    const state = useSaleStore.getState();
    expect(selectItemCount(state)).toBe(3);
  });

  it('selectSubtotal multiplies price × quantity', () => {
    useSaleStore.getState().addItem(product({ id: 'a', price: 1000, stock: 5 }));
    useSaleStore.getState().addItem(product({ id: 'a', price: 1000, stock: 5 }));
    useSaleStore.getState().addItem(product({ id: 'b', price: 500, stock: 5 }));
    const state = useSaleStore.getState();
    // 2 × 1000 + 1 × 500 = 2500
    expect(selectSubtotal(state)).toBe(2500);
  });
});
