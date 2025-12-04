import { Component, inject, signal } from '@angular/core';
import { PaymentsListComponent } from '../../components/payments-list/payments-list.component';
import { PaymentsService } from '../../services/payments.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { PaginationService } from '@src/app/shared/components/pagination/pagination.service';
import { PaymentType } from '../../interfaces/payments.inteface';

@Component({
  selector: 'app-payments-page',
  imports: [PaymentsListComponent],
  templateUrl: './payments-page.component.html',
})
export class PaymentsPageComponent {
  paymentsService = inject(PaymentsService);
  paginationService = inject(PaginationService);

  status = signal<string | null>(null);
  paymentType = signal<PaymentType | null>(null);

  paymentsResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      status: this.status(),
      paymentType: this.paymentType(),
    }),

    stream: ({ params }) => {
      return this.paymentsService.fetchPayments({
        page: params.page,
        status: params.status,
        paymentType: params.paymentType,
      });
    },
  });

  onStatusFilterChange(newStatus: string | null) {
    this.status.set(newStatus);
    this.paginationService.resetPage();
  }

  onPaymentTypeFilterChange(newType: PaymentType | null) {
    this.paymentType.set(newType);
    this.paginationService.resetPage();
  }
}
