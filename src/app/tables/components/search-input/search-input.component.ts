import { Component, effect, output, signal } from '@angular/core';

@Component({
  selector: 'app-search-table-input',
  imports: [],
  templateUrl: './search-input.component.html',
})
export class SearchInputComponent {
  value = output<number>();

  inputValue = signal<number | null>(null);

  debounceEffect = effect((onCleanUp) => {
    const value = this.inputValue();

    const timeout = setTimeout(() => {
      if (value !== null) this.value.emit(value);

      return;
    }, 500);

    onCleanUp(() => {
      clearTimeout(timeout);
    });
  });
}
