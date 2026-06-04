import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ContentPayment,
  PaymentType,
} from '@src/app/payments/interfaces/payments.inteface';
import { VoucherService } from '@src/app/vouchers/services/voucher.service';
import {
  CreateVoucherRequest,
  NubefactItem,
  VoucherType,
} from '@src/app/vouchers/interfaces/nubefact.interface';
import { ClientService } from '@src/app/clients/service/client.service';
import {
  Client,
  DocumentType,
} from '@src/app/clients/interfaces/client.interface';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-create-voucher-modal',
  imports: [CommonModule],
  templateUrl: './create-voucher-modal.component.html',
})
export class CreateVoucherModalComponent {
  private voucherService = inject(VoucherService);
  private clientService = inject(ClientService);

  payment = input.required<ContentPayment>();
  isOpen = input.required<boolean>();

  close = output<void>();
  voucherCreated = output<void>();

  voucherType = signal<VoucherType>(VoucherType.RECEIPT);
  isProcessing = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  VoucherType = VoucherType;

  getPaymentTypeLabel() {
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
  }

  generateVoucher() {
    const payment = this.payment();

    if (!payment.order || !payment.order.productOrders.length) {
      this.errorMessage.set('El pago no tiene productos asociados');
      return;
    }

    if (!payment.customerId) {
      this.errorMessage.set('El pago no tiene un cliente asociado');
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Primero obtenemos los datos del cliente
    this.clientService
      .getClientById(payment.customerId)
      .pipe(
        switchMap((client) => {
          const voucherData = this.buildVoucherRequest(payment, client);
          return this.voucherService.createVoucher(
            voucherData,
            this.voucherType()
          );
        }),
        switchMap((voucherResponse) => {
          // Asociar el voucher con el pago
          return this.voucherService.associatePayment(
            voucherResponse.id,
            payment.id
          );
        })
      )
      .subscribe({
        next: (response) => {
          this.isProcessing.set(false);
          this.successMessage.set('Comprobante generado exitosamente');
          this.voucherCreated.emit();

          setTimeout(() => {
            this.onClose();
          }, 2000);
        },
        error: (error) => {
          console.error('Error al generar comprobante:', error);
          this.isProcessing.set(false);
          this.errorMessage.set(
            error.message ||
              'Error al generar el comprobante. Intente nuevamente.'
          );
        },
      });
  }

  private buildVoucherRequest(
    payment: ContentPayment,
    client: Client
  ): CreateVoucherRequest {
    const IGV_RATE = 0.18;
    const total = payment.amount / 100; // Convertir de centavos a soles

    // Construir items desde productOrders
    const items: NubefactItem[] = payment.order.productOrders.map((product) => {
      const itemTotal = product.subtotal;
      const itemGravada = itemTotal / (1 + IGV_RATE);
      const itemIgv = itemTotal - itemGravada;
      const precioUnitario = product.unitPrice;
      const valorUnitario = precioUnitario / (1 + IGV_RATE);

      return {
        unidad_de_medida: 'NIU',
        codigo: String(product.productId).padStart(3, '0'),
        codigo_producto_sunat: '51121703', // Código genérico para alimentos preparados
        descripcion: product.productName,
        cantidad: product.quantity,
        valor_unitario: parseFloat(valorUnitario.toFixed(2)),
        precio_unitario: parseFloat(precioUnitario.toFixed(2)),
        subtotal: parseFloat(itemGravada.toFixed(2)),
        tipo_de_igv: 1,
        igv: parseFloat(itemIgv.toFixed(2)),
        total: parseFloat(itemTotal.toFixed(2)),
        anticipo_regularizacion: false,
      };
    });

    // Calcular totales correctamente desde los items
    const totalGravada = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalIgv = items.reduce((sum, item) => sum + item.igv, 0);
    const totalCalculado = items.reduce((sum, item) => sum + item.total, 0);

    // Fecha actual en formato dd-mm-yyyy
    const today = new Date();
    const fechaEmision = `${today.getDate()}-${
      today.getMonth() + 1
    }-${today.getFullYear()}`;

    // Número de comprobante: Boletas desde 5, Facturas desde 25
    const numero = this.voucherType() === VoucherType.RECEIPT ? 7 : 25;

    // Determinar tipo de documento según el voucher type y el cliente
    let tipoDocumento: number;
    let numeroDocumento: string;

    if (this.voucherType() === VoucherType.RECEIPT) {
      // Para boletas, usar el documento del cliente (DNI o RUC)
      tipoDocumento = client.documentType === DocumentType.RUC ? 6 : 1;
      numeroDocumento = client.documentNumber;
    } else {
      // Para facturas, DEBE ser RUC (tipo 6)
      if (client.documentType !== DocumentType.RUC) {
        throw new Error('Para emitir facturas se requiere un cliente con RUC');
      }
      tipoDocumento = 6;
      numeroDocumento = client.documentNumber;
    }

    const denominacion = `${client.name} ${client.lastname}`.trim();

    // Construir dirección completa
    const direccion =
      client.completeAddress ||
      `${client.district}, ${client.province}, ${client.deparment}`.trim();

    return {
      serie: this.voucherType() === VoucherType.RECEIPT ? 'BBB1' : 'FFF1',
      numero: numero,
      sunat_transaction: 1,
      cliente_tipo_de_documento: tipoDocumento,
      cliente_numero_de_documento: numeroDocumento,
      cliente_denominacion: denominacion,
      cliente_direccion: direccion,
      cliente_email: client.email || 'cliente@example.com',
      fecha_de_emision: fechaEmision,
      moneda: 1, // PEN
      porcentaje_de_igv: 18.0,
      total_gravada: parseFloat(totalGravada.toFixed(2)),
      total_igv: parseFloat(totalIgv.toFixed(2)),
      total: parseFloat(totalCalculado.toFixed(2)),
      observaciones: payment.description || '',
      enviar_automaticamente_a_la_sunat: false,
      enviar_automaticamente_al_cliente: true,
      items,
    };
  }
}
