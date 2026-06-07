import { Component, inject } from '@angular/core';
import { InactivityService } from '@src/app/shared/services/inactivity.service';
import { AuthService } from '@src/app/auth/services/auth.service';

@Component({
  selector: 'app-session-warning',
  templateUrl: './session-warning.component.html',
})
export class SessionWarningComponent {
  readonly inactivity = inject(InactivityService);
  readonly auth       = inject(AuthService);
}
