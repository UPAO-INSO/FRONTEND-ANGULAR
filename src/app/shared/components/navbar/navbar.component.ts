import { Component, inject, input } from '@angular/core';
import { AuthService } from '@auth/services/auth.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  authService = inject(AuthService);

  header = input.required<string>();

  envs = environment;
}
