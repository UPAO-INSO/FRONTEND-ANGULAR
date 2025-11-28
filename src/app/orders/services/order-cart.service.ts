import { Injectable, signal, computed } from '@angular/core';
import {
  Product,
  ProductsType,
} from '@src/app/products/interfaces/product.type';

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

@Injectable({
  providedIn: 'root',
})
export class OrderCartService {
  private _cartsByTable = signal<Map<number, CartItem[]>>(new Map());
  private _currentTableId = signal<number | null>(null);

  cartItems = computed(() => {
    const tableId = this._currentTableId();
    const carts = this._cartsByTable();
    return tableId ? carts.get(tableId) || [] : [];
  });

  cartSecondItems = computed(() =>
    this.cartItems().filter(
      (item) => item.product.productTypeName === ProductsType.SEGUNDOS
    )
  );

  cartStarterItems = computed(() =>
    this.cartItems().filter(
      (item) => item.product.productTypeName === ProductsType.ENTRADAS
    )
  );

  cartOtherItems = computed(() =>
    this.cartItems().filter(
      (item) =>
        item.product.productTypeName !== ProductsType.SEGUNDOS &&
        item.product.productTypeName !== ProductsType.ENTRADAS
    )
  );

  totalOthers = computed(() =>
    this.cartOtherItems().reduce((acc, item) => acc + item.quantity, 0)
  );

  totalItems = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.quantity, 0)
  );

  totalSeconds = computed(() =>
    this.cartSecondItems().reduce((acc, item) => acc + item.quantity, 0)
  );

  totalStarters = computed(() =>
    this.cartStarterItems().reduce((acc, item) => acc + item.quantity, 0)
  );

  subtotal = computed(() => {
    const others = this.cartOtherItems();
    const starters = this.cartStarterItems();
    const seconds = this.cartSecondItems();
    const totalStarters = this.totalStarters();
    const totalSeconds = this.totalSeconds();

    const secondsTotal = seconds.reduce((acc, item) => acc + item.subtotal, 0);

    const othersTotal = others.reduce((acc, item) => acc + item.subtotal, 0);

    let startersTotal = 0;
    if (totalStarters === totalSeconds) {
      startersTotal = 0;
    } else if (totalStarters > totalSeconds) {
      const excessStarters = totalStarters - totalSeconds;
      let remainingExcess = excessStarters;

      for (const starter of starters) {
        if (remainingExcess <= 0) break;

        const itemsToCharge = Math.min(starter.quantity, remainingExcess);
        startersTotal += starter.product.price * itemsToCharge;
        remainingExcess -= itemsToCharge;
      }
    }

    return secondsTotal + startersTotal + othersTotal;
  });

  tax = computed(() => this.subtotal() * 0.18);

  total = computed(() => this.subtotal() + this.tax());

  menuBreakdown = computed(() => {
    const totalStarters = this.totalStarters();
    const totalSeconds = this.totalSeconds();
    const totalOthers = this.totalOthers();

    const menusIncluded = Math.min(totalStarters, totalSeconds);
    const extraStarters = Math.max(0, totalStarters - totalSeconds);
    const secondsWithoutStarter = Math.max(0, totalSeconds - totalStarters);

    return {
      menusIncluded,
      extraStarters,
      secondsWithoutStarter,
      totalStarters,
      totalSeconds,
      totalOthers,
    };
  });

  setCurrentTable(tableId: number) {
    this._currentTableId.set(tableId);
  }

  private getTableCart(tableId: number): CartItem[] {
    const carts = this._cartsByTable();
    return carts.get(tableId) || [];
  }

  private updateTableCart(tableId: number, items: CartItem[]) {
    const carts = new Map(this._cartsByTable());
    carts.set(tableId, items);
    this._cartsByTable.set(carts);
  }

  addProduct(product: Product) {
    const tableId = this._currentTableId();
    if (!tableId) return;

    const currentItems = this.getTableCart(tableId);
    const existingItemIndex = currentItems.findIndex(
      (item) => item.product.id === product.id
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + 1,
        subtotal:
          updatedItems[existingItemIndex].product.price *
          (updatedItems[existingItemIndex].quantity + 1),
      };
      this.updateTableCart(tableId, updatedItems);
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        subtotal: product.price,
      };
      this.updateTableCart(tableId, [...currentItems, newItem]);
    }
  }

  addProductWithQuantity(product: Product, quantity: number) {
    const tableId = this._currentTableId();
    if (!tableId || quantity <= 0) return;

    const currentItems = this.getTableCart(tableId);
    const existingItemIndex = currentItems.findIndex(
      (item) => item.product.id === product.id
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...currentItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity,
        subtotal: updatedItems[existingItemIndex].product.price * newQuantity,
      };
      this.updateTableCart(tableId, updatedItems);
    } else {
      const newItem: CartItem = {
        product,
        quantity,
        subtotal: product.price * quantity,
      };
      this.updateTableCart(tableId, [...currentItems, newItem]);
    }
  }

  removeProduct(productId: number) {
    const tableId = this._currentTableId();
    if (!tableId) return;

    const currentItems = this.getTableCart(tableId);
    const updatedItems = currentItems.filter(
      (item) => item.product.id !== productId
    );
    this.updateTableCart(tableId, updatedItems);
  }

  updateQuantity(productId: number, quantity: number) {
    const tableId = this._currentTableId();
    if (!tableId) return;

    if (quantity <= 0) {
      this.removeProduct(productId);
      return;
    }

    const currentItems = this.getTableCart(tableId);
    const updatedItems = currentItems.map((item) =>
      item.product.id === productId
        ? { ...item, quantity, subtotal: item.product.price * quantity }
        : item
    );
    this.updateTableCart(tableId, updatedItems);
  }

  clearCurrentTableCart() {
    const tableId = this._currentTableId();
    if (!tableId) return;

    this.updateTableCart(tableId, []);
  }

  clearAllCarts() {
    this._cartsByTable.set(new Map());
  }

  createOrder() {
    const tableId = this._currentTableId();
    if (!tableId) return;

    this.clearCurrentTableCart();
  }

  getTablesWithOrders(): number[] {
    const carts = this._cartsByTable();
    return Array.from(carts.keys()).filter((tableId) => {
      const cart = carts.get(tableId);
      return cart && cart.length > 0;
    });
  }
}
