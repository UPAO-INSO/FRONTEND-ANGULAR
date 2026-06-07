import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { ProfileResponse } from '../../interfaces/profile.interface';

interface SectionState {
  loading: boolean;
  success: string | null;
  error: string | null;
}

function freshState(): SectionState {
  return { loading: false, success: null, error: null };
}

@Component({
  selector: 'app-profile-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent implements OnInit {
  private profileService = inject(ProfileService);

  profile = signal<ProfileResponse | null>(null);
  loading = signal(true);

  // Formulario personal
  personal = { name: '', lastname: '', phone: '' };
  personalState = signal<SectionState>(freshState());

  // Formulario cuenta
  newUsername = '';
  usernameState = signal<SectionState>(freshState());
  newEmail = '';
  emailState = signal<SectionState>(freshState());

  // Formulario contraseña
  password = { currentPassword: '', newPassword: '', confirmPassword: '' };
  passwordState = signal<SectionState>(freshState());

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.personal = { name: data.name ?? '', lastname: data.lastname ?? '', phone: data.phone ?? '' };
        this.newUsername = data.username;
        this.newEmail = data.email;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get initials(): string {
    const p = this.profile();
    if (!p) return '?';
    return `${p.name?.charAt(0) ?? ''}${p.lastname?.charAt(0) ?? ''}`.toUpperCase() || '?';
  }

  savePersonal(): void {
    this.personalState.set({ loading: true, success: null, error: null });
    this.profileService.updatePersonal(this.personal).subscribe({
      next: (data) => {
        this.profile.set(data);
        this.personalState.set({ loading: false, success: 'Datos actualizados correctamente.', error: null });
      },
      error: (e) => {
        const msg = e?.error?.message ?? 'Error al actualizar los datos.';
        this.personalState.set({ loading: false, success: null, error: msg });
      },
    });
  }

  saveUsername(): void {
    this.usernameState.set({ loading: true, success: null, error: null });
    this.profileService.updateUsername(this.newUsername).subscribe({
      next: (data) => {
        this.profile.set(data);
        this.usernameState.set({ loading: false, success: 'Usuario actualizado.', error: null });
      },
      error: (e) => {
        const msg = e?.error?.message ?? 'Error al actualizar el usuario.';
        this.usernameState.set({ loading: false, success: null, error: msg });
      },
    });
  }

  saveEmail(): void {
    this.emailState.set({ loading: true, success: null, error: null });
    this.profileService.updateEmail(this.newEmail).subscribe({
      next: (data) => {
        this.profile.set(data);
        this.emailState.set({ loading: false, success: 'Correo actualizado.', error: null });
      },
      error: (e) => {
        const msg = e?.error?.message ?? 'Error al actualizar el correo.';
        this.emailState.set({ loading: false, success: null, error: msg });
      },
    });
  }

  savePassword(): void {
    if (this.password.newPassword !== this.password.confirmPassword) {
      this.passwordState.set({ loading: false, success: null, error: 'Las contraseñas no coinciden.' });
      return;
    }
    this.passwordState.set({ loading: true, success: null, error: null });
    this.profileService.updatePassword({
      currentPassword: this.password.currentPassword,
      newPassword: this.password.newPassword,
    }).subscribe({
      next: () => {
        this.password = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.passwordState.set({ loading: false, success: 'Contraseña actualizada correctamente.', error: null });
      },
      error: (e) => {
        const msg = e?.error?.message ?? 'Error al cambiar la contraseña.';
        this.passwordState.set({ loading: false, success: null, error: msg });
      },
    });
  }

  roleLabel(role: string | null | undefined): string {
    const map: Record<string, string> = {
      ADMINISTRADOR: 'Administrador',
      GERENTE: 'Gerente',
      CAJERO: 'Cajero',
      COCINERO: 'Cocinero',
      MESERO: 'Mesero',
    };
    return map[role ?? ''] ?? role ?? '—';
  }

  jobLabel(job: string | null | undefined): string {
    const map: Record<string, string> = {
      ADMINISTRADOR: 'Administrador',
      GERENTE: 'Gerente',
      CAJERO: 'Cajero',
      COCINERO: 'Cocinero',
      MESERO: 'Mesero',
    };
    return map[job ?? ''] ?? job ?? '—';
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return 'Nunca';
    return new Date(iso).toLocaleString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
