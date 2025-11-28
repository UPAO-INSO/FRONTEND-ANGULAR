import { Component, effect, output, signal } from '@angular/core';

@Component({
  selector: 'app-search-product-input',
  imports: [],
  templateUrl: './search-product-input.component.html',
})
export class SearchProductInputComponent {
  value = output<string>();

  inputValue = signal<string | null>(null);
  debouncedSearch = signal<string | null>(null);

  debounceEffect = effect((onCleanUp) => {
    const value = this.inputValue();

    const timeout = setTimeout(() => {
      if (value !== null) {
        this.debouncedSearch.set(value);
        this.value.emit(value);
      }

      return;
    }, 500);

    onCleanUp(() => {
      clearTimeout(timeout);
    });
  });
}
