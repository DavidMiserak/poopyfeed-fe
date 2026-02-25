import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimezoneBanner } from './timezone-banner';
import { TimezoneCheckService } from '../../services/timezone-check.service';
import { ToastService } from '../../services/toast.service';

describe('TimezoneBanner', () => {
  let component: TimezoneBanner;
  let fixture: ComponentFixture<TimezoneBanner>;
  let tzServiceMock: {
    showBanner: ReturnType<typeof signal<boolean>>;
    browserTimezone: ReturnType<typeof signal<string | null>>;
    profileTimezone: ReturnType<typeof signal<string>>;
    dismiss: ReturnType<typeof vi.fn>;
    updateToDetectedTimezone: ReturnType<typeof vi.fn>;
    finishUpdate: ReturnType<typeof vi.fn>;
  };
  let toastMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    tzServiceMock = {
      showBanner: signal(true),
      browserTimezone: signal<string | null>('America/Chicago'),
      profileTimezone: signal('America/New_York'),
      dismiss: vi.fn(),
      updateToDetectedTimezone: vi.fn(),
      finishUpdate: vi.fn(),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TimezoneBanner],
      providers: [
        { provide: TimezoneCheckService, useValue: tzServiceMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TimezoneBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show banner when showBanner is true', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="status"]')).toBeTruthy();
    expect(compiled.textContent).toContain('America/Chicago');
    expect(compiled.textContent).toContain('America/New_York');
  });

  it('should hide banner when showBanner is false', () => {
    tzServiceMock.showBanner.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="status"]')).toBeNull();
  });

  it('should call dismiss on dismiss click', () => {
    component.onDismiss();
    expect(tzServiceMock.dismiss).toHaveBeenCalled();
  });

  it('should update timezone on update click', () => {
    const mockProfile = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      timezone: 'America/Chicago',
    };
    tzServiceMock.updateToDetectedTimezone.mockReturnValue(of(mockProfile));

    component.onUpdate();

    expect(tzServiceMock.updateToDetectedTimezone).toHaveBeenCalled();
    expect(tzServiceMock.finishUpdate).toHaveBeenCalled();
    expect(tzServiceMock.dismiss).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith('Timezone updated successfully');
  });

  it('should show error toast on update failure', () => {
    tzServiceMock.updateToDetectedTimezone.mockReturnValue(
      throwError(() => new Error('Network error'))
    );

    component.onUpdate();

    expect(toastMock.error).toHaveBeenCalledWith('Network error');
    expect(tzServiceMock.finishUpdate).toHaveBeenCalled();
    expect(component.isUpdating()).toBe(false);
  });

  it('should handle null browser timezone gracefully', () => {
    tzServiceMock.updateToDetectedTimezone.mockReturnValue(undefined);

    component.onUpdate();

    expect(component.isUpdating()).toBe(false);
  });

  it('should disable update button while updating', () => {
    tzServiceMock.updateToDetectedTimezone.mockReturnValue(of({
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      timezone: 'America/Chicago',
    }));

    component.isUpdating.set(true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[aria-busy]');
    expect(button).toBeTruthy();
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Updating...');
  });
});
