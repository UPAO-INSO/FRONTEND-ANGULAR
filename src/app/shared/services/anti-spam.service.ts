import { Injectable, signal, computed } from '@angular/core';
import {
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  shareReplay,
  tap,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AntiSpamService {
  private _isProcessing = signal(false);
  private _lastActionTime = signal(0);
  private _actionCount = signal(0);

  private readonly DEBOUNCE_TIME = 300;
  private readonly COOLDOWN_TIME = 2000;
  private readonly MAX_ACTIONS_PER_MINUTE = 10;

  // Cache para observables en progreso
  private ongoingObservables = new Map<string, Observable<any>>();

  isProcessing = computed(() => this._isProcessing());
  canPerformAction = computed(() => {
    const now = Date.now();
    const timeSinceLastAction = now - this._lastActionTime();
    const actionCount = this._actionCount();

    return (
      timeSinceLastAction > this.COOLDOWN_TIME &&
      actionCount < this.MAX_ACTIONS_PER_MINUTE
    );
  });

  constructor() {
    setInterval(() => {
      this._actionCount.set(0);
    }, 60000);

    this.detectF5Spam();
  }

  wrapObservable<T>(
    key: string,
    observableFactory: () => Observable<T>,
    options?: {
      debounceTime?: number;
      cooldownTime?: number;
      enableCache?: boolean;
    }
  ): Observable<T> {
    const config = {
      debounceTime: options?.debounceTime ?? this.DEBOUNCE_TIME,
      cooldownTime: options?.cooldownTime ?? this.COOLDOWN_TIME,
      enableCache: options?.enableCache ?? true,
    };

    if (config.enableCache && this.ongoingObservables.has(key)) {
      return this.ongoingObservables.get(key)!;
    }

    const now = Date.now();
    const timeSinceLastAction = now - this._lastActionTime();

    if (
      timeSinceLastAction < config.cooldownTime &&
      this._lastActionTime() > 0
    ) {
      return this.ongoingObservables.get(key) || observableFactory();
    }

    this._actionCount.update((count) => count + 1);
    this._lastActionTime.set(now);
    this._isProcessing.set(true);

    const protected$ = new Subject<T>();

    const result$ = protected$.pipe(
      debounceTime(config.debounceTime),
      distinctUntilChanged(),
      shareReplay(1),
      tap({
        finalize: () => {
          this._isProcessing.set(false);
          if (config.enableCache) {
            setTimeout(() => {
              this.ongoingObservables.delete(key);
            }, 5000);
          }
        },
      })
    );

    if (config.enableCache) {
      this.ongoingObservables.set(key, result$);
    }

    setTimeout(() => {
      observableFactory().subscribe({
        next: (value) => protected$.next(value),
        error: (error) => protected$.error(error),
        complete: () => protected$.complete(),
      });
    }, 0);

    return result$;
  }

  private detectF5Spam(): void {
    let f5Count = 0;
    let lastF5Time = 0;

    document.addEventListener('keydown', (event) => {
      if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        const now = Date.now();

        if (now - lastF5Time < 1000) {
          f5Count++;
          if (f5Count > 3) {
            event.preventDefault();
            console.warn('🚫 F5 spam detected - refresh blocked');
            this.showSpamWarning();
          }
        } else {
          f5Count = 1;
        }

        lastF5Time = now;

        setTimeout(() => {
          f5Count = 0;
        }, 5000);
      }
    });

    window.addEventListener('beforeunload', () => {
      const now = Date.now();
      const lastRefresh = localStorage.getItem('lastRefresh');

      if (lastRefresh && now - parseInt(lastRefresh) < 2000) {
        console.warn('⚠️ Rapid refresh detected');
      }

      localStorage.setItem('lastRefresh', now.toString());
    });
  }

  private showSpamWarning(): void {
    const warning = document.createElement('div');
    warning.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      ">
        🚫 Demasiados refrescos detectados. Espera un momento.
      </div>
    `;

    document.body.appendChild(warning);

    setTimeout(() => {
      warning.remove();
    }, 3000);
  }

  clearCache(): void {
    this.ongoingObservables.clear();
    this._actionCount.set(0);
    this._isProcessing.set(false);
  }

  getStats() {
    return {
      isProcessing: this._isProcessing(),
      actionCount: this._actionCount(),
      lastActionTime: this._lastActionTime(),
      canPerformAction: this.canPerformAction(),
      cacheSize: this.ongoingObservables.size,
    };
  }
}
