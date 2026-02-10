import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { QuickLog } from './quick-log';
import { NapsService } from '../../../services/naps.service';
import { DateTimeService } from '../../../services/datetime.service';

describe('QuickLog', () => {
  let component: QuickLog;
  let fixture: ComponentFixture<QuickLog>;
  let napsService: NapsService;
  let dateTimeService: DateTimeService;

  beforeEach(async () => {
    const mockNapsService = {
      create: vi.fn(),
    };
    const mockDateTimeService = {
      toUTC: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [QuickLog],
      providers: [
        { provide: NapsService, useValue: mockNapsService },
        { provide: DateTimeService, useValue: mockDateTimeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickLog);
    component = fixture.componentInstance;
    napsService = TestBed.inject(NapsService);
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

    it('should disable button when canEdit is false', () => {
      fixture.componentRef.setInput('canEdit', false);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
    });

    it('should show error message when napError is set', () => {
      component.napError.set('Test error');
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('p[role="alert"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error');
    });
  });
});
