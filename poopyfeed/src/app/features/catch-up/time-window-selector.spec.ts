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

    it('should initialize from 4-hour timeWindow input', () => {
      const now = new Date();
      const start4h = new Date(now.getTime() - 4 * 60 * 60 * 1000);

      // Create a new fixture with input
      const newFixture = TestBed.createComponent(TimeWindowSelector);
      newFixture.componentRef.setInput('timeWindow', {
        startTime: start4h.toISOString(),
        endTime: now.toISOString(),
      });
      newFixture.detectChanges();

      expect(newFixture.componentInstance.selectedPreset()).toBe('4h');
    });

    it('should initialize from 8-hour timeWindow input', () => {
      const now = new Date();
      const start8h = new Date(now.getTime() - 8 * 60 * 60 * 1000);

      // Create a new fixture with input
      const newFixture = TestBed.createComponent(TimeWindowSelector);
      newFixture.componentRef.setInput('timeWindow', {
        startTime: start8h.toISOString(),
        endTime: now.toISOString(),
      });
      newFixture.detectChanges();

      expect(newFixture.componentInstance.selectedPreset()).toBe('8h');
    });

    it('should initialize from 24-hour timeWindow input', () => {
      const now = new Date();
      const start24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Create a new fixture with input
      const newFixture = TestBed.createComponent(TimeWindowSelector);
      newFixture.componentRef.setInput('timeWindow', {
        startTime: start24h.toISOString(),
        endTime: now.toISOString(),
      });
      newFixture.detectChanges();

      expect(newFixture.componentInstance.selectedPreset()).toBe('24h');
    });

    it('should display duration — when no preset selected', () => {
      expect(component.durationDisplay()).toBe('—');
    });
  });

  describe('Preset Buttons', () => {
    it('should apply 4-hour preset', () => {
      component.applyPreset('4h');

      expect(component.selectedPreset()).toBe('4h');
      expect(component.durationDisplay()).toBe('4 hours');
    });

    it('should apply 8-hour preset', () => {
      component.applyPreset('8h');

      expect(component.selectedPreset()).toBe('8h');
      expect(component.durationDisplay()).toBe('8 hours');
    });

    it('should apply 24-hour preset', () => {
      component.applyPreset('24h');

      expect(component.selectedPreset()).toBe('24h');
      expect(component.durationDisplay()).toBe('24 hours');
    });

    it('should clear validation error when applying preset', () => {
      component.validationError.set('Test error');

      component.applyPreset('4h');

      expect(component.validationError()).toBeNull();
    });
  });

  describe('Apply Action', () => {
    it('should emit onTimeWindowChange on valid 4h apply', () => {
      const emitSpy = vi.spyOn(component.onTimeWindowChange, 'emit');
      timeEstimationService.validateTimeWindow.mockReturnValue([]);

      component.applyPreset('4h');
      component.onApply();

      expect(emitSpy).toHaveBeenCalled();
      const emittedValue = emitSpy.mock.calls[0][0] as TimeWindow;
      expect(emittedValue.startTime).toBeTruthy();
      expect(emittedValue.endTime).toBeTruthy();
    });

    it('should emit onTimeWindowChange on valid 8h apply', () => {
      const emitSpy = vi.spyOn(component.onTimeWindowChange, 'emit');
      timeEstimationService.validateTimeWindow.mockReturnValue([]);

      component.applyPreset('8h');
      component.onApply();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit onTimeWindowChange on valid 24h apply', () => {
      const emitSpy = vi.spyOn(component.onTimeWindowChange, 'emit');
      timeEstimationService.validateTimeWindow.mockReturnValue([]);

      component.applyPreset('24h');
      component.onApply();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not apply when no preset selected', () => {
      const emitSpy = vi.spyOn(component.onTimeWindowChange, 'emit');

      component.onApply();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should show error toast on validation failure during apply', () => {
      timeEstimationService.validateTimeWindow.mockReturnValue([
        'Start time must be before end time',
      ]);

      component.applyPreset('4h');
      component.onApply();

      expect(toastService.error).toHaveBeenCalledWith('Start time must be before end time');
    });

    it('should handle multiple validation errors', () => {
      timeEstimationService.validateTimeWindow.mockReturnValue([
        'Start time must be before end time',
        'End time cannot be in the future',
      ]);

      component.applyPreset('4h');
      component.onApply();

      expect(toastService.error).toHaveBeenCalledTimes(2);
    });

    it('should show generic error if apply throws exception', () => {
      timeEstimationService.validateTimeWindow.mockImplementation(() => {
        throw new Error('Service error');
      });

      component.applyPreset('4h');
      component.onApply();

      expect(toastService.error).toHaveBeenCalledWith('Failed to apply time window');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button[aria-label]');

      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should show aria-busy on apply button during validation', () => {
      // First select a preset so the apply button appears
      component.applyPreset('4h');
      fixture.detectChanges();

      component.isValidating.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const applyButton = compiled.querySelector('button[aria-busy]');

      expect(applyButton?.getAttribute('aria-busy')).toBe('true');
    });
  });

  describe('Duration Display', () => {
    it('should display 4 hours for 4h preset', () => {
      component.applyPreset('4h');
      expect(component.durationDisplay()).toBe('4 hours');
    });

    it('should display 8 hours for 8h preset', () => {
      component.applyPreset('8h');
      expect(component.durationDisplay()).toBe('8 hours');
    });

    it('should display 24 hours for 24h preset', () => {
      component.applyPreset('24h');
      expect(component.durationDisplay()).toBe('24 hours');
    });

    it('should display — when no preset selected', () => {
      expect(component.durationDisplay()).toBe('—');
    });
  });
});
