import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { QuickLog } from './quick-log';
import { NapsService } from '../../../services/naps.service';
import { DiapersService } from '../../../services/diapers.service';
import { DateTimeService } from '../../../services/datetime.service';

describe('QuickLog', () => {
  let component: QuickLog;
  let fixture: ComponentFixture<QuickLog>;
  let napsService: NapsService;
  let diapersService: DiapersService;
  let dateTimeService: DateTimeService;

  beforeEach(async () => {
    const mockNapsService = {
      create: vi.fn(),
    };
    const mockDiapersService = {
      create: vi.fn(),
    };
    const mockDateTimeService = {
      toUTC: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [QuickLog],
      providers: [
        { provide: NapsService, useValue: mockNapsService },
        { provide: DiapersService, useValue: mockDiapersService },
        { provide: DateTimeService, useValue: mockDateTimeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickLog);
    component = fixture.componentInstance;
    napsService = TestBed.inject(NapsService);
    diapersService = TestBed.inject(DiapersService);
    dateTimeService = TestBed.inject(DateTimeService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('quickLogNap()', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
    });

    it('should log nap with current timestamp when canEdit is true', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockNap = { id: 123, child: 1, napped_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(napsService.create).mockReturnValue(of(mockNap));
      const quickLoggedSpy = vi.spyOn(component.quickLogged, 'emit');

      component.quickLogNap();

      expect(dateTimeService.toUTC).toHaveBeenCalledWith(expect.any(Date));
      expect(napsService.create).toHaveBeenCalledWith(1, {
        napped_at: mockDate.toISOString(),
      });

      // Subscription callbacks execute synchronously for of()
      expect(component.isLoggingNap()).toBe(false);
      expect(quickLoggedSpy).toHaveBeenCalled();
    });

    it('should handle errors from nap service', () => {
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(napsService.create).mockReturnValue(
        throwError(() => new Error('Server error'))
      );

      component.quickLogNap();

      // Error callback executes synchronously for throwError()
      expect(component.isLoggingNap()).toBe(false);
      expect(component.napError()).toBe('Server error');
    });

    it('should not log nap when canEdit is false', () => {
      fixture.componentRef.setInput('canEdit', false);
      component.quickLogNap();
      expect(napsService.create).not.toHaveBeenCalled();
      expect(component.isLoggingNap()).toBe(false);
    });

    it('should not log nap when already logging', () => {
      component.isLoggingNap.set(true);
      component.quickLogNap();
      expect(napsService.create).not.toHaveBeenCalled();
    });

    it('should not log nap when childId is not set', () => {
      fixture.componentRef.setInput('childId', null);
      component.quickLogNap();
      expect(napsService.create).not.toHaveBeenCalled();
    });

    it('should show success state and auto-revert after 1.5 seconds', () => {
      vi.useFakeTimers();
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockNap = { id: 123, child: 1, napped_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(napsService.create).mockReturnValue(of(mockNap));

      component.quickLogNap();

      // After successful log, success signal should be true
      expect(component.napSuccess()).toBe(true);
      expect(component.isLoggingNap()).toBe(false);

      // Advance timers by 1.5 seconds
      vi.advanceTimersByTime(1500);

      // Success should revert to false
      expect(component.napSuccess()).toBe(false);

      vi.useRealTimers();
    });

    it('should clear nap success exactly after 1500ms (not 1499ms)', () => {
      vi.useFakeTimers();
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockNap = { id: 123, child: 1, napped_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(napsService.create).mockReturnValue(of(mockNap));

      component.quickLogNap();
      expect(component.napSuccess()).toBe(true);

      // Advance 1499ms - should still be true
      vi.advanceTimersByTime(1499);
      expect(component.napSuccess()).toBe(true);

      // Advance 1 more ms - should be false
      vi.advanceTimersByTime(1);
      expect(component.napSuccess()).toBe(false);

      vi.useRealTimers();
    });

    it('should auto-clear error after 2 seconds', () => {
      vi.useFakeTimers();
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(napsService.create).mockReturnValue(
        throwError(() => new Error('Server error'))
      );

      component.quickLogNap();

      expect(component.napError()).toBe('Server error');
      expect(component.isLoggingNap()).toBe(false);

      vi.advanceTimersByTime(2000);

      expect(component.napError()).toBe(null);

      vi.useRealTimers();
    });

    it('should clear nap error exactly after 2000ms (not 1999ms)', () => {
      vi.useFakeTimers();
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(napsService.create).mockReturnValue(
        throwError(() => new Error('Server error'))
      );

      component.quickLogNap();
      expect(component.napError()).toBe('Server error');

      // Advance 1999ms - should still have error
      vi.advanceTimersByTime(1999);
      expect(component.napError()).toBe('Server error');

      // Advance 1 more ms - should be null
      vi.advanceTimersByTime(1);
      expect(component.napError()).toBe(null);

      vi.useRealTimers();
    });
  });

  describe('quickLogWetDiaper()', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
    });

    it('should log wet diaper with current timestamp when canEdit is true', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'wet' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(diapersService.create).mockReturnValue(of(mockDiaper));
      const quickLoggedSpy = vi.spyOn(component.quickLogged, 'emit');

      component.quickLogWetDiaper();

      expect(dateTimeService.toUTC).toHaveBeenCalledWith(expect.any(Date));
      expect(diapersService.create).toHaveBeenCalledWith(1, {
        change_type: 'wet',
        changed_at: mockDate.toISOString(),
      });

      // Subscription callbacks execute synchronously for of()
      expect(component.isLoggingWetDiaper()).toBe(false);
      expect(quickLoggedSpy).toHaveBeenCalled();
    });

    it('should handle errors from diaper service', () => {
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(diapersService.create).mockReturnValue(
        throwError(() => new Error('Diaper server error'))
      );

      component.quickLogWetDiaper();

      // Error callback executes synchronously for throwError()
      expect(component.isLoggingWetDiaper()).toBe(false);
      expect(component.wetDiaperError()).toBe('Diaper server error');
    });

    it('should not log wet diaper when canEdit is false', () => {
      fixture.componentRef.setInput('canEdit', false);
      component.quickLogWetDiaper();
      expect(diapersService.create).not.toHaveBeenCalled();
      expect(component.isLoggingWetDiaper()).toBe(false);
    });

    it('should not log wet diaper when already logging', () => {
      component.isLoggingWetDiaper.set(true);
      component.quickLogWetDiaper();
      expect(diapersService.create).not.toHaveBeenCalled();
    });

    it('should not log wet diaper when childId is not set', () => {
      fixture.componentRef.setInput('childId', null);
      component.quickLogWetDiaper();
      expect(diapersService.create).not.toHaveBeenCalled();
    });

    it('should show success state and auto-revert after 1.5 seconds for wet diaper', () => {
      vi.useFakeTimers();
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'wet' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(diapersService.create).mockReturnValue(of(mockDiaper));

      component.quickLogWetDiaper();

      expect(component.wetDiaperSuccess()).toBe(true);
      expect(component.isLoggingWetDiaper()).toBe(false);

      vi.advanceTimersByTime(1500);

      expect(component.wetDiaperSuccess()).toBe(false);

      vi.useRealTimers();
    });

    it('should clear wet diaper success exactly after 1500ms (not 1499ms)', () => {
      vi.useFakeTimers();
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'wet' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(diapersService.create).mockReturnValue(of(mockDiaper));

      component.quickLogWetDiaper();
      expect(component.wetDiaperSuccess()).toBe(true);

      // Advance 1499ms - should still be true
      vi.advanceTimersByTime(1499);
      expect(component.wetDiaperSuccess()).toBe(true);

      // Advance 1 more ms - should be false
      vi.advanceTimersByTime(1);
      expect(component.wetDiaperSuccess()).toBe(false);

      vi.useRealTimers();
    });

    it('should auto-clear wet diaper error after 2 seconds', () => {
      vi.useFakeTimers();
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(diapersService.create).mockReturnValue(
        throwError(() => new Error('Diaper server error'))
      );

      component.quickLogWetDiaper();

      expect(component.wetDiaperError()).toBe('Diaper server error');
      expect(component.isLoggingWetDiaper()).toBe(false);

      vi.advanceTimersByTime(2000);

      expect(component.wetDiaperError()).toBe(null);

      vi.useRealTimers();
    });

    it('should clear wet diaper error exactly after 2000ms (not 1999ms)', () => {
      vi.useFakeTimers();
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(diapersService.create).mockReturnValue(
        throwError(() => new Error('Diaper server error'))
      );

      component.quickLogWetDiaper();
      expect(component.wetDiaperError()).toBe('Diaper server error');

      // Advance 1999ms - should still have error
      vi.advanceTimersByTime(1999);
      expect(component.wetDiaperError()).toBe('Diaper server error');

      // Advance 1 more ms - should be null
      vi.advanceTimersByTime(1);
      expect(component.wetDiaperError()).toBe(null);

      vi.useRealTimers();
    });
  });

  describe('quickLogDirtyDiaper()', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
    });

    it('should log dirty diaper with current timestamp when canEdit is true', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'dirty' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(diapersService.create).mockReturnValue(of(mockDiaper));
      const quickLoggedSpy = vi.spyOn(component.quickLogged, 'emit');

      component.quickLogDirtyDiaper();

      expect(dateTimeService.toUTC).toHaveBeenCalledWith(expect.any(Date));
      expect(diapersService.create).toHaveBeenCalledWith(1, {
        change_type: 'dirty',
        changed_at: mockDate.toISOString(),
      });

      expect(component.isLoggingDirtyDiaper()).toBe(false);
      expect(quickLoggedSpy).toHaveBeenCalled();
    });

    it('should handle errors from diaper service for dirty diaper', () => {
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(diapersService.create).mockReturnValue(
        throwError(() => new Error('Diaper server error'))
      );

      component.quickLogDirtyDiaper();

      expect(component.isLoggingDirtyDiaper()).toBe(false);
      expect(component.dirtyDiaperError()).toBe('Diaper server error');
    });

    it('should not log dirty diaper when canEdit is false', () => {
      fixture.componentRef.setInput('canEdit', false);
      component.quickLogDirtyDiaper();
      expect(diapersService.create).not.toHaveBeenCalled();
      expect(component.isLoggingDirtyDiaper()).toBe(false);
    });

    it('should show success state and auto-revert after 1.5 seconds for dirty diaper', () => {
      vi.useFakeTimers();
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'dirty' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(diapersService.create).mockReturnValue(of(mockDiaper));

      component.quickLogDirtyDiaper();

      expect(component.dirtyDiaperSuccess()).toBe(true);
      expect(component.isLoggingDirtyDiaper()).toBe(false);

      vi.advanceTimersByTime(1500);

      expect(component.dirtyDiaperSuccess()).toBe(false);

      vi.useRealTimers();
    });

    it('should clear dirty diaper success exactly after 1500ms (not 1499ms)', () => {
      vi.useFakeTimers();
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'dirty' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(diapersService.create).mockReturnValue(of(mockDiaper));

      component.quickLogDirtyDiaper();
      expect(component.dirtyDiaperSuccess()).toBe(true);

      // Advance 1499ms - should still be true
      vi.advanceTimersByTime(1499);
      expect(component.dirtyDiaperSuccess()).toBe(true);

      // Advance 1 more ms - should be false
      vi.advanceTimersByTime(1);
      expect(component.dirtyDiaperSuccess()).toBe(false);

      vi.useRealTimers();
    });

    it('should auto-clear dirty diaper error after 2 seconds', () => {
      vi.useFakeTimers();
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(diapersService.create).mockReturnValue(
        throwError(() => new Error('Diaper server error'))
      );

      component.quickLogDirtyDiaper();

      expect(component.dirtyDiaperError()).toBe('Diaper server error');
      expect(component.isLoggingDirtyDiaper()).toBe(false);

      vi.advanceTimersByTime(2000);

      expect(component.dirtyDiaperError()).toBe(null);

      vi.useRealTimers();
    });

    it('should clear dirty diaper error exactly after 2000ms (not 1999ms)', () => {
      vi.useFakeTimers();
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(diapersService.create).mockReturnValue(
        throwError(() => new Error('Diaper server error'))
      );

      component.quickLogDirtyDiaper();
      expect(component.dirtyDiaperError()).toBe('Diaper server error');

      // Advance 1999ms - should still have error
      vi.advanceTimersByTime(1999);
      expect(component.dirtyDiaperError()).toBe('Diaper server error');

      // Advance 1 more ms - should be null
      vi.advanceTimersByTime(1);
      expect(component.dirtyDiaperError()).toBe(null);

      vi.useRealTimers();
    });
  });

  describe('quickLogBothDiaper()', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
    });

    it('should log both diaper with current timestamp when canEdit is true', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'both' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(diapersService.create).mockReturnValue(of(mockDiaper));
      const quickLoggedSpy = vi.spyOn(component.quickLogged, 'emit');

      component.quickLogBothDiaper();

      expect(dateTimeService.toUTC).toHaveBeenCalledWith(expect.any(Date));
      expect(diapersService.create).toHaveBeenCalledWith(1, {
        change_type: 'both',
        changed_at: mockDate.toISOString(),
      });

      expect(component.isLoggingBothDiaper()).toBe(false);
      expect(quickLoggedSpy).toHaveBeenCalled();
    });

    it('should handle errors from diaper service for both diaper', () => {
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(diapersService.create).mockReturnValue(
        throwError(() => new Error('Diaper server error'))
      );

      component.quickLogBothDiaper();

      expect(component.isLoggingBothDiaper()).toBe(false);
      expect(component.bothDiaperError()).toBe('Diaper server error');
    });

    it('should not log both diaper when canEdit is false', () => {
      fixture.componentRef.setInput('canEdit', false);
      component.quickLogBothDiaper();
      expect(diapersService.create).not.toHaveBeenCalled();
      expect(component.isLoggingBothDiaper()).toBe(false);
    });

    it('should show success state and auto-revert after 1.5 seconds for both diaper', () => {
      vi.useFakeTimers();
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'both' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(diapersService.create).mockReturnValue(of(mockDiaper));

      component.quickLogBothDiaper();

      expect(component.bothDiaperSuccess()).toBe(true);
      expect(component.isLoggingBothDiaper()).toBe(false);

      vi.advanceTimersByTime(1500);

      expect(component.bothDiaperSuccess()).toBe(false);

      vi.useRealTimers();
    });

    it('should clear both diaper success exactly after 1500ms (not 1499ms)', () => {
      vi.useFakeTimers();
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'both' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(diapersService.create).mockReturnValue(of(mockDiaper));

      component.quickLogBothDiaper();
      expect(component.bothDiaperSuccess()).toBe(true);

      // Advance 1499ms - should still be true
      vi.advanceTimersByTime(1499);
      expect(component.bothDiaperSuccess()).toBe(true);

      // Advance 1 more ms - should be false
      vi.advanceTimersByTime(1);
      expect(component.bothDiaperSuccess()).toBe(false);

      vi.useRealTimers();
    });

    it('should auto-clear both diaper error after 2 seconds', () => {
      vi.useFakeTimers();
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(diapersService.create).mockReturnValue(
        throwError(() => new Error('Diaper server error'))
      );

      component.quickLogBothDiaper();

      expect(component.bothDiaperError()).toBe('Diaper server error');
      expect(component.isLoggingBothDiaper()).toBe(false);

      vi.advanceTimersByTime(2000);

      expect(component.bothDiaperError()).toBe(null);

      vi.useRealTimers();
    });

    it('should clear both diaper error exactly after 2000ms (not 1999ms)', () => {
      vi.useFakeTimers();
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(diapersService.create).mockReturnValue(
        throwError(() => new Error('Diaper server error'))
      );

      component.quickLogBothDiaper();
      expect(component.bothDiaperError()).toBe('Diaper server error');

      // Advance 1999ms - should still have error
      vi.advanceTimersByTime(1999);
      expect(component.bothDiaperError()).toBe('Diaper server error');

      // Advance 1 more ms - should be null
      vi.advanceTimersByTime(1);
      expect(component.bothDiaperError()).toBe(null);

      vi.useRealTimers();
    });
  });

  describe('template', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
      fixture.detectChanges();
    });

    it('should show nap emoji when not loading', () => {
      const button = fixture.nativeElement.querySelector('button');
      const emoji = button.querySelector('span.text-4xl');
      expect(emoji.textContent).toBe('😴');
      expect(button.disabled).toBe(false);
    });

    it('should show spinner when loading', () => {
      component.isLoggingNap.set(true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      const spinner = button.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      const emoji = button.querySelector('span.text-4xl');
      expect(emoji).toBeFalsy();
      expect(button.disabled).toBe(true);
    });

    it('should disable nap button when canEdit is false', () => {
      fixture.componentRef.setInput('canEdit', false);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
    });

    it('should show error message when napError is set', () => {
      component.napError.set('Test error');
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('.grid > div:first-child p[role="alert"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error');
    });

    it('should show wet diaper emoji when not loading', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const wetButton = buttons[1];
      const emoji = wetButton.querySelector('span.text-3xl');
      expect(emoji.textContent).toBe('💧');
      expect(wetButton.disabled).toBe(false);
    });

    it('should show dirty diaper emoji when not loading', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const dirtyButton = buttons[2];
      const emoji = dirtyButton.querySelector('span.text-3xl');
      expect(emoji.textContent).toBe('💩');
      expect(dirtyButton.disabled).toBe(false);
    });

    it('should show both diaper emoji when not loading', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bothButton = buttons[3];
      const emoji = bothButton.querySelector('span.text-3xl');
      expect(emoji.textContent).toBe('🧷');
      expect(bothButton.disabled).toBe(false);
    });

    it('should show spinner when logging wet diaper', () => {
      component.isLoggingWetDiaper.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const wetButton = buttons[1];
      const spinner = wetButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      const emoji = wetButton.querySelector('span.text-3xl');
      expect(emoji).toBeFalsy();
      expect(wetButton.disabled).toBe(true);
    });

    it('should show spinner when logging dirty diaper', () => {
      component.isLoggingDirtyDiaper.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const dirtyButton = buttons[2];
      const spinner = dirtyButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      const emoji = dirtyButton.querySelector('span.text-3xl');
      expect(emoji).toBeFalsy();
      expect(dirtyButton.disabled).toBe(true);
    });

    it('should show spinner when logging both diaper', () => {
      component.isLoggingBothDiaper.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bothButton = buttons[3];
      const spinner = bothButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      const emoji = bothButton.querySelector('span.text-3xl');
      expect(emoji).toBeFalsy();
      expect(bothButton.disabled).toBe(true);
    });

    it('should show error message when wetDiaperError is set', () => {
      component.wetDiaperError.set('Wet diaper error');
      fixture.detectChanges();

      const diaperGroup = fixture.nativeElement.querySelector('.border-2.border-orange-400\\/20');
      expect(diaperGroup).toBeTruthy();
      const errorElement = diaperGroup.querySelector('.grid > div:first-child p[role="alert"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Wet diaper error');
    });

    it('should show error message when dirtyDiaperError is set', () => {
      component.dirtyDiaperError.set('Dirty diaper error');
      fixture.detectChanges();

      const diaperGroup = fixture.nativeElement.querySelector('.border-2.border-orange-400\\/20');
      expect(diaperGroup).toBeTruthy();
      const errorElement = diaperGroup.querySelector('.grid > div:nth-child(2) p[role="alert"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Dirty diaper error');
    });

    it('should show error message when bothDiaperError is set', () => {
      component.bothDiaperError.set('Both diaper error');
      fixture.detectChanges();

      const diaperGroup = fixture.nativeElement.querySelector('.border-2.border-orange-400\\/20');
      expect(diaperGroup).toBeTruthy();
      const errorElement = diaperGroup.querySelector('.grid > div:nth-child(3) p[role="alert"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Both diaper error');
    });

    it('should show checkmark and disable nap button when nap success is true', () => {
      component.napSuccess.set(true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
      const checkmark = button.querySelector('span.text-green-500');
      expect(checkmark).toBeTruthy();
      expect(checkmark.textContent).toBe('✅');
    });

    it('should show checkmark and disable wet diaper button when wet diaper success is true', () => {
      component.wetDiaperSuccess.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const wetButton = buttons[1];
      expect(wetButton.disabled).toBe(true);
      const checkmark = wetButton.querySelector('span.text-green-500');
      expect(checkmark).toBeTruthy();
      expect(checkmark.textContent).toBe('✅');
    });

    it('should show checkmark and disable dirty diaper button when dirty diaper success is true', () => {
      component.dirtyDiaperSuccess.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const dirtyButton = buttons[2];
      expect(dirtyButton.disabled).toBe(true);
      const checkmark = dirtyButton.querySelector('span.text-green-500');
      expect(checkmark).toBeTruthy();
      expect(checkmark.textContent).toBe('✅');
    });

    it('should show checkmark and disable both diaper button when both diaper success is true', () => {
      component.bothDiaperSuccess.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bothButton = buttons[3];
      expect(bothButton.disabled).toBe(true);
      const checkmark = bothButton.querySelector('span.text-green-500');
      expect(checkmark).toBeTruthy();
      expect(checkmark.textContent).toBe('✅');
    });

    it('should disable all buttons when canEdit is false', () => {
      fixture.componentRef.setInput('canEdit', false);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBe(4);
      buttons.forEach((button: HTMLButtonElement) => {
        expect(button.disabled).toBe(true);
      });
    });

    it('should have diaper group with border', () => {
      const diaperGroup = fixture.nativeElement.querySelector('.border-2.border-orange-400\\/20.rounded-3xl');
      expect(diaperGroup).toBeTruthy();
      expect(diaperGroup.classList.contains('border-2')).toBe(true);
      expect(diaperGroup.classList.contains('border-orange-400/20')).toBe(true);
    });

    // Accessibility tests for visual confirmation
    it('should have aria-busy="true" when loading nap', () => {
      component.isLoggingNap.set(true);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-busy')).toBe('true');
    });

    it('should have aria-busy="true" when loading wet diaper', () => {
      component.isLoggingWetDiaper.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const wetButton = buttons[1];
      expect(wetButton.getAttribute('aria-busy')).toBe('true');
    });

    it('should have aria-busy="true" when loading dirty diaper', () => {
      component.isLoggingDirtyDiaper.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const dirtyButton = buttons[2];
      expect(dirtyButton.getAttribute('aria-busy')).toBe('true');
    });

    it('should have aria-busy="true" when loading both diaper', () => {
      component.isLoggingBothDiaper.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bothButton = buttons[3];
      expect(bothButton.getAttribute('aria-busy')).toBe('true');
    });

    it('should have role="alert" on nap error messages', () => {
      component.napError.set('Test error');
      fixture.detectChanges();
      const errorElement = fixture.nativeElement.querySelector('.grid > div:first-child p[role="alert"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement.getAttribute('role')).toBe('alert');
    });

    it('should have role="alert" on diaper error messages', () => {
      component.wetDiaperError.set('Wet diaper error');
      fixture.detectChanges();
      const diaperGroup = fixture.nativeElement.querySelector('.border-2.border-orange-400\\/20');
      const errorElement = diaperGroup.querySelector('.grid > div:first-child p[role="alert"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement.getAttribute('role')).toBe('alert');
    });

    // Visual prominence tests for checkmark
    it('should show large green checkmark (text-4xl text-green-500) for nap success', () => {
      component.napSuccess.set(true);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      const checkmark = button.querySelector('span.text-green-500');
      expect(checkmark).toBeTruthy();
      expect(checkmark.classList.contains('text-4xl')).toBe(true);
      expect(checkmark.classList.contains('text-green-500')).toBe(true);
      expect(checkmark.textContent).toBe('✅');
    });

    it('should show medium green checkmark (text-3xl text-green-500) for wet diaper success', () => {
      component.wetDiaperSuccess.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const wetButton = buttons[1];
      const checkmark = wetButton.querySelector('span.text-green-500');
      expect(checkmark).toBeTruthy();
      expect(checkmark.classList.contains('text-3xl')).toBe(true);
      expect(checkmark.classList.contains('text-green-500')).toBe(true);
      expect(checkmark.textContent).toBe('✅');
    });

    it('should show medium green checkmark (text-3xl text-green-500) for dirty diaper success', () => {
      component.dirtyDiaperSuccess.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const dirtyButton = buttons[2];
      const checkmark = dirtyButton.querySelector('span.text-green-500');
      expect(checkmark).toBeTruthy();
      expect(checkmark.classList.contains('text-3xl')).toBe(true);
      expect(checkmark.classList.contains('text-green-500')).toBe(true);
      expect(checkmark.textContent).toBe('✅');
    });

    it('should show medium green checkmark (text-3xl text-green-500) for both diaper success', () => {
      component.bothDiaperSuccess.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bothButton = buttons[3];
      const checkmark = bothButton.querySelector('span.text-green-500');
      expect(checkmark).toBeTruthy();
      expect(checkmark.classList.contains('text-3xl')).toBe(true);
      expect(checkmark.classList.contains('text-green-500')).toBe(true);
      expect(checkmark.textContent).toBe('✅');
    });

    // Loading spinner size tests
    it('should show large spinner (w-8 h-8) when loading nap', () => {
      component.isLoggingNap.set(true);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      const spinner = button.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      expect(spinner.classList.contains('w-8')).toBe(true);
      expect(spinner.classList.contains('h-8')).toBe(true);
    });

    it('should show medium spinner (w-6 h-6) when loading wet diaper', () => {
      component.isLoggingWetDiaper.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const wetButton = buttons[1];
      const spinner = wetButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      expect(spinner.classList.contains('w-6')).toBe(true);
      expect(spinner.classList.contains('h-6')).toBe(true);
    });

    it('should show medium spinner (w-6 h-6) when loading dirty diaper', () => {
      component.isLoggingDirtyDiaper.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const dirtyButton = buttons[2];
      const spinner = dirtyButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      expect(spinner.classList.contains('w-6')).toBe(true);
      expect(spinner.classList.contains('h-6')).toBe(true);
    });

    it('should show medium spinner (w-6 h-6) when loading both diaper', () => {
      component.isLoggingBothDiaper.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bothButton = buttons[3];
      const spinner = bothButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      expect(spinner.classList.contains('w-6')).toBe(true);
      expect(spinner.classList.contains('h-6')).toBe(true);
    });

    // Error message styling tests
    it('should show red centered error message for nap errors', () => {
      component.napError.set('Nap error');
      fixture.detectChanges();
      const errorElement = fixture.nativeElement.querySelector('.grid > div:first-child p');
      expect(errorElement).toBeTruthy();
      expect(errorElement.classList.contains('text-red-600')).toBe(true);
      expect(errorElement.classList.contains('text-center')).toBe(true);
      expect(errorElement.textContent).toBe('Nap error');
    });

    it('should show red centered error message for diaper errors', () => {
      component.wetDiaperError.set('Diaper error');
      fixture.detectChanges();
      const diaperGroup = fixture.nativeElement.querySelector('.border-2.border-orange-400\\/20');
      const errorElement = diaperGroup.querySelector('.grid > div:first-child p');
      expect(errorElement).toBeTruthy();
      expect(errorElement.classList.contains('text-red-600')).toBe(true);
      expect(errorElement.classList.contains('text-center')).toBe(true);
      expect(errorElement.textContent).toBe('Diaper error');
    });

    it('should show nap error with text-sm and mt-2', () => {
      component.napError.set('Nap error');
      fixture.detectChanges();
      const errorElement = fixture.nativeElement.querySelector('.grid > div:first-child p');
      expect(errorElement).toBeTruthy();
      expect(errorElement.classList.contains('text-sm')).toBe(true);
      expect(errorElement.classList.contains('mt-2')).toBe(true);
    });

    it('should show diaper error with text-xs and mt-1', () => {
      component.wetDiaperError.set('Diaper error');
      fixture.detectChanges();
      const diaperGroup = fixture.nativeElement.querySelector('.border-2.border-orange-400\\/20');
      const errorElement = diaperGroup.querySelector('.grid > div:first-child p');
      expect(errorElement).toBeTruthy();
      expect(errorElement.classList.contains('text-xs')).toBe(true);
      expect(errorElement.classList.contains('mt-1')).toBe(true);
    });

    it('should show dirty diaper error with text-xs and mt-1', () => {
      component.dirtyDiaperError.set('Dirty diaper error');
      fixture.detectChanges();
      const diaperGroup = fixture.nativeElement.querySelector('.border-2.border-orange-400\\/20');
      const errorElement = diaperGroup.querySelector('.grid > div:nth-child(2) p');
      expect(errorElement).toBeTruthy();
      expect(errorElement.classList.contains('text-xs')).toBe(true);
      expect(errorElement.classList.contains('mt-1')).toBe(true);
    });

    it('should show both diaper error with text-xs and mt-1', () => {
      component.bothDiaperError.set('Both diaper error');
      fixture.detectChanges();
      const diaperGroup = fixture.nativeElement.querySelector('.border-2.border-orange-400\\/20');
      const errorElement = diaperGroup.querySelector('.grid > div:nth-child(3) p');
      expect(errorElement).toBeTruthy();
      expect(errorElement.classList.contains('text-xs')).toBe(true);
      expect(errorElement.classList.contains('mt-1')).toBe(true);
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
    });

    it('should clear all timeouts on ngOnDestroy', () => {
      vi.useFakeTimers();
      const mockDate = new Date('2026-02-10T10:30:00Z');
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(napsService.create).mockReturnValue(of({
        id: 123, child: 1, napped_at: mockDate.toISOString(),
        created_at: mockDate.toISOString(), updated_at: mockDate.toISOString()
      }));
      vi.mocked(diapersService.create).mockReturnValue(of({
        id: 124, child: 1, change_type: 'wet' as const, changed_at: mockDate.toISOString(),
        created_at: mockDate.toISOString(), updated_at: mockDate.toISOString()
      }));

      // Trigger a nap log to set success timeout
      component.quickLogNap();
      // Trigger a diaper log to set success timeout
      component.quickLogWetDiaper();

      // Spy on clearTimeout
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      component.ngOnDestroy();

      // Should have cleared at least 2 success timeouts
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it('should clear previous success timeout when logging again before auto-revert', () => {
      vi.useFakeTimers();
      const mockDate = new Date('2026-02-10T10:30:00Z');
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(napsService.create).mockReturnValue(of({
        id: 123, child: 1, napped_at: mockDate.toISOString(),
        created_at: mockDate.toISOString(), updated_at: mockDate.toISOString()
      }));

      // First log
      component.quickLogNap();
      expect(component.napSuccess()).toBe(true);

      // Clear timeout spy
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      // Second log while still in success state (button disabled, but we call method directly)
      component.quickLogNap();

      // Should have cleared previous success timeout
      expect(clearTimeoutSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should clear error timeouts on ngOnDestroy', () => {
      vi.useFakeTimers();
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(napsService.create).mockReturnValue(
        throwError(() => new Error('Server error'))
      );

      component.quickLogNap();
      expect(component.napError()).toBe('Server error');

      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      component.ngOnDestroy();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
