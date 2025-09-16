import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HeaderStateService {
  header = signal<string>('');

  changeHeader(value: string) {
    this.header.set(value);
  }
}
