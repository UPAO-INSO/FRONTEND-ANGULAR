import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AppNotification,
  NotificationService,
  NotificationType,
} from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent {
  notificationService = inject(NotificationService);

  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }

  /** Clases de borde/fondo según tipo */
  borderClass(type: NotificationType): string {
    switch (type) {
      case 'success': return 'border-l-status-ready   bg-status-ready/8';
      case 'warning': return 'border-l-status-pending bg-status-pending/8';
      case 'error':   return 'border-l-status-cancelled bg-status-cancelled/8';
      default:        return 'border-l-brand           bg-brand/8';
    }
  }

  /** Color del ícono según tipo */
  iconClass(type: NotificationType): string {
    switch (type) {
      case 'success': return 'text-status-ready';
      case 'warning': return 'text-status-pending';
      case 'error':   return 'text-status-cancelled';
      default:        return 'text-brand';
    }
  }

  trackById(_: number, n: AppNotification): string {
    return n.id;
  }
}
