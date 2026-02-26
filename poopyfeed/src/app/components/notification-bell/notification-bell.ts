import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { getActivityIcon, formatActivityAge } from '../../utils/date.utils';
import type { Notification } from '../../models/notification.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent implements OnInit {
  protected notificationService = inject(NotificationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private elementRef = inject(ElementRef<HTMLElement>);
  private toast = inject(ToastService);

  dropdownOpen = signal(false);
  listLoading = signal(false);

  protected formatActivityAge = formatActivityAge;
  protected getActivityIcon = getActivityIcon;

  ngOnInit(): void {
    this.notificationService.startUnreadCountPolling(this.destroyRef);
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    const next = !this.dropdownOpen();
    this.dropdownOpen.set(next);
    if (next && this.notificationService.notifications().length === 0) {
      this.loadList();
    }
  }

  private loadList(): void {
    this.listLoading.set(true);
    this.notificationService.list().subscribe({
      next: () => this.listLoading.set(false),
      error: (err: Error) => {
        this.listLoading.set(false);
        this.toast.error(err.message);
      },
    });
  }

  onNotificationClick(notif: Notification, event: Event): void {
    event.preventDefault();
    this.router.navigate(['/children', notif.child_id, 'dashboard']);
    this.dropdownOpen.set(false);
    if (!notif.is_read) {
      this.notificationService.markAsRead(notif.id).subscribe({
        error: (err: Error) => this.toast.error(err.message),
      });
    }
  }

  onMarkAllRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.toast.success('All notifications marked as read');
      },
      error: (err: Error) => this.toast.error(err.message),
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      this.dropdownOpen() &&
      !this.elementRef.nativeElement.contains(event.target as Node)
    ) {
      this.dropdownOpen.set(false);
    }
  }
}
