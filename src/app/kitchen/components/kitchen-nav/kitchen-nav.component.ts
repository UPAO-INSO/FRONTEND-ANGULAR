import { Component, computed, input, output, signal } from '@angular/core';

import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { ChangeStatusProductComponent } from '@products/components/change-status-product/change-status-product.component';
import { MenuDiarioModalComponent } from '@menu/components/menu-diario-modal/menu-diario-modal.component';
import {
  ProductType,
  PartialProductUpdate,
} from '@products/interfaces/product.type';
import { ContentOrder, OrderStatus } from '@orders/interfaces/order.interface';
import { SearchInputComponent } from '@src/app/tables/components/search-input/search-input.component';

@Component({
  selector: 'app-kitchen-nav',
  imports: [
    PaginationComponent,
    ChangeStatusProductComponent,
    MenuDiarioModalComponent,
    SearchInputComponent,
  ],
  templateUrl: './kitchen-nav.component.html',
})
export class KitchenNavComponent {
  orders = input<ContentOrder[]>();
  isLoading = input<boolean>(false);
  error = input<Error | undefined>();
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  refreshTrigger = input<number>(0);

  productTypes = input.required<ProductType[]>();

  selectedButtonProducts = signal<boolean>(false);
  showMenuDiario         = signal<boolean>(false);

  updatedProductStaus = output<PartialProductUpdate>();
  statusChange = output<{ orderId: number; newStatus: OrderStatus }>();
  refresh = output<void>();
  closeModal = output<void>();
  value = output<number>();

  modalStatus = computed(() => this.selectedButtonProducts());

  activeOrdersCount = computed(() => {
    const list = this.orders() ?? [];
    return list.filter(o =>
      o.orderStatus === OrderStatus.PENDING ||
      o.orderStatus === OrderStatus.PREPARING
    ).length;
  });

  pendingCount = computed(() =>
    (this.orders() ?? []).filter(o => o.orderStatus === OrderStatus.PENDING).length
  );

  preparingCount = computed(() =>
    (this.orders() ?? []).filter(o => o.orderStatus === OrderStatus.PREPARING).length
  );

  readyCount = computed(() =>
    (this.orders() ?? []).filter(o => o.orderStatus === OrderStatus.READY).length
  );

  tableNumberValue(number: number) {
    this.value.emit(number);
  }

  onProductStatusUpdated(product: PartialProductUpdate) {
    this.updatedProductStaus.emit(product);
  }

  onSelectedButton() {
    this.selectedButtonProducts.set(true);
  }

  onCloseModal() {
    this.selectedButtonProducts.set(false);
    this.closeModal.emit();
  }

  onOpenMenuDiario()  { this.showMenuDiario.set(true); }
  onCloseMenuDiario() { this.showMenuDiario.set(false); }

  onStatusChange(orderId: number, newStatus: OrderStatus) {
    this.statusChange.emit({ orderId, newStatus });
  }

  onRefresh() {
    this.refresh.emit();
  }
}
