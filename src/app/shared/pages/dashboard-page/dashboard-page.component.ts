import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationsComponent } from '@shared/components/notifications/notifications.component';
import { SessionWarningComponent } from '@shared/components/session-warning/session-warning.component';
import { SidebarComponent } from '@shared/components/sidebar/sidebar.component';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterOutlet, SidebarComponent, NotificationsComponent, SessionWarningComponent],
  templateUrl: './dashboard-page.component.html',
})
export default class DashboardPageComponent {
  envs = environment;
  sidebarOpen = signal(false);

  toggleSidebar() { this.sidebarOpen.update(v => !v); }
  closeSidebar()  { this.sidebarOpen.set(false); }
}
