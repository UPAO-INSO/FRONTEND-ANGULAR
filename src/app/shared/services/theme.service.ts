import { inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'pds-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private doc = inject(DOCUMENT);

  readonly theme = signal<Theme>(this.loadTheme());

  constructor() {
    this.apply(this.theme());
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.theme.set(theme);
    this.apply(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  private apply(theme: Theme): void {
    this.doc.documentElement.setAttribute('data-theme', theme);
  }

  private loadTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
