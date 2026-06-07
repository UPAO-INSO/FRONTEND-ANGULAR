import { Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  ContentPayment,
  PaymentCustomer,
  PaymentType,
} from '@src/app/payments/interfaces/payments.inteface';
import { VoucherService } from '@src/app/vouchers/services/voucher.service';
import {
  CreateVoucherRequest,
  NubefactItem,
  VoucherType,
} from '@src/app/vouchers/interfaces/nubefact.interface';
import { ClientService } from '@src/app/clients/service/client.service';
import { Client, DocumentType } from '@src/app/clients/interfaces/client.interface';
import { switchMap, of, tap } from 'rxjs';

@Component({
  selector: 'app-create-voucher-modal',
  imports: [DatePipe],
  templateUrl: './create-voucher-modal.component.html',
})
export class CreateVoucherModalComponent {
  private voucherService  = inject(VoucherService);
  private clientService   = inject(ClientService);

  payment  = input.required<ContentPayment>();
  isOpen   = input.required<boolean>();

  close          = output<void>();
  voucherCreated = output<void>();

  voucherType    = signal<VoucherType>(VoucherType.RECEIPT);
  isProcessing   = signal<boolean>(false);
  errorMessage   = signal<string>('');
  successMessage = signal<string>('');

  readonly VoucherType = VoucherType;

  getPaymentTypeLabel(): string {
    return this.payment().paymentType === PaymentType.MOBILE_WALLET
      ? 'Billetera Digital'
      : 'Efectivo';
  }

  onClose() {
    this.close.emit();
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  selectVoucherType(type: VoucherType) {
    this.voucherType.set(type);
    this.errorMessage.set('');
  }

  generateVoucher() {
    const payment = this.payment();

    if (!payment.order?.productOrders?.length) {
      this.errorMessage.set('El pago no tiene productos asociados');
      return;
    }

    // El backend incluye el objeto `customer` completo en la respuesta
    const paymentCustomer = payment.customer;
    const customerId      = paymentCustomer?.id ?? payment.customerId;

    if (!paymentCustomer && !customerId) {
      this.errorMessage.set('El pago no tiene un cliente asociado');
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Si ya tenemos los datos del cliente en el pago, usarlos directamente
    const client$ = paymentCustomer
      ? of(this._paymentCustomerToClient(paymentCustomer))
      : this.clientService.getClientById(customerId);

    client$
      .pipe(
        switchMap((client) => {
          try {
            const voucherData = this._buildVoucherRequest(payment, client);
            // Incluir paymentId para que el backend asocie automáticamente
            voucherData.paymentId = payment.id;
            return this.voucherService.createVoucher(voucherData, this.voucherType());
          } catch (err: any) {
            throw new Error(err.message || 'Error al construir el comprobante');
          }
        })
        // La asociación se hace en el backend automáticamente con paymentId
      )
      .subscribe({
        next: () => {
          this.isProcessing.set(false);
          this.successMessage.set('Comprobante generado exitosamente');
          this.voucherCreated.emit();
          setTimeout(() => this.onClose(), 2000);
        },
        error: (error) => {
          console.error('Error al generar comprobante:', error);
          this.isProcessing.set(false);
          this.errorMessage.set(
            error?.message || 'Error al generar el comprobante. Intente nuevamente.'
          );
        },
      });
  }

  // ── Helpers privados ─────────────────────────────────────────────

  /** Adapta el PaymentCustomer (API) al tipo Client (frontend) */
  private _paymentCustomerToClient(c: PaymentCustomer): Client {
    return {
      id:              c.id,
      name:            c.name,
      lastname:        c.lastname,
      phone:           c.phone,
      documentNumber:  c.documentNumber,
      documentType:    (c.documentType as DocumentType) ?? DocumentType.DNI,
      email:           c.email,
      deparment:       c.departament,   // Note: frontend usa 'deparment' (sin 'a')
      province:        c.province,
      district:        c.district,
      completeAddress: c.completeAddress,
    };
  }

  private _buildVoucherRequest(
    payment: ContentPayment,
    client:  Client
  ): CreateVoucherRequest {
    const IGV_RATE = 0.18;
    const total    = payment.amount / 100; // centavos → soles

    const items: NubefactItem[] = payment.order.productOrders.map((product) => {
      const itemTotal     = product.subtotal;
      const itemGravada   = itemTotal / (1 + IGV_RATE);
      const itemIgv       = itemTotal - itemGravada;
      const precioUnit    = product.unitPrice;
      const valorUnit     = precioUnit / (1 + IGV_RATE);

      return {
        unidad_de_medida:       'NIU',
        codigo:                 String(product.productId).padStart(3, '0'),
        codigo_producto_sunat:  '51121703',
        descripcion:            product.productName,
        cantidad:               product.quantity,
        valor_unitario:         parseFloat(valorUnit.toFixed(2)),
        precio_unitario:        parseFloat(precioUnit.toFixed(2)),
        subtotal:               parseFloat(itemGravada.toFixed(2)),
        tipo_de_igv:            1,
        igv:                    parseFloat(itemIgv.toFixed(2)),
        total:                  parseFloat(itemTotal.toFixed(2)),
        anticipo_regularizacion: false,
      };
    });

    const totalGravada     = items.reduce((s, i) => s + i.subtotal, 0);
    const totalIgv         = items.reduce((s, i) => s + i.igv, 0);
    const totalCalculado   = items.reduce((s, i) => s + i.total, 0);

    const today         = new Date();
    const fechaEmision  = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    // El backend auto-incrementa el número real; este valor es sobrescrito
    const numero        = 0;

    let tipoDocumento: number;
    let numeroDocumento: string;

    if (this.voucherType() === VoucherType.RECEIPT) {
      tipoDocumento   = client.documentType === DocumentType.RUC ? 6 : 1;
      numeroDocumento = client.documentNumber;
    } else {
      if (client.documentType !== DocumentType.RUC) {
        throw new Error('Para emitir facturas se requiere un cliente con RUC');
      }
      tipoDocumento   = 6;
      numeroDocumento = client.documentNumber;
    }

    const denominacion = `${client.name} ${client.lastname}`.trim();
    const direccion    = client.completeAddress ||
      `${client.district}, ${client.province}, ${client.deparment}`.trim();

    return {
      serie:                          this.voucherType() === VoucherType.RECEIPT ? 'BBB1' : 'FFF1',
      numero,
      sunat_transaction:              1,
      cliente_tipo_de_documento:      tipoDocumento,
      cliente_numero_de_documento:    numeroDocumento,
      cliente_denominacion:           denominacion,
      cliente_direccion:              direccion,
      cliente_email:                  client.email || 'cliente@example.com',
      fecha_de_emision:               fechaEmision,
      moneda:                         1,
      porcentaje_de_igv:              18.0,
      total_gravada:                  parseFloat(totalGravada.toFixed(2)),
      total_igv:                      parseFloat(totalIgv.toFixed(2)),
      total:                          parseFloat(totalCalculado.toFixed(2)),
      observaciones:                  payment.description || '',
      enviar_automaticamente_a_la_sunat: false,
      enviar_automaticamente_al_cliente: true,
      items,
    };
  }
}
