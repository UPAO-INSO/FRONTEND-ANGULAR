import { Component, computed, input, output, signal } from '@angular/core';

import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { ChangeStatusProductComponent } from '@products/components/change-status-product/change-status-product.component';
import {
  ProductType,
  PartialProductUpdate,
} from '@products/interfaces/product.type';

import {
  ContentKitchen,
  KitchenOrderStatus,
} from '../../interfaces/kitchen-order.interface';
import { SearchInputComponent } from 'src/app/tables/components/search-input/search-input.component';
import { ContentOrder, OrderStatus } from '@orders/interfaces/order.interface';

@Component({
  selector: 'app-kitchen-nav',
  imports: [
    PaginationComponent,
    ChangeStatusProductComponent,
    SearchInputComponent,
  ],
  templateUrl: './kitchen-nav.component.html',
})
export class KitchenNavComponent {
  orders = input<ContentOrder[]>();
  isLoading = input<boolean>(false);
  error = input<Error | undefined>();
  currentPage = input<number>();
  totalPages = input<number>();
  refreshTrigger = input<number>(0);

  productTypes = input.required<ProductType[]>();

  selectedButtonProducts = signal<boolean>(false);

  updatedProductStaus = output<PartialProductUpdate>();
  statusChange = output<{ orderId: number; newStatus: KitchenOrderStatus }>();
  refresh = output<void>();
  closeModal = output<void>();
  value = output<number>();

  modalStatus = computed(() => this.selectedButtonProducts());

  activeOrdersCount = computed(() => {
    const ordersList = this.orders();
    if (!ordersList) return 0;

    return ordersList.filter(
      (order) =>
        order.orderStatus === KitchenOrderStatus.PREPARING ||
        order.orderStatus === KitchenOrderStatus.PENDING ||
        order.orderStatus === OrderStatus.PENDING ||
        order.orderStatus === OrderStatus.PREPARING
    ).length;
  });

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

  onStatusChange(orderId: number, newStatus: KitchenOrderStatus) {
    this.statusChange.emit({ orderId, newStatus });
  }

  onRefresh() {
    this.refresh.emit();
  }
}
