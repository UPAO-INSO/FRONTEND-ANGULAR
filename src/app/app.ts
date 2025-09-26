import { Component, signal, input, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderStateService } from './shared/services/header-state.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('pov-app');

  headerStateService = inject(HeaderStateService);
}
