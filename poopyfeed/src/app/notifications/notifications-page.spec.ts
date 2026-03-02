import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { NotificationsPage } from './notifications-page';
import { NotificationService } from '../services/notification.service';
import { ToastService } from '../services/toast.service';
import type { Notification } from '../models/notification.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockNotification: Notification = {
  id: 1,
  event_type: 'feeding',
  message: 'Alice logged a feeding for Baby Bob',
  is_read: false,
  created_at: '2024-02-10T14:00:00Z',
  actor_name: 'Alice',
  child_name: 'Baby Bob',
  child_id: 2,
};

describe('NotificationsPage', () => {
  let component: NotificationsPage;
  let fixture: ComponentFixture<NotificationsPage>;
  let notificationService: NotificationService;
  let router: Router;

  beforeEach(async () => {
    const listPageMock = vi.fn().mockReturnValue(
      of({
        count: 1,
        next: null,
        previous: null,
        results: [mockNotification],
      })
    );
    await TestBed.configureTestingModule({
      imports: [NotificationsPage],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: NotificationService,
          useValue: {
            listPage: listPageMock,
            list: vi.fn(),
            markAsRead: vi.fn().mockReturnValue(of({ ...mockNotification, is_read: true })),
            markAllRead: vi.fn().mockReturnValue(of(1)),
            unreadCount: () => 1,
            notifications: () => [],
          },
        },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsPage);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(NotificationService);
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load first page on init', () => {
    fixture.detectChanges();
    expect(notificationService.listPage).toHaveBeenCalledWith(1);
    expect(component.notifications()).toEqual([mockNotification]);
    expect(component.isLoading()).toBe(false);
  });

  it('should show error state on load failure', () => {
    vi.mocked(notificationService.listPage).mockReturnValue(
      throwError(() => new Error('Network error'))
    );
    fixture.detectChanges();
    expect(component.loadError()).toBe('Network error');
    expect(component.isLoading()).toBe(false);
  });

  it('should navigate to child dashboard on notification click', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    fixture.detectChanges();
    component.onNotificationClick(mockNotification);
    expect(navigateSpy).toHaveBeenCalledWith(['/children', 2, 'dashboard']);
  });
});
