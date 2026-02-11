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
      expect(toastService.success).toHaveBeenCalledWith('Nap recorded successfully');
    });

    it('should show success toast on successful nap log', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockNap = { id: 123, child: 1, napped_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
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
      const mockNap = { id: 123, child: 1, napped_at: mockDate.toISOString(), created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };
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

  describe('quickLogBottle()', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
    });

    it('should log bottle feeding with age-based amount for newborn', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2026-02-05', // Newborn (5 days old) -> 2 oz
        gender: 'M',
        user_role: 'owner',
        created_at: mockDate.toISOString(),
        updated_at: mockDate.toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };
      const mockFeeding = { id: 123, child: 1, feeding_type: 'bottle' as const, fed_at: mockDate.toISOString(), amount_oz: 2, created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };

      fixture.componentRef.setInput('child', mockChild);
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(feedingsService.create).mockReturnValue(of(mockFeeding));
      const quickLoggedSpy = vi.spyOn(component.quickLogged, 'emit');

      component.quickLogBottle();

      expect(feedingsService.create).toHaveBeenCalledWith(1, {
        feeding_type: 'bottle',
        fed_at: mockDate.toISOString(),
        amount_oz: 2,
      });
      expect(component.isLoggingBottle()).toBe(false);
      expect(quickLoggedSpy).toHaveBeenCalled();
      expect(toastService.success).toHaveBeenCalledWith('Bottle feeding recorded: 2 oz');
    });

    it('should calculate age-based amount correctly for 3-month-old (5 oz)', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-11-15', // ~3 months old -> 5 oz
        gender: 'F',
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

      component.quickLogBottle();

      expect(feedingsService.create).toHaveBeenCalledWith(1, {
        feeding_type: 'bottle',
        fed_at: mockDate.toISOString(),
        amount_oz: 5,
      });
    });

    it('should calculate age-based amount correctly for 8-month-old (7 oz)', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-06-15', // ~8 months old -> 7 oz
        gender: 'M',
        user_role: 'owner',
        created_at: mockDate.toISOString(),
        updated_at: mockDate.toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };
      const mockFeeding = { id: 123, child: 1, feeding_type: 'bottle' as const, fed_at: mockDate.toISOString(), amount_oz: 7, created_at: mockDate.toISOString(), updated_at: mockDate.toISOString() };

      fixture.componentRef.setInput('child', mockChild);
      vi.mocked(dateTimeService.toUTC).mockReturnValue(mockDate.toISOString());
      vi.mocked(feedingsService.create).mockReturnValue(of(mockFeeding));

      component.quickLogBottle();

      expect(feedingsService.create).toHaveBeenCalledWith(1, {
        feeding_type: 'bottle',
        fed_at: mockDate.toISOString(),
        amount_oz: 7,
      });
    });

    it('should show success toast on successful bottle log', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-12-10',
        gender: 'O',
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

      component.quickLogBottle();

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

      component.quickLogBottle();

      expect(component.isLoggingBottle()).toBe(false);
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
      component.quickLogBottle();

      expect(feedingsService.create).not.toHaveBeenCalled();
      expect(component.isLoggingBottle()).toBe(false);
    });

    it('should not log bottle when childId is not set', () => {
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
      fixture.componentRef.setInput('childId', null);
      component.quickLogBottle();

      expect(feedingsService.create).not.toHaveBeenCalled();
    });

    it('should not log bottle when child date_of_birth is missing', () => {
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '', // Empty date_of_birth
        gender: 'M',
        user_role: 'owner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_feeding: null,
        last_diaper_change: null,
        last_nap: null,
      };

      fixture.componentRef.setInput('child', mockChild);
      component.quickLogBottle();

      expect(feedingsService.create).not.toHaveBeenCalled();
    });

    it('should set isLoggingBottle to true while logging', () => {
      const mockDate = new Date('2026-02-10T10:30:00Z');
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2025-12-10',
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
      let capturedIsLogging = false;

      vi.mocked(feedingsService.create).mockImplementation(() => {
        capturedIsLogging = component.isLoggingBottle();
        return of(mockFeeding);
      });

      component.quickLogBottle();
      expect(capturedIsLogging).toBe(true);
      expect(component.isLoggingBottle()).toBe(false);
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
      expect(buttons.length).toBe(5);
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

    it('should show bottle emoji when not loading', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      // Bottle button is now at index 4 (after diapers on left, nap on right)
      const bottleButton = buttons[4];
      const emoji = bottleButton.querySelector('span.text-6xl');
      expect(emoji.textContent).toBe('🍼');
      expect(bottleButton.disabled).toBe(false);
    });

    it('should show spinner when loading bottle', () => {
      component.isLoggingBottle.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleButton = buttons[4];
      const spinner = bottleButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      const emoji = bottleButton.querySelector('span.text-6xl');
      expect(emoji).toBeFalsy();
      expect(bottleButton.disabled).toBe(true);
    });

    it('should have bottle button with rose gradient', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleButton = buttons[4];
      expect(bottleButton.classList.contains('border-rose-400')).toBe(true);
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

    it('should have aria-busy="true" when loading bottle', () => {
      component.isLoggingBottle.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleButton = buttons[4];
      expect(bottleButton.getAttribute('aria-busy')).toBe('true');
    });

    it('should show large spinner (w-10 h-10) when loading bottle', () => {
      component.isLoggingBottle.set(true);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleButton = buttons[4];
      const spinner = bottleButton.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
      expect(spinner.classList.contains('w-10')).toBe(true);
      expect(spinner.classList.contains('h-10')).toBe(true);
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

    it('should display bottle amount on button', () => {
      const mockChild: Child = {
        id: 1,
        name: 'Baby',
        date_of_birth: '2026-02-05', // Newborn -> 2 oz
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
      const bottleButton = buttons[4];
      const amountText = bottleButton.querySelector('span.text-base');
      expect(amountText?.textContent).toContain('2 oz');
    });

    it('should not display bottle amount when child is null', () => {
      fixture.componentRef.setInput('child', null);
      fixture.componentRef.setInput('childId', 1);
      fixture.componentRef.setInput('canEdit', true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const bottleButton = buttons[4];
      const amountText = bottleButton.querySelector('span.text-base');
      expect(amountText).toBeFalsy();
    });

    it('should update bottle amount when child changes', () => {
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
      expect(component.bottleAmount()).toBe(2);

      fixture.componentRef.setInput('child', mockChild2);
      expect(component.bottleAmount()).toBe(7);
    });

    it('should have descriptive aria-label with bottle amount', () => {
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
      const bottleButton = buttons[4];
      expect(bottleButton.getAttribute('aria-label')).toBe('Log a bottle feeding with 5 oz');
    });
  });
});
