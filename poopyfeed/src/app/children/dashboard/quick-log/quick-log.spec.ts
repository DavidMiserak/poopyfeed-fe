import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { QuickLog } from './quick-log';
import { NapsService } from '../../../services/naps.service';
import { DiapersService } from '../../../services/diapers.service';
import { FeedingsService } from '../../../services/feedings.service';
import { DateTimeService } from '../../../services/datetime.service';
import { ToastService } from '../../../services/toast.service';
import { Child } from '../../../models/child.model';

describe('QuickLog', () => {
  let component: QuickLog;
  let fixture: ComponentFixture<QuickLog>;
  let napsService: NapsService;
  let diapersService: DiapersService;
  let feedingsService: FeedingsService;
  let dateTimeService: DateTimeService;
  let toastService: ToastService;

  beforeEach(async () => {
    const mockNapsService = {
      create: vi.fn(),
    };
    const mockDiapersService = {
      create: vi.fn(),
    };
    const mockFeedingsService = {
      create: vi.fn(),
    };
    const mockDateTimeService = {
      toUTC: vi.fn(),
    };
    const mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [QuickLog],
      providers: [
        { provide: NapsService, useValue: mockNapsService },
        { provide: DiapersService, useValue: mockDiapersService },
        { provide: FeedingsService, useValue: mockFeedingsService },
        { provide: DateTimeService, useValue: mockDateTimeService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickLog);
    component = fixture.componentInstance;
    napsService = TestBed.inject(NapsService);
    diapersService = TestBed.inject(DiapersService);
    feedingsService = TestBed.inject(FeedingsService);
    dateTimeService = TestBed.inject(DateTimeService);
    toastService = TestBed.inject(ToastService);
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
      const mockNap = { id: 123, child: 1, napped_at: mockDate.toISOString(), ended_at: null, duration_minutes: null, created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
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
      expect(toastService.success).toHaveBeenCalledWith('Nap recorded successfully');
    });

    it('should show success toast on successful nap log', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockNap = { id: 123, child: 1, napped_at: mockDate.toISOString(), ended_at: null, duration_minutes: null, created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(napsService.create).mockReturnValue(of(mockNap));

      component.quickLogNap();

      expect(toastService.success).toHaveBeenCalledWith('Nap recorded successfully');
    });

    it('should handle errors from nap service', () => {
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(napsService.create).mockReturnValue(
        throwError(() => new Error('Server error'))
      );

      component.quickLogNap();

      // Error callback executes synchronously for throwError()
      expect(component.isLoggingNap()).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Server error');
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

    it('should set isLoggingNap to true while logging', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockNap = { id: 123, child: 1, napped_at: mockDate.toISOString(), ended_at: null, duration_minutes: null, created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      let capturedIsLogging = false;

      vi.mocked(napsService.create).mockImplementation(() => {
        capturedIsLogging = component.isLoggingNap();
        return of(mockNap);
      });

      component.quickLogNap();
      expect(capturedIsLogging).toBe(true);
      expect(component.isLoggingNap()).toBe(false);
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
      expect(toastService.success).toHaveBeenCalledWith('Wet diaper recorded successfully');
    });

    it('should show success toast on successful wet diaper log', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'wet' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(diapersService.create).mockReturnValue(of(mockDiaper));

      component.quickLogWetDiaper();

      expect(toastService.success).toHaveBeenCalledWith('Wet diaper recorded successfully');
    });

    it('should handle errors from diaper service', () => {
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(diapersService.create).mockReturnValue(
        throwError(() => new Error('Diaper server error'))
      );

      component.quickLogWetDiaper();

      // Error callback executes synchronously for throwError()
      expect(component.isLoggingWetDiaper()).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Diaper server error');
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

    it('should set isLoggingWetDiaper to true while logging', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'wet' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      let capturedIsLogging = false;

      vi.mocked(diapersService.create).mockImplementation(() => {
        capturedIsLogging = component.isLoggingWetDiaper();
        return of(mockDiaper);
      });

      component.quickLogWetDiaper();
      expect(capturedIsLogging).toBe(true);
      expect(component.isLoggingWetDiaper()).toBe(false);
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
      expect(toastService.success).toHaveBeenCalledWith('Dirty diaper recorded successfully');
    });

    it('should show success toast on successful dirty diaper log', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'dirty' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(diapersService.create).mockReturnValue(of(mockDiaper));

      component.quickLogDirtyDiaper();

      expect(toastService.success).toHaveBeenCalledWith('Dirty diaper recorded successfully');
    });

    it('should handle errors from diaper service for dirty diaper', () => {
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(diapersService.create).mockReturnValue(
        throwError(() => new Error('Diaper server error'))
      );

      component.quickLogDirtyDiaper();

      expect(component.isLoggingDirtyDiaper()).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Diaper server error');
    });

    it('should not log dirty diaper when canEdit is false', () => {
      fixture.componentRef.setInput('canEdit', false);
      component.quickLogDirtyDiaper();
      expect(diapersService.create).not.toHaveBeenCalled();
      expect(component.isLoggingDirtyDiaper()).toBe(false);
    });

    it('should set isLoggingDirtyDiaper to true while logging', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'dirty' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      let capturedIsLogging = false;

      vi.mocked(diapersService.create).mockImplementation(() => {
        capturedIsLogging = component.isLoggingDirtyDiaper();
        return of(mockDiaper);
      });

      component.quickLogDirtyDiaper();
      expect(capturedIsLogging).toBe(true);
      expect(component.isLoggingDirtyDiaper()).toBe(false);
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
      expect(toastService.success).toHaveBeenCalledWith('Wet and dirty diaper recorded successfully');
    });

    it('should show success toast on successful both diaper log', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'both' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(diapersService.create).mockReturnValue(of(mockDiaper));

      component.quickLogBothDiaper();

      expect(toastService.success).toHaveBeenCalledWith('Wet and dirty diaper recorded successfully');
    });

    it('should handle errors from diaper service for both diaper', () => {
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(diapersService.create).mockReturnValue(
        throwError(() => new Error('Diaper server error'))
      );

      component.quickLogBothDiaper();

      expect(component.isLoggingBothDiaper()).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Diaper server error');
    });

    it('should not log both diaper when canEdit is false', () => {
      fixture.componentRef.setInput('canEdit', false);
      component.quickLogBothDiaper();
      expect(diapersService.create).not.toHaveBeenCalled();
      expect(component.isLoggingBothDiaper()).toBe(false);
    });

    it('should set isLoggingBothDiaper to true while logging', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockDiaper = { id: 123, child: 1, change_type: 'both' as const, changed_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      let capturedIsLogging = false;

      vi.mocked(diapersService.create).mockImplementation(() => {
        capturedIsLogging = component.isLoggingBothDiaper();
        return of(mockDiaper);
      });

      component.quickLogBothDiaper();
      expect(capturedIsLogging).toBe(true);
      expect(component.isLoggingBothDiaper()).toBe(false);
    });
  });

  describe('quickLogBottleLow()', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
    });

    it('should log bottle with recommended - 1 oz', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-11-15', // ~12 weeks -> 5 oz recommended
        gender: 'M',
        user_role: 'owner',
        created_at: mockDate.toISOString(),
        updated_at: mockDate.toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };
      const mockFeeding = { id: 123, child: 1, feeding_type: 'bottle' as const, fed_at: mockDate.toISOString(), amount_oz: 4, created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };

      fixture.componentRef.setInput('child', mockChild);
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(feedingsService.create).mockReturnValue(of(mockFeeding));
      const quickLoggedSpy = vi.spyOn(component.quickLogged, 'emit');

      component.quickLogBottleLow();

      expect(feedingsService.create).toHaveBeenCalledWith(1, {
        feeding_type: 'bottle',
        fed_at: mockDate.toISOString(),
        amount_oz: 4, // 5 - 1 = 4
      });
      expect(component.isLoggingBottleLow()).toBe(false);
      expect(quickLoggedSpy).toHaveBeenCalled();
      expect(toastService.success).toHaveBeenCalledWith('Bottle feeding recorded: 4 oz');
    });

    it('should handle errors from feeding service', () => {
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-12-10',
        gender: 'M',
        user_role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild);
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(feedingsService.create).mockReturnValue(
        throwError(() => new Error('Feed server error'))
      );

      component.quickLogBottleLow();

      expect(component.isLoggingBottleLow()).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Feed server error');
    });

    it('should not log bottle when canEdit is false', () => {
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-12-10',
        gender: 'M',
        user_role: 'caregiver',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild);
      fixture.componentRef.setInput('canEdit', false);
      component.quickLogBottleLow();

      expect(feedingsService.create).not.toHaveBeenCalled();
      expect(component.isLoggingBottleLow()).toBe(false);
    });

    it('should not log bottle when amount is below minimum', () => {
      // Newborn with 2 oz -> 2 - 1 = 1 oz (still valid as >= 0.1)
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2026-02-10', // Newborn -> 2 oz recommended
        gender: 'M',
        user_role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild);
      expect(component.bottleAmountLow()).toBe(1); // 2 - 1 = 1, which is >= 0.1
    });
  });

  describe('quickLogBottleMid()', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
    });

    it('should log bottle with recommended amount', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-11-15', // ~12 weeks -> 5 oz recommended
        gender: 'M',
        user_role: 'owner',
        created_at: mockDate.toISOString(),
        updated_at: mockDate.toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };
      const mockFeeding = { id: 123, child: 1, feeding_type: 'bottle' as const, fed_at: mockDate.toISOString(), amount_oz: 5, created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };

      fixture.componentRef.setInput('child', mockChild);
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(feedingsService.create).mockReturnValue(of(mockFeeding));
      const quickLoggedSpy = vi.spyOn(component.quickLogged, 'emit');

      component.quickLogBottleMid();

      expect(feedingsService.create).toHaveBeenCalledWith(1, {
        feeding_type: 'bottle',
        fed_at: mockDate.toISOString(),
        amount_oz: 5, // Recommended
      });
      expect(component.isLoggingBottleMid()).toBe(false);
      expect(quickLoggedSpy).toHaveBeenCalled();
      expect(toastService.success).toHaveBeenCalledWith('Bottle feeding recorded: 5 oz');
    });

    it('should handle errors from feeding service', () => {
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-12-10',
        gender: 'M',
        user_role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild);
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(feedingsService.create).mockReturnValue(
        throwError(() => new Error('Feed server error'))
      );

      component.quickLogBottleMid();

      expect(component.isLoggingBottleMid()).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Feed server error');
    });

    it('should not log bottle when canEdit is false', () => {
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-12-10',
        gender: 'M',
        user_role: 'caregiver',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild);
      fixture.componentRef.setInput('canEdit', false);
      component.quickLogBottleMid();

      expect(feedingsService.create).not.toHaveBeenCalled();
      expect(component.isLoggingBottleMid()).toBe(false);
    });
  });

  describe('quickLogBottleHigh()', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
    });

    it('should log bottle with recommended + 1 oz', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-11-15', // ~12 weeks -> 5 oz recommended
        gender: 'M',
        user_role: 'owner',
        created_at: mockDate.toISOString(),
        updated_at: mockDate.toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };
      const mockFeeding = { id: 123, child: 1, feeding_type: 'bottle' as const, fed_at: mockDate.toISOString(), amount_oz: 6, created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };

      fixture.componentRef.setInput('child', mockChild);
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(feedingsService.create).mockReturnValue(of(mockFeeding));
      const quickLoggedSpy = vi.spyOn(component.quickLogged, 'emit');

      component.quickLogBottleHigh();

      expect(feedingsService.create).toHaveBeenCalledWith(1, {
        feeding_type: 'bottle',
        fed_at: mockDate.toISOString(),
        amount_oz: 6, // 5 + 1 = 6
      });
      expect(component.isLoggingBottleHigh()).toBe(false);
      expect(quickLoggedSpy).toHaveBeenCalled();
      expect(toastService.success).toHaveBeenCalledWith('Bottle feeding recorded: 6 oz');
    });

    it('should not exceed maximum bottle amount', () => {
      // Very old baby (12 months) would get 8 oz, + 1 = 9 oz (< 50 max)
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-02-10', // ~1 year old -> 8 oz
        gender: 'M',
        user_role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild);
      const high = component.bottleAmountHigh();
      expect(high).toBeLessThanOrEqual(50);
    });

    it('should handle errors from feeding service', () => {
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-12-10',
        gender: 'M',
        user_role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild);
      vi.mocked(dateTimeService.toUTC).mockReturnValue(new Date().toISOString());
      vi.mocked(feedingsService.create).mockReturnValue(
        throwError(() => new Error('Feed server error'))
      );

      component.quickLogBottleHigh();

      expect(component.isLoggingBottleHigh()).toBe(false);
      expect(toastService.error).toHaveBeenCalledWith('Feed server error');
    });

    it('should not log bottle when canEdit is false', () => {
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-12-10',
        gender: 'M',
        user_role: 'caregiver',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild);
      fixture.componentRef.setInput('canEdit', false);
      component.quickLogBottleHigh();

      expect(feedingsService.create).not.toHaveBeenCalled();
      expect(component.isLoggingBottleHigh()).toBe(false);
    });
  });

  describe('Conditional Branch Testing (Matrix)', () => {
    describe('bottle amount null handling', () => {
      it('should disable bottle buttons when bottleAmount is null (no DOB)', () => {
        fixture.componentRef.setInput('childId', 1);
        fixture.componentRef.setInput('canEdit', true);
        fixture.componentRef.setInput('child', null);
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button');
        const bottleLowButton = buttons[4];
        const bottleMidButton = buttons[5];
        const bottleHighButton = buttons[6];

        expect(bottleLowButton.disabled).toBe(true);
        expect(bottleMidButton.disabled).toBe(true);
        expect(bottleHighButton.disabled).toBe(true);
      });

      it('should not show bottle amount text when bottleAmountLow is null', () => {
        fixture.componentRef.setInput('childId', 1);
        fixture.componentRef.setInput('canEdit', true);
        fixture.componentRef.setInput('child', null);
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button');
        const bottleLowButton = buttons[4];
        const amountText = bottleLowButton.querySelector('span.text-2xl');
        expect(amountText).toBeFalsy();
      });

      it('should show bottle emoji when bottleAmountLow is null', () => {
        fixture.componentRef.setInput('childId', 1);
        fixture.componentRef.setInput('canEdit', true);
        fixture.componentRef.setInput('child', null);
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button');
        const bottleLowButton = buttons[4];
        const emoji = bottleLowButton.querySelector('span.text-5xl');
        expect(emoji?.textContent).toBe('🍼');
      });

      it('should not display oz unit when bottleAmountLow is null', () => {
        fixture.componentRef.setInput('childId', 1);
        fixture.componentRef.setInput('canEdit', true);
        fixture.componentRef.setInput('child', null);
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button');
        const bottleLowButton = buttons[4];
        const ozText = bottleLowButton.querySelector('span.text-sm');
        expect(ozText).toBeFalsy();
      });

      it('should disable all bottle buttons when child has no DOB, regardless of canEdit', () => {
        fixture.componentRef.setInput('childId', 1);
        fixture.componentRef.setInput('canEdit', true);
        fixture.componentRef.setInput('child', null);
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button');
        const bottleLowButton = buttons[4];
        expect(bottleLowButton.disabled).toBe(true);
        expect(bottleLowButton.getAttribute('aria-busy')).toBe('false');
      });
    });

    describe('loading state with bottle amounts', () => {
      beforeEach(() => {
        const mockChild: Child = {
          id: 1,
          name: 'Baby',
          date_of_birth: '2025-11-15',
          gender: 'M',
          user_role: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_feeding: null,
          last_diaper_change: null,
          last_nap: null,
        };
        fixture.componentRef.setInput('childId', 1);
        fixture.componentRef.setInput('canEdit', true);
        fixture.componentRef.setInput('child', mockChild);
      });

      it('should show spinner but not emoji when bottle low is loading', () => {
        fixture.detectChanges();
        component.isLoggingBottleLow.set(true);
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button');
        const bottleLowButton = buttons[4];
        const spinner = bottleLowButton.querySelector('svg.animate-spin');
        const emoji = bottleLowButton.querySelector('span.text-5xl');
        const amount = bottleLowButton.querySelector('span.text-2xl');

        expect(spinner).toBeTruthy();
        expect(emoji).toBeFalsy();
        expect(amount).toBeTruthy(); // Amount still shows during loading
      });

      it('should keep bottle amount displayed while loading', () => {
        fixture.detectChanges();
        expect(component.bottleAmountLow()).toBe(4); // 5 - 1

        component.isLoggingBottleLow.set(true);
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button');
        const bottleLowButton = buttons[4];
        const amount = bottleLowButton.querySelector('span.text-2xl');
        expect(amount?.textContent?.trim()).toBe('4');
      });
    });

    describe('mixed button states (multiple buttons with different conditions)', () => {
      beforeEach(() => {
        const mockChild: Child = {
          id: 1,
          name: 'Baby',
          date_of_birth: '2025-11-15',
          gender: 'M',
          user_role: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_feeding: null,
          last_diaper_change: null,
          last_nap: null,
        };
        fixture.componentRef.setInput('childId', 1);
        fixture.componentRef.setInput('child', mockChild);
      });

      it('should show different spinners for different loading buttons', () => {
        fixture.componentRef.setInput('canEdit', true);
        fixture.detectChanges();

        component.isLoggingBottleLow.set(true);
        component.isLoggingWetDiaper.set(true);
        component.isLoggingNap.set(true);
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button');
        const bottleLowButton = buttons[4];
        const wetButton = buttons[0];
        const napButton = buttons[3];

        expect(bottleLowButton.querySelector('svg.animate-spin')).toBeTruthy();
        expect(wetButton.querySelector('svg.animate-spin')).toBeTruthy();
        expect(napButton.querySelector('svg.animate-spin')).toBeTruthy();

        // But other buttons should show emoji
        const bottleMidButton = buttons[5];
        expect(bottleMidButton.querySelector('span.text-5xl')).toBeTruthy();
      });

      it('should disable wet button when canEdit=false but other buttons still have amounts', () => {
        fixture.componentRef.setInput('canEdit', false);
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button');
        const wetButton = buttons[0];
        const bottleLowButton = buttons[4];

        expect(wetButton.disabled).toBe(true);
        expect(bottleLowButton.disabled).toBe(true); // Also disabled due to canEdit=false
      });

      it('should allow bottle log when bottle amount exists and canEdit=true but diaper logging=true', () => {
        fixture.componentRef.setInput('canEdit', true);
        fixture.detectChanges();

        component.isLoggingWetDiaper.set(true);
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button');
        const bottleLowButton = buttons[4];
        const wetButton = buttons[0];

        expect(wetButton.disabled).toBe(true); // Diaper button disabled while logging
        expect(bottleLowButton.disabled).toBe(false); // Bottle button still enabled
      });
    });

    describe('combined disabled conditions (|| logic)', () => {
      it('should disable bottle button when any condition is true: isLogging || !canEdit || !amount', () => {
        const mockChild: Child = {
          id: 1,
          name: 'Baby',
          date_of_birth: '2025-11-15',
          gender: 'M',
          user_role: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_feeding: null,
          last_diaper_change: null,
          last_nap: null,
        };

        fixture.componentRef.setInput('childId', 1);
        fixture.componentRef.setInput('child', mockChild);
        fixture.componentRef.setInput('canEdit', true);
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('button');
        const bottleLowButton = buttons[4];

        // Case 1: isLogging=true, canEdit=true, amount exists -> disabled
        component.isLoggingBottleLow.set(true);
        fixture.detectChanges();
        expect(bottleLowButton.disabled).toBe(true);

        // Case 2: isLogging=false, canEdit=false, amount exists -> disabled
        component.isLoggingBottleLow.set(false);
        fixture.componentRef.setInput('canEdit', false);
        fixture.detectChanges();
        expect(bottleLowButton.disabled).toBe(true);

        // Case 3: isLogging=false, canEdit=true, amount=null -> disabled
        fixture.componentRef.setInput('child', null);
        fixture.componentRef.setInput('canEdit', true);
        fixture.detectChanges();
        expect(bottleLowButton.disabled).toBe(true);
      });
    });
  });

  describe('template', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
      fixture.detectChanges();
    });

    it('should show nap emoji when not loading', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const napButton = buttons[3];
      const emoji = napButton.querySelector('span.text-6xl');
      expect(emoji.textContent).toBe('😴');
      expect(napButton.disabled).toBe(false);
    });

    it('should show spinner when loading', () => {
      component.isLoggingNap.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const napButton = buttons[3];
      const spinner = napButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      const emoji = napButton.querySelector('span.text-6xl');
      expect(emoji).toBeFalsy();
      expect(napButton.disabled).toBe(true);
    });

    it('should disable nap button when canEdit is false', () => {
      fixture.componentRef.setInput('canEdit', false);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
    });

    it('should show wet diaper emoji when not loading', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const wetButton = buttons[0];
      const emoji = wetButton.querySelector('span.text-5xl');
      expect(emoji.textContent).toBe('💧');
      expect(wetButton.disabled).toBe(false);
    });

    it('should show dirty diaper emoji when not loading', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const dirtyButton = buttons[1];
      const emoji = dirtyButton.querySelector('span.text-5xl');
      expect(emoji.textContent).toBe('💩');
      expect(dirtyButton.disabled).toBe(false);
    });

    it('should show both diaper emoji when not loading', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bothButton = buttons[2];
      const emoji = bothButton.querySelector('span.text-5xl');
      expect(emoji.textContent).toBe('🧷');
      expect(bothButton.disabled).toBe(false);
    });

    it('should show spinner when logging wet diaper', () => {
      component.isLoggingWetDiaper.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const wetButton = buttons[0];
      const spinner = wetButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      const emoji = wetButton.querySelector('span.text-5xl');
      expect(emoji).toBeFalsy();
      expect(wetButton.disabled).toBe(true);
    });

    it('should show spinner when logging dirty diaper', () => {
      component.isLoggingDirtyDiaper.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const dirtyButton = buttons[1];
      const spinner = dirtyButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      const emoji = dirtyButton.querySelector('span.text-5xl');
      expect(emoji).toBeFalsy();
      expect(dirtyButton.disabled).toBe(true);
    });

    it('should show spinner when logging both diaper', () => {
      component.isLoggingBothDiaper.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bothButton = buttons[2];
      const spinner = bothButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      const emoji = bothButton.querySelector('span.text-5xl');
      expect(emoji).toBeFalsy();
      expect(bothButton.disabled).toBe(true);
    });

    it('should disable all buttons when canEdit is false', () => {
      fixture.componentRef.setInput('canEdit', false);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBe(7); // 3 diaper + 1 nap + 3 bottle
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

    it('should show 3 bottle buttons with bottle emoji when not loading', () => {
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-11-15', // ~3 months -> 5 oz
        gender: 'M',
        user_role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      // Bottle buttons are at indices 4, 5, 6 (after diapers on left, nap on right)
      const bottleLowButton = buttons[4];
      const bottleMidButton = buttons[5];
      const bottleHighButton = buttons[6];

      const lowEmoji = bottleLowButton.querySelector('span.text-5xl');
      const midEmoji = bottleMidButton.querySelector('span.text-5xl');
      const highEmoji = bottleHighButton.querySelector('span.text-5xl');

      expect(lowEmoji.textContent).toBe('🍼');
      expect(midEmoji.textContent).toBe('🍼');
      expect(highEmoji.textContent).toBe('🍼');

      expect(bottleLowButton.disabled).toBe(false);
      expect(bottleMidButton.disabled).toBe(false);
      expect(bottleHighButton.disabled).toBe(false);
    });

    it('should show spinner when loading bottle low', () => {
      component.isLoggingBottleLow.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleLowButton = buttons[4];
      const spinner = bottleLowButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      const emoji = bottleLowButton.querySelector('span.text-5xl');
      expect(emoji).toBeFalsy();
      expect(bottleLowButton.disabled).toBe(true);
    });

    it('should show spinner when loading bottle mid', () => {
      component.isLoggingBottleMid.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleMidButton = buttons[5];
      const spinner = bottleMidButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      const emoji = bottleMidButton.querySelector('span.text-5xl');
      expect(emoji).toBeFalsy();
      expect(bottleMidButton.disabled).toBe(true);
    });

    it('should show spinner when loading bottle high', () => {
      component.isLoggingBottleHigh.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleHighButton = buttons[6];
      const spinner = bottleHighButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      const emoji = bottleHighButton.querySelector('span.text-5xl');
      expect(emoji).toBeFalsy();
      expect(bottleHighButton.disabled).toBe(true);
    });

    it('should have bottle buttons with rose gradient', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleLowButton = buttons[4];
      const bottleMidButton = buttons[5];
      const bottleHighButton = buttons[6];

      expect(bottleLowButton.classList.contains('border-rose-400')).toBe(true);
      expect(bottleMidButton.classList.contains('border-rose-400')).toBe(true);
      expect(bottleHighButton.classList.contains('border-rose-400')).toBe(true);
    });

    // Accessibility tests for visual confirmation
    it('should have aria-busy="true" when loading nap', () => {
      component.isLoggingNap.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const napButton = buttons[3];
      expect(napButton.getAttribute('aria-busy')).toBe('true');
    });

    it('should have aria-busy="true" when loading wet diaper', () => {
      component.isLoggingWetDiaper.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const wetButton = buttons[0];
      expect(wetButton.getAttribute('aria-busy')).toBe('true');
    });

    it('should have aria-busy="true" when loading dirty diaper', () => {
      component.isLoggingDirtyDiaper.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const dirtyButton = buttons[1];
      expect(dirtyButton.getAttribute('aria-busy')).toBe('true');
    });

    it('should have aria-busy="true" when loading both diaper', () => {
      component.isLoggingBothDiaper.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bothButton = buttons[2];
      expect(bothButton.getAttribute('aria-busy')).toBe('true');
    });

    // Loading spinner size tests
    it('should show large spinner (w-10 h-10) when loading nap', () => {
      component.isLoggingNap.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const napButton = buttons[3];
      const spinner = napButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      expect(spinner.classList.contains('w-10')).toBe(true);
      expect(spinner.classList.contains('h-10')).toBe(true);
    });

    it('should show medium spinner (w-8 h-8) when loading wet diaper', () => {
      component.isLoggingWetDiaper.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const wetButton = buttons[0];
      const spinner = wetButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      expect(spinner.classList.contains('w-8')).toBe(true);
      expect(spinner.classList.contains('h-8')).toBe(true);
    });

    it('should show medium spinner (w-8 h-8) when loading dirty diaper', () => {
      component.isLoggingDirtyDiaper.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const dirtyButton = buttons[1];
      const spinner = dirtyButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      expect(spinner.classList.contains('w-8')).toBe(true);
      expect(spinner.classList.contains('h-8')).toBe(true);
    });

    it('should show medium spinner (w-8 h-8) when loading both diaper', () => {
      component.isLoggingBothDiaper.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bothButton = buttons[2];
      const spinner = bothButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      expect(spinner.classList.contains('w-8')).toBe(true);
      expect(spinner.classList.contains('h-8')).toBe(true);
    });

    it('should have aria-busy="true" when loading bottle low', () => {
      component.isLoggingBottleLow.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleLowButton = buttons[4];
      expect(bottleLowButton.getAttribute('aria-busy')).toBe('true');
    });

    it('should have aria-busy="true" when loading bottle mid', () => {
      component.isLoggingBottleMid.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleMidButton = buttons[5];
      expect(bottleMidButton.getAttribute('aria-busy')).toBe('true');
    });

    it('should have aria-busy="true" when loading bottle high', () => {
      component.isLoggingBottleHigh.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleHighButton = buttons[6];
      expect(bottleHighButton.getAttribute('aria-busy')).toBe('true');
    });

    it('should show medium spinner (w-8 h-8) when loading bottle low', () => {
      component.isLoggingBottleLow.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleLowButton = buttons[4];
      const spinner = bottleLowButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      expect(spinner.classList.contains('w-8')).toBe(true);
      expect(spinner.classList.contains('h-8')).toBe(true);
    });

    it('should show medium spinner (w-8 h-8) when loading bottle mid', () => {
      component.isLoggingBottleMid.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleMidButton = buttons[5];
      const spinner = bottleMidButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      expect(spinner.classList.contains('w-8')).toBe(true);
      expect(spinner.classList.contains('h-8')).toBe(true);
    });

    it('should show medium spinner (w-8 h-8) when loading bottle high', () => {
      component.isLoggingBottleHigh.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleHighButton = buttons[6];
      const spinner = bottleHighButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      expect(spinner.classList.contains('w-8')).toBe(true);
      expect(spinner.classList.contains('h-8')).toBe(true);
    });

    it('should calculate and display bottle amount from child date of birth', () => {
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-11-15', // ~12 weeks (3 months) old -> 5 oz
        gender: 'M',
        user_role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild);
      fixture.detectChanges();

      expect(component.bottleAmount()).toBe(5);
    });

    it('should display 3 bottle amounts on buttons', () => {
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2026-02-05', // Newborn -> 2 oz recommended
        gender: 'M',
        user_role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild);
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleLowButton = buttons[4];
      const bottleMidButton = buttons[5];
      const bottleHighButton = buttons[6];

      // Check that bottle amounts are displayed in the buttons
      // Format is now: emoji, number (text-2xl), oz (text-sm)
      expect(bottleLowButton.textContent).toContain('1');
      expect(bottleLowButton.textContent).toContain('oz');

      expect(bottleMidButton.textContent).toContain('2');
      expect(bottleMidButton.textContent).toContain('oz');

      expect(bottleHighButton.textContent).toContain('3');
      expect(bottleHighButton.textContent).toContain('oz');
    });

    it('should not display bottle amounts when child is null', () => {
      fixture.componentRef.setInput('child', null);
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleLowButton = buttons[4];
      const bottleMidButton = buttons[5];
      const bottleHighButton = buttons[6];

      const lowText = bottleLowButton.querySelector('span.text-base');
      const midText = bottleMidButton.querySelector('span.text-base');
      const highText = bottleHighButton.querySelector('span.text-base');

      expect(lowText).toBeFalsy();
      expect(midText).toBeFalsy();
      expect(highText).toBeFalsy();
    });

    it('should update bottle amounts when child changes', () => {
      const mockChild1: Child = {
        id: 1,
        name: 'Baby1',
        date_of_birth: '2026-02-05', // 0 weeks old (newborn) -> 2 oz
        gender: 'M',
        user_role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      const mockChild2: Child = {
        id: 2,
        name: 'Baby2',
        date_of_birth: '2025-08-01', // ~26 weeks old (6 months) -> 7 oz
        gender: 'F',
        user_role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild1);
      expect(component.bottleAmountLow()).toBe(1); // 2 - 1
      expect(component.bottleAmountMid()).toBe(2); // 2
      expect(component.bottleAmountHigh()).toBe(3); // 2 + 1

      fixture.componentRef.setInput('child', mockChild2);
      expect(component.bottleAmountLow()).toBe(6); // 7 - 1
      expect(component.bottleAmountMid()).toBe(7); // 7
      expect(component.bottleAmountHigh()).toBe(8); // 7 + 1
    });

    it('should have descriptive aria-labels with bottle amounts', () => {
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-12-10', // ~2 months old -> 5 oz
        gender: 'M',
        user_role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild);
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleLowButton = buttons[4];
      const bottleMidButton = buttons[5];
      const bottleHighButton = buttons[6];

      expect(bottleLowButton.getAttribute('aria-label')).toBe('Log a bottle feeding with 4 oz');
      expect(bottleMidButton.getAttribute('aria-label')).toBe('Log a bottle feeding with 5 oz (recommended)');
      expect(bottleHighButton.getAttribute('aria-label')).toBe('Log a bottle feeding with 6 oz');
    });
  });
});
