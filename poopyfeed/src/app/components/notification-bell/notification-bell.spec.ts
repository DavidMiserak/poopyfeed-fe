/**
 * Tests for NotificationBellComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { NotificationBellComponent } from './notification-bell';
import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import type { Notification } from '../../models/notification.model';

describe('NotificationBellComponent', () => {
  let fixture: ComponentFixture<NotificationBellComponent>;
  let compiled: HTMLElement;
  let mockNotificationService: {
    notifications: ReturnType<typeof signal<Notification[]>>;
    unreadCount: ReturnType<typeof signal<number>>;
    list: ReturnType<typeof vi.fn>;
    markAsRead: ReturnType<typeof vi.fn>;
    markAllRead: ReturnType<typeof vi.fn>;
    startUnreadCountPolling: ReturnType<typeof vi.fn>;
  };
  let mockToast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let router: Router;

  const mockNotification: Notification = {
    id: 1,
    event_type: 'feeding',
    message: 'Alice logged a feeding for Baby Bob',
    is_read: false,
    created_at: '2025-02-26T12:00:00Z',
    actor_name: 'Alice',
    child_name: 'Baby Bob',
    child_id: 42,
  };

  beforeEach(async () => {
    mockToast = { success: vi.fn(), error: vi.fn() };
    mockNotificationService = {
      notifications: signal<Notification[]>([]),
      unreadCount: signal(0),
      list: vi.fn().mockReturnValue(of([])),
      markAsRead: vi.fn().mockReturnValue(of({ ...mockNotification, is_read: true })),
      markAllRead: vi.fn().mockReturnValue(of(1)),
      startUnreadCountPolling: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideRouter([]),
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    compiled = fixture.nativeElement as HTMLElement;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call startUnreadCountPolling on init', () => {
    expect(mockNotificationService.startUnreadCountPolling).toHaveBeenCalled();
  });

  it('should have bell button with aria-label Notifications', () => {
    const btn = compiled.querySelector('button[aria-label="Notifications"]');
    expect(btn).toBeTruthy();
  });

  it('should hide badge when unread count is 0', () => {
    mockNotificationService.unreadCount.set(0);
    fixture.detectChanges();
    const badge = compiled.querySelector('.notification-bell-badge');
    expect(badge).toBeNull();
  });

  it('should show badge with count when unread count > 0', () => {
    mockNotificationService.unreadCount.set(3);
    fixture.detectChanges();
    const badge = compiled.querySelector('.notification-bell-badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent?.trim()).toBe('3');
  });

  it('should show 99+ when unread count > 99', () => {
    mockNotificationService.unreadCount.set(100);
    fixture.detectChanges();
    const badge = compiled.querySelector('.notification-bell-badge');
    expect(badge?.textContent?.trim()).toBe('99+');
  });

  it('should toggle dropdown on bell click', () => {
    const btn = compiled.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
    expect(fixture.componentInstance.dropdownOpen()).toBe(false);
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.dropdownOpen()).toBe(true);
    expect(compiled.querySelector('#notification-dropdown')).toBeTruthy();
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.dropdownOpen()).toBe(false);
  });

  it('should call list() when opening dropdown with empty notifications', () => {
    mockNotificationService.notifications.set([]);
    const btn = compiled.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(mockNotificationService.list).toHaveBeenCalled();
  });

  it('should show Mark all read when unread count > 0 and dropdown open', () => {
    mockNotificationService.unreadCount.set(2);
    mockNotificationService.notifications.set([mockNotification]);
    fixture.detectChanges();
    const btn = compiled.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    const buttons = compiled.querySelectorAll('.notification-bell-dropdown button');
    const markAllReadButton = Array.from(buttons).find((b) => b.textContent?.trim() === 'Mark all read');
    expect(markAllReadButton).toBeTruthy();
  });

  it('should call markAllRead when Mark all read is clicked', () => {
    mockNotificationService.unreadCount.set(1);
    mockNotificationService.notifications.set([mockNotification]);
    fixture.detectChanges();
    const bellBtn = compiled.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
    bellBtn.click();
    fixture.detectChanges();
    const markAllReadButton = Array.from(compiled.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Mark all read'
    );
    markAllReadButton?.click();
    expect(mockNotificationService.markAllRead).toHaveBeenCalled();
  });

  it('should navigate to child dashboard and mark read when notification clicked', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    mockNotificationService.notifications.set([mockNotification]);
    fixture.detectChanges();
    const bellBtn = compiled.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
    bellBtn.click();
    fixture.detectChanges();
    const firstItem = compiled.querySelector('.notification-bell-item');
    expect(firstItem).toBeTruthy();
    (firstItem as HTMLButtonElement).click();
    expect(navigateSpy).toHaveBeenCalledWith(['/children', 42, 'dashboard']);
    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.dropdownOpen()).toBe(false);
  });

  it('should close dropdown when clicking outside', () => {
    const bellBtn = compiled.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
    bellBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.dropdownOpen()).toBe(true);
    fixture.componentInstance.onDocumentClick({ target: document.body } as unknown as MouseEvent);
    fixture.detectChanges();
    expect(fixture.componentInstance.dropdownOpen()).toBe(false);
  });

  it('should display notification message and icon in dropdown', () => {
    mockNotificationService.notifications.set([mockNotification]);
    fixture.detectChanges();
    const bellBtn = compiled.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
    bellBtn.click();
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Alice logged a feeding for Baby Bob');
    expect(compiled.textContent).toContain('🍼');
  });

  it('should show loading state while list() is in progress', () => {
    const listSubject = new Subject<Notification[]>();
    mockNotificationService.list.mockReturnValue(listSubject);
    mockNotificationService.notifications.set([]);
    const bellBtn = compiled.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
    bellBtn.click();
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Loading…');
    listSubject.next([]);
    listSubject.complete();
    fixture.detectChanges();
    expect(compiled.textContent).not.toContain('Loading…');
  });

  it('should show toast.error when list() fails', () => {
    mockNotificationService.list.mockReturnValue(
      throwError(() => new Error('List failed'))
    );
    mockNotificationService.notifications.set([]);
    const bellBtn = compiled.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
    bellBtn.click();
    fixture.detectChanges();
    expect(mockToast.error).toHaveBeenCalledWith('List failed');
  });

  it('should show toast.error when markAsRead() fails', () => {
    mockNotificationService.markAsRead.mockReturnValue(
      throwError(() => new Error('Mark read failed'))
    );
    mockNotificationService.notifications.set([mockNotification]);
    fixture.detectChanges();
    const bellBtn = compiled.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
    bellBtn.click();
    fixture.detectChanges();
    const firstItem = compiled.querySelector('.notification-bell-item') as HTMLButtonElement;
    firstItem.click();
    expect(mockToast.error).toHaveBeenCalledWith('Mark read failed');
  });

  it('should show toast.error when markAllRead() fails', () => {
    mockNotificationService.markAllRead.mockReturnValue(
      throwError(() => new Error('Mark all failed'))
    );
    mockNotificationService.unreadCount.set(1);
    mockNotificationService.notifications.set([mockNotification]);
    fixture.detectChanges();
    const bellBtn = compiled.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
    bellBtn.click();
    fixture.detectChanges();
    const markAllReadButton = Array.from(compiled.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Mark all read'
    );
    markAllReadButton?.click();
    expect(mockToast.error).toHaveBeenCalledWith('Mark all failed');
  });
});
