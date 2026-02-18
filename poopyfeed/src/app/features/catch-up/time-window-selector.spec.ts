import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeWindowSelector } from './time-window-selector';
import { TimeEstimationService } from '../../services/time-estimation.service';
import { DateTimeService } from '../../services/datetime.service';
import { ToastService } from '../../services/toast.service';
import { TimeWindow } from '../../models';

describe('TimeWindowSelector', () => {
  let component: TimeWindowSelector;
  let fixture: ComponentFixture<TimeWindowSelector>;
  let timeEstimationService: any;
  let dateTimeService: any;
  let toastService: any;

  const mockTimeWindow: TimeWindow = {
    startTime: '2024-01-15T10:00:00Z',
    endTime: '2024-01-15T14:00:00Z',
  };

  beforeEach(async () => {
    timeEstimationService = {
      validateTimeWindow: vi.fn().mockReturnValue([]),
    };
    dateTimeService = {
      toInputFormat: vi.fn().mockImplementation((iso: string) => {
        const date = new Date(iso);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      }),
    };
    toastService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TimeWindowSelector],
      providers: [
        { provide: TimeEstimationService, useValue: timeEstimationService },
        { provide: DateTimeService, useValue: dateTimeService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeWindowSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should create component', () => {
      expect(component).toBeDefined();
    });

    it('should initialize with no preset selected', () => {
      expect(component.selectedPreset()).toBeNull();
    });

    it('should have empty form initially', () => {
      expect(component.timeForm.get('startTime')?.value).toBe('');
      expect(component.timeForm.get('endTime')?.value).toBe('');
    });

    it('should display duration as — when no times set', () => {
      expect(component.durationDisplay()).toBe('—');
    });
  });

  describe('Preset Buttons', () => {
    it('should apply 4-hour preset', () => {
      component.applyPreset('4h');

      expect(component.selectedPreset()).toBe('4h');
      expect(component.timeForm.get('startTime')?.value).toBeTruthy();
      expect(component.timeForm.get('endTime')?.value).toBeTruthy();
    });

    it('should apply 8-hour preset', () => {
      component.applyPreset('8h');

      expect(component.selectedPreset()).toBe('8h');
      expect(component.timeForm.get('startTime')?.value).toBeTruthy();
      expect(component.timeForm.get('endTime')?.value).toBeTruthy();
    });

    it('should apply 24-hour preset', () => {
      component.applyPreset('24h');

      expect(component.selectedPreset()).toBe('24h');
      expect(component.timeForm.get('startTime')?.value).toBeTruthy();
      expect(component.timeForm.get('endTime')?.value).toBeTruthy();
    });

    it('should set custom preset without changing times', () => {
      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T14:00',
      });

      component.applyPreset('custom');

      expect(component.selectedPreset()).toBe('custom');
      expect(component.timeForm.get('startTime')?.value).toBe('2024-01-15T10:00');
      expect(component.timeForm.get('endTime')?.value).toBe('2024-01-15T14:00');
    });

    it('should clear validation error when applying preset', () => {
      component.validationError.set('Test error');

      component.applyPreset('4h');

      expect(component.validationError()).toBeNull();
    });
  });

  describe('Time Input Validation', () => {
    it('should validate on time change', () => {
      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T14:00',
      });

      component.onTimeChange();

      expect(timeEstimationService.validateTimeWindow).toHaveBeenCalled();
    });

    it('should show validation error when start > end', () => {
      timeEstimationService.validateTimeWindow.mockReturnValue([
        'Start time must be before end time',
      ]);

      component.timeForm.patchValue({
        startTime: '2024-01-15T14:00',
        endTime: '2024-01-15T10:00',
      });

      component.onTimeChange();

      expect(component.validationError()).toBe('Start time must be before end time');
    });

    it('should show validation error when end time in future', () => {
      timeEstimationService.validateTimeWindow.mockReturnValue([
        'End time cannot be in the future',
      ]);

      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2026-01-15T14:00',
      });

      component.onTimeChange();

      expect(component.validationError()).toBe('End time cannot be in the future');
    });

    it('should clear validation error on valid input', () => {
      component.validationError.set('Previous error');
      timeEstimationService.validateTimeWindow.mockReturnValue([]);

      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T14:00',
      });

      component.onTimeChange();

      expect(component.validationError()).toBeNull();
    });

    it('should handle invalid datetime format', () => {
      component.timeForm.patchValue({
        startTime: 'invalid',
        endTime: 'invalid',
      });

      component.onTimeChange();

      expect(component.validationError()).toBe('Invalid datetime format');
    });

    it('should not validate when start or end time missing', () => {
      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '',
      });

      component.onTimeChange();

      expect(component.validationError()).toBeNull();
    });
  });

  describe('Duration Display', () => {
    it('should calculate 4-hour duration', () => {
      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T14:00',
      });
      fixture.detectChanges();

      expect(component.durationDisplay()).toBe('4h');
    });

    it('should calculate 2.5-hour duration with minutes', () => {
      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T12:30',
      });
      fixture.detectChanges();

      expect(component.durationDisplay()).toBe('2h 30m');
    });

    it('should calculate duration in minutes only', () => {
      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T10:45',
      });
      fixture.detectChanges();

      expect(component.durationDisplay()).toBe('45m');
    });

    it('should show 0 minutes for same start and end', () => {
      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T10:00',
      });
      fixture.detectChanges();

      expect(component.durationDisplay()).toBe('0 minutes');
    });

    it('should show invalid message when start > end', () => {
      component.timeForm.patchValue({
        startTime: '2024-01-15T14:00',
        endTime: '2024-01-15T10:00',
      });
      fixture.detectChanges();

      expect(component.durationDisplay()).toContain('Invalid');
    });
  });

  describe('Apply Action', () => {
    it('should emit onTimeWindowChange on valid apply', () => {
      const emitSpy = vi.spyOn(component.onTimeWindowChange, 'emit');
      timeEstimationService.validateTimeWindow.mockReturnValue([]);

      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T14:00',
      });

      component.onApply();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should convert times to UTC ISO format when applying', () => {
      const emitSpy = vi.spyOn(component.onTimeWindowChange, 'emit');
      timeEstimationService.validateTimeWindow.mockReturnValue([]);

      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T14:00',
      });

      component.onApply();

      const emittedValue = emitSpy.mock.calls[0][0] as TimeWindow;
      expect(emittedValue.startTime).toContain('2024-01-15');
      expect(emittedValue.endTime).toContain('2024-01-15');
    });

    it('should not apply when form invalid', () => {
      const emitSpy = vi.spyOn(component.onTimeWindowChange, 'emit');

      component.timeForm.patchValue({
        startTime: '',
        endTime: '2024-01-15T14:00',
      });

      component.onApply();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should show error toast on validation failure during apply', () => {
      timeEstimationService.validateTimeWindow.mockReturnValue([
        'Start time must be before end time',
      ]);

      component.timeForm.patchValue({
        startTime: '2024-01-15T14:00',
        endTime: '2024-01-15T10:00',
      });

      component.onApply();

      expect(toastService.error).toHaveBeenCalledWith('Start time must be before end time');
    });

    it('should handle multiple validation errors', () => {
      timeEstimationService.validateTimeWindow.mockReturnValue([
        'Start time must be before end time',
        'End time cannot be in the future',
      ]);

      component.timeForm.patchValue({
        startTime: '2024-01-15T14:00',
        endTime: '2024-01-15T10:00',
      });

      component.onApply();

      expect(toastService.error).toHaveBeenCalledTimes(2);
    });

    it('should show generic error if apply throws exception', () => {
      timeEstimationService.validateTimeWindow.mockImplementation(() => {
        throw new Error('Service error');
      });

      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T14:00',
      });

      component.onApply();

      expect(toastService.error).toHaveBeenCalledWith('Failed to apply time window');
    });
  });

  describe('Cancel Action', () => {
    it('should emit onCancelClick event', () => {
      const emitSpy = vi.spyOn(component.onCancelClick, 'emit');

      component.handleCancel();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('Computed State', () => {
    it('should canApply be false when validating', () => {
      component.isValidating.set(true);

      expect(component.canApply()).toBe(false);
    });

    it('should canApply be false when validation error exists', () => {
      component.validationError.set('Test error');
      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T14:00',
      });

      expect(component.canApply()).toBe(false);
    });

    it('should canApply be true when form valid and no errors', () => {
      component.validationError.set(null);
      component.isValidating.set(false);
      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T14:00',
      });

      expect(component.canApply()).toBe(true);
    });
  });

  describe('Form State', () => {
    it('should mark form as invalid when required fields empty', () => {
      expect(component.timeForm.valid).toBe(false);
    });

    it('should mark form as valid when both times set', () => {
      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: '2024-01-15T14:00',
      });

      expect(component.timeForm.valid).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button[aria-label]');

      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons[0].getAttribute('aria-label')).toBeTruthy();
    });

    it('should have associated labels for form inputs', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const inputs = compiled.querySelectorAll('input[id]');

      expect(inputs.length).toBeGreaterThan(0);
      inputs.forEach((input) => {
        const label = compiled.querySelector(`label[for="${input.id}"]`);
        expect(label).toBeTruthy();
      });
    });

    it('should have aria-describedby for error messages', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const input = compiled.querySelector('input[aria-describedby]');

      expect(input).toBeTruthy();
      expect(input?.getAttribute('aria-describedby')).toBeTruthy();
    });

    it('should show aria-busy on apply button during validation', () => {
      component.isValidating.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');
      const applyButton = Array.from(buttons).find((b) =>
        b.textContent?.includes('Apply'),
      );

      expect(applyButton?.getAttribute('aria-busy')).toBe('true');
    });
  });

  describe('End Time Future Detection', () => {
    it('should disable end time input when future', () => {
      const future = new Date(Date.now() + 10 * 60000);
      const futureStr = future.toISOString().slice(0, 16);

      component.timeForm.patchValue({
        startTime: '2024-01-15T10:00',
        endTime: futureStr,
      });

      component.onTimeChange();

      // Service validation should return error for future end time
      timeEstimationService.validateTimeWindow.mockReturnValue([
        'End time cannot be in the future',
      ]);
      component.onTimeChange();

      // When validation passes (no errors), we should check future
      timeEstimationService.validateTimeWindow.mockReturnValue([]);
      component.onTimeChange();

      // The component should detect future and set isFutureDisabled
      expect(component.isFutureDisabled()).toBe(true);
    });
  });
});
