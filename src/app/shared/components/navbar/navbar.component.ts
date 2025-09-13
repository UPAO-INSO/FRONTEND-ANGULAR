import { Component, input } from '@angular/core';
import { SearchInputComponent } from '../search-input/search-input.component';

@Component({
  selector: 'app-navbar',
  imports: [SearchInputComponent],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  header = input.required<string>();
}
