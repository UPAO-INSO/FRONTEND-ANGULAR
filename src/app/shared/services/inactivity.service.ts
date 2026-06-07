import { inject, Injectable, NgZone, OnDestroy, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AuthService } from '@auth/services/auth.service';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos de inactividad
const WARNING_BEFORE_MS     =      60 * 1000;  // advertir el último 1 minuto
const TICK_MS               =       1 * 1000;  // 1 segundo para countdown preciso

const TRACKED_EVENTS = [
  'mousemove', 'mousedown', 'keydown',
  'touchstart', 'scroll', 'click', 'wheel',
] as const;

@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
  private doc         = inject(DOCUMENT);
  private authService = inject(AuthService);
  private ngZone      = inject(NgZone);

  private lastActivity = Date.now();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private boundReset   = () => this._resetTimer();

  // ── Señales públicas ─────────────────────────────────────────────

  /** Muestra el toast de advertencia (último minuto) */
  readonly warningActive  = signal<boolean>(false);
  /** Segundos restantes mostrados en el countdown */
  readonly countdown      = signal<number>(60);
  /** La sesión ya expiró — mostrar modal de expiración */
  readonly sessionExpired = signal<boolean>(false);

  // ── Control ──────────────────────────────────────────────────────

  /** Inicia el tracking. Llamar desde App root. */
  start(): void {
    if (this.intervalId) return;

    this.ngZone.runOutsideAngular(() => {
      for (const event of TRACKED_EVENTS) {
        this.doc.addEventListener(event, this.boundReset, { passive: true });
      }

      this.intervalId = setInterval(() => {
        const elapsed    = Date.now() - this.lastActivity;
        const remaining  = INACTIVITY_TIMEOUT_MS - elapsed;

        if (remaining <= 0) {
          this.ngZone.run(() => this._onExpired());
        } else if (remaining <= WARNING_BEFORE_MS) {
          const secs = Math.ceil(remaining / 1000);
          this.ngZone.run(() => {
            this.warningActive.set(true);
            this.countdown.set(secs);
          });
        } else {
          // Fuera de la zona de advertencia — limpia si quedó activa
          if (this.warningActive()) {
            this.ngZone.run(() => {
              this.warningActive.set(false);
              this.countdown.set(60);
            });
          }
        }
      }, TICK_MS);
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

  /** El usuario confirmó que quiere seguir — reinicia el temporizador */
  extendSession(): void {
    this._resetTimer();
    this.warningActive.set(false);
    this.countdown.set(60);
  }

  ngOnDestroy(): void {
    this.stop();
  }

  // ── Privado ──────────────────────────────────────────────────────

  private _resetTimer(): void {
    this.lastActivity = Date.now();
  }

  private _onExpired(): void {
    this.stop();
    this.warningActive.set(false);
    this.sessionExpired.set(true);
    // Limpia el estado de auth pero NO navega — el modal maneja la confirmación
    this.authService.expireByInactivity();
  }
}
