import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AuthService } from '@auth/services/auth.service';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos
const CHECK_INTERVAL_MS     = 30 * 1000;       // revisión cada 30 s

const TRACKED_EVENTS = [
  'mousemove', 'mousedown', 'keydown',
  'touchstart', 'scroll', 'click', 'wheel',
] as const;

@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
  private doc        = inject(DOCUMENT);
  private authService = inject(AuthService);
  private ngZone     = inject(NgZone);

  private lastActivity = Date.now();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private boundReset   = () => this._resetTimer();

  /** Inicia el tracking. Llamar desde App root. */
  start(): void {
    if (this.intervalId) return; // ya iniciado

    // Registrar eventos fuera de la zona Angular para no disparar CD en cada movimiento
    this.ngZone.runOutsideAngular(() => {
      for (const event of TRACKED_EVENTS) {
        this.doc.addEventListener(event, this.boundReset, { passive: true });
      }

      this.intervalId = setInterval(() => {
        const elapsed = Date.now() - this.lastActivity;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          // Volver a la zona Angular para que el router funcione
          this.ngZone.run(() => this._onInactive());
        }
      }, CHECK_INTERVAL_MS);
    });
  }

  stop(): void {
    for (const event of TRACKED_EVENTS) {
      this.doc.removeEventListener(event, this.boundReset);
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private _resetTimer(): void {
    this.lastActivity = Date.now();
  }

  private _onInactive(): void {
    this.stop();
    this.authService.logout();
  }
}
