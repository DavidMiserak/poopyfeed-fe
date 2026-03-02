import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { ToastService } from '../services/toast.service';
import { getActivityIcon, formatActivityAge } from '../utils/date.utils';
import type { Notification } from '../models/notification.model';

@Component({
  selector: 'app-notifications-page',
  imports: [RouterLink],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPage implements OnInit {
  protected notificationService = inject(NotificationService);
  private router = inject(Router);
  private toast = inject(ToastService);

  /** Notifications shown on this page (all pages loaded so far). */
  notifications = signal<Notification[]>([]);
  isLoading = signal(true);
  loadError = signal<string | null>(null);
  /** True when there is a next page to load. */
  hasMore = signal(false);
  /** Next page number to fetch (1-based). */
  nextPage = signal(2);
  loadingMore = signal(false);
  markingAllRead = signal(false);

  protected formatActivityAge = formatActivityAge;
  protected getActivityIcon = getActivityIcon;

  ngOnInit(): void {
    this.loadFirstPage();
  }

  private loadFirstPage(): void {
    this.loadError.set(null);
    this.isLoading.set(true);
    this.notificationService.listPage(1).subscribe({
      next: (res) => {
        this.notifications.set(res.results);
        this.hasMore.set(!!res.next);
        this.nextPage.set(2);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  loadMore(): void {
    const page = this.nextPage();
    this.loadingMore.set(true);
    this.notificationService.listPage(page).subscribe({
      next: (res) => {
        this.notifications.update((prev) => [...prev, ...res.results]);
        this.hasMore.set(!!res.next);
        this.nextPage.set(page + 1);
        this.loadingMore.set(false);
      },
      error: (err: Error) => {
        this.toast.error(err.message);
        this.loadingMore.set(false);
      },
    });
  }

  onNotificationClick(notif: Notification): void {
    this.router.navigate(['/children', notif.child_id, 'dashboard']);
    if (!notif.is_read) {
      this.notificationService.markAsRead(notif.id).subscribe({
        error: (err: Error) => this.toast.error(err.message),
      });
    }
  }

  onMarkAllRead(): void {
    this.markingAllRead.set(true);
    this.notificationService.markAllRead().subscribe({
      next: (count) => {
        this.notifications.update((list) =>
          list.map((n) => ({ ...n, is_read: true }))
        );
        this.markingAllRead.set(false);
        this.toast.success(
          count > 0
            ? `Marked ${count} notification${count === 1 ? '' : 's'} as read`
            : 'All notifications marked as read'
        );
      },
      error: (err: Error) => {
        this.toast.error(err.message);
        this.markingAllRead.set(false);
      },
    });
  }

  retry(): void {
    this.loadFirstPage();
  }
}
