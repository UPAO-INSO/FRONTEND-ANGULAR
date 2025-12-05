import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentPayment } from '@src/app/payments/interfaces/payments.inteface';
import { VoucherService } from '@src/app/vouchers/services/voucher.service';
import {
  CreateVoucherRequest,
  NubefactItem,
  VoucherType,
} from '@src/app/vouchers/interfaces/nubefact.interface';

@Component({
  selector: 'app-create-voucher-modal',
  imports: [CommonModule],
  templateUrl: './create-voucher-modal.component.html',
})
export class CreateVoucherModalComponent {
  private voucherService = inject(VoucherService);

  payment = input.required<ContentPayment>();
  isOpen = input.required<boolean>();

  close = output<void>();
  voucherCreated = output<void>();

  voucherType = signal<VoucherType>(VoucherType.RECEIPT);
  isProcessing = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  VoucherType = VoucherType;

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

    this.isProcessing.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const voucherData = this.buildVoucherRequest(payment);

    this.voucherService
      .createVoucher(voucherData, this.voucherType())
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
            'Error al generar el comprobante. Intente nuevamente.'
          );
        },
      });
  }

  private buildVoucherRequest(payment: ContentPayment): CreateVoucherRequest {
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

    // Para facturas se requiere RUC (tipo 6), para boletas puede ser DNI (tipo 1)
    const tipoDocumento = this.voucherType() === VoucherType.RECEIPT ? 1 : 6;
    const numeroDocumento =
      this.voucherType() === VoucherType.RECEIPT ? '00000000' : '20000000016';
    const denominacion =
      this.voucherType() === VoucherType.RECEIPT
        ? 'Cliente General'
        : 'Empresa General SAC';

    return {
      serie: this.voucherType() === VoucherType.RECEIPT ? 'BBB1' : 'FFF1',
      numero: numero,
      sunat_transaction: 1,
      cliente_tipo_de_documento: tipoDocumento,
      cliente_numero_de_documento: numeroDocumento,
      cliente_denominacion: denominacion,
      cliente_direccion: 'Lima - Perú',
      cliente_email: 'cliente@example.com',
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
