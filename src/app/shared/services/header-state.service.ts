import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HeaderStateService {
  header = signal<string>('Dashboard');

  changeHeader(value: string) {
    this.header.set(value);
  }
}
