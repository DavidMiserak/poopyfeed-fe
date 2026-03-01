import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventCard } from './event-card';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';
import { CatchUpEvent } from '../../models';
import { DateTimeService } from '../../services/datetime.service';
import { ToastService } from '../../services/toast.service';

describe('EventCard', () => {
  let component: EventCard;
  let fixture: ComponentFixture<EventCard>;
  let dateTimeService: any;
  let toastService: any;

  const mockNewFeedingEvent: CatchUpEvent = {
    id: 'event-feeding-1',
    type: 'feeding',
    estimatedTime: '2024-01-15T10:00:00Z',
    isPinned: false,
    isExisting: false,
    data: {
      feeding_type: 'bottle',
      amount_oz: 4,
      fed_at: '2024-01-15T10:00:00Z',
    } as any,
  };

  const mockExistingFeedingEvent: CatchUpEvent = {
    id: 'existing-feeding-1',
    type: 'feeding',
    estimatedTime: '2024-01-15T09:00:00Z',
    isPinned: true,
    isExisting: true,
    existingId: 1,
    data: {
      feeding_type: 'bottle',
      amount_oz: 4,
      fed_at: '2024-01-15T09:00:00Z',
    },
  };

  beforeEach(async () => {
    dateTimeService = {
      toInputFormat: vi.fn().mockImplementation((date: Date | string) => {
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
      }),
    };

    toastService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EventCard, ConfirmDialogComponent],
      providers: [
        { provide: DateTimeService, useValue: dateTimeService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventCard);
    component = fixture.componentInstance;
  });

  describe('New Event Display', () => {
    it('should create component for new event', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      expect(component).toBeDefined();
    });

    it('should display form for new event', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      const form = fixture.nativeElement.querySelector('form');
      expect(form).toBeTruthy();
    });

    it('should have feeding type buttons for feeding event', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const feedingTypeButtons = Array.from(buttons).filter((b: any) =>
        b.textContent?.includes('Bottle'),
      );
      expect(feedingTypeButtons.length).toBeGreaterThan(0);
    });

    it('should have delete button for new event', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      const deleteButton = fixture.nativeElement.textContent?.includes(
        'Remove this activity',
      );
      expect(deleteButton).toBeTruthy();
    });
  });

  describe('Existing Event Display', () => {
    it('should show read-only display for existing event', () => {
      fixture.componentRef.setInput('event', mockExistingFeedingEvent);
      fixture.detectChanges();

      const form = fixture.nativeElement.querySelector('form');
      expect(form).toBeFalsy();
    });

    it('should not show delete button for existing event', () => {
      fixture.componentRef.setInput('event', mockExistingFeedingEvent);
      fixture.detectChanges();

      const deleteButton = fixture.nativeElement.textContent?.includes(
        'Remove this activity',
      );
      expect(deleteButton).toBeFalsy();
    });

    it('should show locked badge for existing event', () => {
      fixture.componentRef.setInput('event', mockExistingFeedingEvent);
      fixture.detectChanges();

      const lockedBadgeElement = fixture.nativeElement.querySelector('[title*="Locked"]');
      expect(lockedBadgeElement).toBeTruthy();
    });

    it('should display relative timestamp for existing event', () => {
      // Create an event from 30 minutes ago
      const now = new Date();
      const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
      const existingEventWithTime: CatchUpEvent = {
        id: 'existing-feeding-test',
        type: 'feeding',
        estimatedTime: thirtyMinsAgo.toISOString(),
        isPinned: true,
        isExisting: true,
        existingId: 1,
        data: {
          feeding_type: 'bottle',
          fed_at: thirtyMinsAgo.toISOString(),
        },
      };

      fixture.componentRef.setInput('event', existingEventWithTime);
      fixture.detectChanges();

      const timeDisplay = fixture.nativeElement.textContent;
      // Should show relative timestamp like "30 mins ago"
      expect(timeDisplay).toMatch(/\d+\s+mins?\s+ago/);
      expect(timeDisplay).not.toMatch(/\d{2}:\d{2}/); // Should not show absolute time
    });
  });

  describe('Delete', () => {
    it('should emit onRemove when delete confirmed', () => {
      const removeSpy = vi.spyOn(component.remove, 'emit');

      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.onDelete();
      component.onDeleteConfirm();

      expect(removeSpy).toHaveBeenCalled();
    });

    it('should not emit onRemove when delete cancelled', () => {
      const removeSpy = vi.spyOn(component.remove, 'emit');

      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.onDelete();
      component.onDeleteCancel();

      expect(removeSpy).not.toHaveBeenCalled();
    });

    it('should not show toast on delete (parent handles it)', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.onDelete();
      component.onDeleteConfirm();

      expect(toastService.success).not.toHaveBeenCalled();
    });
  });

  describe('Preset Buttons', () => {
    it('should set feeding type to bottle', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.setFeedingType('bottle');

      expect(component.eventForm.get('feeding_type')?.value).toBe('bottle');
    });

    it('should set feeding type to breast', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.setFeedingType('breast');

      expect(component.eventForm.get('feeding_type')?.value).toBe('breast');
    });

    it('should set diaper type to wet', () => {
      const mockDiaperEvent: CatchUpEvent = {
        ...mockNewFeedingEvent,
        type: 'diaper',
        data: { change_type: 'wet', changed_at: '2024-01-15T10:00:00Z' } as any,
      };

      fixture.componentRef.setInput('event', mockDiaperEvent);
      fixture.detectChanges();

      component.setDiaperType('wet');

      expect(component.eventForm.get('change_type')?.value).toBe('wet');
    });

    it('should set diaper type to dirty', () => {
      const mockDiaperEvent: CatchUpEvent = {
        ...mockNewFeedingEvent,
        type: 'diaper',
        data: { change_type: 'dirty', changed_at: '2024-01-15T10:00:00Z' } as any,
      };

      fixture.componentRef.setInput('event', mockDiaperEvent);
      fixture.detectChanges();

      component.setDiaperType('dirty');

      expect(component.eventForm.get('change_type')?.value).toBe('dirty');
    });

    it('should set diaper type to both', () => {
      const mockDiaperEvent: CatchUpEvent = {
        ...mockNewFeedingEvent,
        type: 'diaper',
        data: { change_type: 'both', changed_at: '2024-01-15T10:00:00Z' } as any,
      };

      fixture.componentRef.setInput('event', mockDiaperEvent);
      fixture.detectChanges();

      component.setDiaperType('both');

      expect(component.eventForm.get('change_type')?.value).toBe('both');
    });
  });

  describe('Toggle Expand', () => {
    it('should toggle expand state for existing event', () => {
      fixture.componentRef.setInput('event', mockExistingFeedingEvent);
      fixture.detectChanges();

      expect(component.isExpanded()).toBe(false);
      component.toggleExpand();
      expect(component.isExpanded()).toBe(true);
      component.toggleExpand();
      expect(component.isExpanded()).toBe(false);
    });

    it('should not toggle for new event', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.toggleExpand();
      expect(component.isExpanded()).toBe(false);
    });

    it('should show expanded content for existing event', () => {
      fixture.componentRef.setInput('event', mockExistingFeedingEvent);
      fixture.detectChanges();

      component.toggleExpand();
      fixture.detectChanges();

      const expandedContent = fixture.nativeElement.textContent;
      expect(expandedContent).toContain('locked existing event');
    });
  });

  describe('Feeding Validators', () => {
    it('should set amount_oz required validator for bottle', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.setFeedingType('bottle');

      const amountControl = component.eventForm.get('amount_oz');
      amountControl?.setValue(null);
      expect(amountControl?.hasError('required')).toBe(true);
    });

    it('should clear amount_oz validator for breast', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.setFeedingType('breast');

      const amountControl = component.eventForm.get('amount_oz');
      amountControl?.setValue(null);
      expect(amountControl?.hasError('required')).toBe(false);
    });

    it('should set duration_minutes min validator for breast', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.setFeedingType('breast');

      const durationControl = component.eventForm.get('duration_minutes');
      durationControl?.setValue(-5);
      expect(durationControl?.hasError('min')).toBe(true);
    });

    it('should clear duration_minutes validator for bottle', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.setFeedingType('bottle');

      const durationControl = component.eventForm.get('duration_minutes');
      durationControl?.setValue(-5);
      expect(durationControl?.valid).toBe(true);
    });
  });

  describe('Form Initialization', () => {
    it('should initialize form with nap data', () => {
      const mockNapEvent: CatchUpEvent = {
        id: 'event-nap-1',
        type: 'nap',
        estimatedTime: '2024-01-15T10:00:00Z',
        isPinned: false,
        isExisting: false,
        data: {
          napped_at: '2024-01-15T10:00:00Z',
          ended_at: '2024-01-15T11:00:00Z',
        },
      };

      fixture.componentRef.setInput('event', mockNapEvent);
      fixture.detectChanges();

      expect(dateTimeService.toInputFormat).toHaveBeenCalledTimes(2);
      expect(component.eventForm.get('napped_at')?.value).toBeTruthy();
      expect(component.eventForm.get('ended_at')?.value).toBeTruthy();
    });

    it('should initialize form with feeding data including side and notes', () => {
      const mockFeedingWithDetails: CatchUpEvent = {
        id: 'event-feeding-2',
        type: 'feeding',
        estimatedTime: '2024-01-15T10:00:00Z',
        isPinned: false,
        isExisting: false,
        data: {
          feeding_type: 'breast',
          duration_minutes: 15,
          side: 'left',
          notes: 'Good feeding session',
        } as any,
      };

      fixture.componentRef.setInput('event', mockFeedingWithDetails);
      fixture.detectChanges();

      expect(component.eventForm.get('feeding_type')?.value).toBe('breast');
      expect(component.eventForm.get('duration_minutes')?.value).toBe(15);
      expect(component.eventForm.get('side')?.value).toBe('left');
      expect(component.eventForm.get('notes')?.value).toBe('Good feeding session');
    });

    it('should initialize form with diaper data', () => {
      const mockDiaperEvent: CatchUpEvent = {
        id: 'event-diaper-1',
        type: 'diaper',
        estimatedTime: '2024-01-15T10:00:00Z',
        isPinned: false,
        isExisting: false,
        data: {
          change_type: 'dirty',
          changed_at: '2024-01-15T10:00:00Z',
        } as any,
      };

      fixture.componentRef.setInput('event', mockDiaperEvent);
      fixture.detectChanges();

      expect(component.eventForm.get('change_type')?.value).toBe('dirty');
    });

    it('should not initialize form for existing event', () => {
      fixture.componentRef.setInput('event', mockExistingFeedingEvent);
      fixture.detectChanges();

      // Form keeps defaults since existing event skips initializeForm patching
      expect(component.eventForm.get('feeding_type')?.value).toBe('bottle');
    });
  });

  describe('Nap Event Template', () => {
    it('should show nap form fields for nap event', () => {
      const mockNapEvent: CatchUpEvent = {
        id: 'event-nap-1',
        type: 'nap',
        estimatedTime: '2024-01-15T10:00:00Z',
        isPinned: false,
        isExisting: false,
        data: { napped_at: '2024-01-15T10:00:00Z' },
      };

      fixture.componentRef.setInput('event', mockNapEvent);
      fixture.detectChanges();

      const html = fixture.nativeElement.innerHTML;
      expect(html).toContain('Nap Start');
      expect(html).toContain('Nap End');
    });
  });

  describe('Diaper Event Template', () => {
    it('should show diaper type buttons for diaper event', () => {
      const mockDiaperEvent: CatchUpEvent = {
        id: 'event-diaper-1',
        type: 'diaper',
        estimatedTime: '2024-01-15T10:00:00Z',
        isPinned: false,
        isExisting: false,
        data: { change_type: 'wet', changed_at: '2024-01-15T10:00:00Z' } as any,
      };

      fixture.componentRef.setInput('event', mockDiaperEvent);
      fixture.detectChanges();

      const html = fixture.nativeElement.textContent;
      expect(html).toContain('Wet');
      expect(html).toContain('Dirty');
      expect(html).toContain('Both');
    });
  });

  describe('formatTime', () => {
    it('should format estimated time using formatTimestamp', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      const result = component.formatTime();
      expect(typeof result).toBe('string');
    });
  });

  describe('Validation Errors Display', () => {
    it('should display validation errors when present', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.validationErrors.set(['Amount is required', 'Invalid feeding type']);
      fixture.detectChanges();

      const html = fixture.nativeElement.textContent;
      expect(html).toContain('Amount is required');
      expect(html).toContain('Invalid feeding type');
    });

    it('should not display error section when no errors', () => {
      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      const errorSection = fixture.nativeElement.querySelector('.bg-red-50');
      expect(errorSection).toBeFalsy();
    });
  });
});
