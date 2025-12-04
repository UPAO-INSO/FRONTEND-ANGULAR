import { Component, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  templateUrl: './welcome-page.component.html',
})
export default class WelcomePageComponent {
  envs = environment;
}
