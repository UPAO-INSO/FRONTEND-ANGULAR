import {
  Component,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import {
  ContentKitchen,
  KitchenOrderStatus,
  RESTKitchenOrders,
} from '../../interfaces/kitchen-order.interface';
import { OrderProductsComponent } from 'src/app/orders/components/register-order/order-products/order-products.component';
import {
  PartialProductUpdate,
  ProductType,
} from 'src/app/products/interfaces/product.type';
import { ChangeStatusProductComponent } from 'src/app/products/components/change-status-product/change-status-product.component';

@Component({
  selector: 'app-kitchen-nav',
  imports: [PaginationComponent, ChangeStatusProductComponent],
  templateUrl: './kitchen-nav.component.html',
})
export class KitchenNavComponent {
  orders = input<ContentKitchen[]>();
  isLoading = input<boolean>(false);
  error = input<Error | undefined>();

  currentPage = input<number>();
  totalPages = input<number>();

  productTypes = input.required<ProductType[]>();

  updatedProductStaus = output<PartialProductUpdate>();

  selectedButtonProducts = signal<boolean>(false);

  refreshTrigger = input<number>(0);

  // changeStatusProductComponent = viewChild(ChangeStatusProductComponent);

  statusChange = output<{ orderId: number; newStatus: KitchenOrderStatus }>();
  refresh = output<void>();
  closeModal = output<void>();

  modalStatus = computed(() => this.selectedButtonProducts());

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

  getActiveOrders(orders: ContentKitchen[]) {
    if (!orders) return;

    return (
      orders.filter((order) => order.orderStatus !== KitchenOrderStatus.READY)
        .length ?? 0
    );
  }

  onStatusChange(orderId: number, newStatus: KitchenOrderStatus) {
    this.statusChange.emit({ orderId, newStatus });
  }

  onRefresh() {
    this.refresh.emit();
  }

  onRefreshFilteredProducts() {
    // this.changeStatusProductComponent()?.onRefresh();
  }
}
