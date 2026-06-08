import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { of } from 'rxjs';

import { PensionistaService } from '@pensionistas/services/pensionista.service';
import { ClientService } from '@src/app/clients/service/client.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { KpiCardComponent } from '@shared/components/kpi-card/kpi-card.component';
import {
  CreatePensionistaRequest,
  Pensionista,
  PensionistaConsumo,
} from '@pensionistas/interfaces/pensionista.interface';
import { Client } from '@src/app/clients/interfaces/client.interface';

@Component({
  selector: 'app-pensionistas-page',
  imports: [FormsModule, DatePipe, DecimalPipe, PageHeaderComponent, KpiCardComponent],
  templateUrl: './pensionistas-page.component.html',
})
export default class PensionistasPageComponent {
  private service         = inject(PensionistaService);
  private clientService = inject(ClientService);

  // ── Resources ─────────────────────────────────────────────────────
  pensionistasResource = rxResource({
    stream: () => this.service.findAll(),
  });

  // ── Computed ──────────────────────────────────────────────────────
  pensionistas = computed(() => this.pensionistasResource.value()?.content ?? []);
  activos      = computed(() => this.pensionistas().filter(p => p.active).length);
  sinCreditos  = computed(() => this.pensionistas().filter(p => p.creditsRemaining === 0).length);

  // ── Modal crear/editar ────────────────────────────────────────────
  showModal    = signal(false);
  editTarget   = signal<Pensionista | null>(null);
  saving       = signal(false);
  saveError    = signal<string | null>(null);

  // Búsqueda de cliente para el modal
  selectedCustomer       = signal<Client | null>(null);
  customerQuery          = signal('');
  customerResults        = signal<Client[]>([]);
  customerDropdownOpen   = signal(false);
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  form = signal<Omit<CreatePensionistaRequest, 'customerId'>>({
    planCredits: 30, planPricePerMeal: 9, notes: '',
  });

  openCreate() {
    this.editTarget.set(null);
    this.selectedCustomer.set(null);
    this.customerQuery.set('');
    this.customerResults.set([]);
    this.customerDropdownOpen.set(false);
    this.form.set({ planCredits: 30, planPricePerMeal: 9, notes: '' });
    this.saveError.set(null);
    this.showModal.set(true);
  }

  openEdit(p: Pensionista) {
    this.editTarget.set(p);
    this.selectedCustomer.set(
      p.customerId ? { id: p.customerId, name: p.name, lastname: '', phone: p.phone ?? '', email: '', documentNumber: '', documentType: undefined, departament: '', province: '', district: '', completeAddress: '' } as unknown as Client : null
    );
    this.customerQuery.set('');
    this.customerResults.set([]);
    this.customerDropdownOpen.set(false);
    this.form.set({ planCredits: p.planCredits, planPricePerMeal: p.planPricePerMeal, notes: p.notes ?? '' });
    this.saveError.set(null);
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  patchForm(partial: Partial<Omit<CreatePensionistaRequest, 'customerId'>>) {
    this.form.update(f => ({ ...f, ...partial }));
  }

  planTotal = computed(() => (this.form().planCredits ?? 0) * (this.form().planPricePerMeal ?? 0));

  onCustomerQueryChange(value: string) {
    this.customerQuery.set(value);
    this.selectedCustomer.set(null);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    const q = value.trim();
    if (q.length < 2) {
      this.customerResults.set([]);
      this.customerDropdownOpen.set(false);
      return;
    }
    this.searchDebounce = setTimeout(() => {
      this.clientService.searchByName(q).subscribe({
        next: (results) => {
          this.customerResults.set(results);
          this.customerDropdownOpen.set(true);
        },
      });
    }, 300);
  }

  selectCustomer(customer: Client) {
    this.selectedCustomer.set(customer);
    this.customerDropdownOpen.set(false);
    this.customerQuery.set('');
  }

  clearCustomer() {
    this.selectedCustomer.set(null);
    this.customerQuery.set('');
    this.customerDropdownOpen.set(false);
  }

  createAndSelectCustomer(name: string) {
    this.customerDropdownOpen.set(false);
    this.clientService.quickCreate(name.trim()).subscribe({
      next: (customer) => this.selectCustomer(customer),
    });
  }

  save() {
    const customer = this.selectedCustomer();
    if (!customer) return;

    this.saving.set(true);
    this.saveError.set(null);

    const dto: CreatePensionistaRequest = { ...this.form(), customerId: customer.id };

    const req = this.editTarget()
      ? this.service.update(this.editTarget()!.id, dto)
      : this.service.create(dto);

    req.subscribe({
      next: () => { this.closeModal(); this.pensionistasResource.reload(); },
      error: (err) => {
        this.saveError.set(err?.error?.message ?? 'Error al guardar');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  // ── Panel de historial ────────────────────────────────────────────
  historialPensionista = signal<Pensionista | null>(null);
  consumosResource = rxResource({
    params: () => this.historialPensionista()?.id,
    stream: ({ params }) => params != null
      ? this.service.findConsumos(params)
      : of([] as PensionistaConsumo[]),
  });

  consumos     = computed(() => this.consumosResource.value() ?? []);
  showHistorial = signal(false);

  openHistorial(p: Pensionista) {
    this.historialPensionista.set(p);
    this.showHistorial.set(true);
  }

  closeHistorial() { this.showHistorial.set(false); }

  // ── Renovar plan ──────────────────────────────────────────────────
  renewTarget  = signal<Pensionista | null>(null);
  renewCredits = signal(30);
  showRenew    = signal(false);
  renewError   = signal<string | null>(null);
  renewing     = signal(false);

  openRenew(p: Pensionista) {
    this.renewTarget.set(p);
    this.renewCredits.set(30);
    this.renewError.set(null);
    this.showRenew.set(true);
  }

  closeRenew() { this.showRenew.set(false); }

  renew() {
    const p = this.renewTarget();
    if (!p) return;
    this.renewing.set(true);
    this.service.renew(p.id, this.renewCredits()).subscribe({
      next: () => { this.closeRenew(); this.pensionistasResource.reload(); },
      error: (err) => { this.renewError.set(err?.error?.message ?? 'Error al renovar'); this.renewing.set(false); },
      complete: () => this.renewing.set(false),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  creditsPercent(p: Pensionista): number {
    return p.planCredits > 0 ? Math.round((p.creditsRemaining / p.planCredits) * 100) : 0;
  }

  creditsColor(p: Pensionista): string {
    const pct = this.creditsPercent(p);
    if (pct <= 10) return 'text-red-400';
    if (pct <= 30) return 'text-orange-400';
    return 'text-status-ready';
  }
}
