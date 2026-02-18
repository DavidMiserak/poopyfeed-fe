import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventCard } from './event-card';
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
      imports: [EventCard],
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
  });

  describe('Delete', () => {
    it('should emit onRemove when delete confirmed', () => {
      window.confirm = vi.fn().mockReturnValue(true) as any;
      const removeSpy = vi.spyOn(component.onRemove, 'emit');

      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.onDelete();

      expect(removeSpy).toHaveBeenCalled();
    });

    it('should not emit onRemove when delete cancelled', () => {
      window.confirm = vi.fn().mockReturnValue(false) as any;
      const removeSpy = vi.spyOn(component.onRemove, 'emit');

      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.onDelete();

      expect(removeSpy).not.toHaveBeenCalled();
    });

    it('should not show toast on delete (parent handles it)', () => {
      window.confirm = vi.fn().mockReturnValue(true) as any;

      fixture.componentRef.setInput('event', mockNewFeedingEvent);
      fixture.detectChanges();

      component.onDelete();

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
});
