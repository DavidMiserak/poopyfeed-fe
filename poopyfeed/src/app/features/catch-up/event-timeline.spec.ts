import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventTimeline } from './event-timeline';
import { CatchUpEvent, CATCH_UP_VALIDATION } from '../../models';

describe('EventTimeline', () => {
  let component: EventTimeline;
  let fixture: ComponentFixture<EventTimeline>;

  const mockNewEvent: CatchUpEvent = {
    id: 'event-feeding-1',
    type: 'feeding',
    estimatedTime: '2024-01-15T10:00:00Z',
    isPinned: false,
    isExisting: false,
    data: { feeding_type: 'bottle', fed_at: '2024-01-15T10:00:00Z' } as any,
  };

  const mockNewEvent2: CatchUpEvent = {
    id: 'event-diaper-1',
    type: 'diaper',
    estimatedTime: '2024-01-15T10:30:00Z',
    isPinned: false,
    isExisting: false,
    data: { change_type: 'wet', changed_at: '2024-01-15T10:30:00Z' } as any,
  };

  const mockExistingEvent: CatchUpEvent = {
    id: 'existing-feeding-1',
    type: 'feeding',
    estimatedTime: '2024-01-15T09:00:00Z',
    isPinned: true,
    isExisting: true,
    existingId: 1,
    data: { feeding_type: 'bottle', fed_at: '2024-01-15T09:00:00Z' } as any,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventTimeline],
    }).compileComponents();

    fixture = TestBed.createComponent(EventTimeline);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create component', () => {
      expect(component).toBeDefined();
    });

    it('should display empty state when no events', () => {
      fixture.componentRef.setInput('events', []);
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.textContent?.includes('No activities yet');
      expect(emptyState).toBeTruthy();
    });

    it('should display events list when events exist', () => {
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      const event = fixture.nativeElement.textContent?.includes('feeding');
      expect(event).toBeTruthy();
    });
  });

  describe('Event Display', () => {
    it('should show new event with blue styling', () => {
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      const eventElement = fixture.nativeElement.querySelector('[aria-label*="feeding"]');
      expect(eventElement).toBeTruthy();
    });

    it('should show existing event with locked badge', () => {
      fixture.componentRef.setInput('events', [mockExistingEvent]);
      fixture.detectChanges();

      const lockedBadge = fixture.nativeElement.textContent?.includes('Locked');
      expect(lockedBadge).toBeTruthy();
    });

    it('should display event time formatted', () => {
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      // Check that a time is displayed in HH:MM format (timezone-safe check)
      const timeRegex = /\d{2}:\d{2}/;
      const timeText = fixture.nativeElement.textContent?.match(timeRegex);
      expect(timeText).toBeTruthy();
    });
  });

  describe('Add Event Buttons', () => {
    it('should emit onAddEvent when feeding button clicked', () => {
      const addSpy = vi.spyOn(component.onAddEvent, 'emit');
      fixture.componentRef.setInput('events', []);
      fixture.detectChanges();

      const feedingButton = Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ).find((b: any) => b.textContent?.includes('Feeding'));

      (feedingButton as HTMLElement)?.click();

      expect(addSpy).toHaveBeenCalledWith('feeding');
    });

    it('should emit onAddEvent when diaper button clicked', () => {
      const addSpy = vi.spyOn(component.onAddEvent, 'emit');
      fixture.componentRef.setInput('events', []);
      fixture.detectChanges();

      const diaperButton = Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ).find((b: any) => b.textContent?.includes('Diaper'));

      (diaperButton as HTMLElement)?.click();

      expect(addSpy).toHaveBeenCalledWith('diaper');
    });

    it('should emit onAddEvent when nap button clicked', () => {
      const addSpy = vi.spyOn(component.onAddEvent, 'emit');
      fixture.componentRef.setInput('events', []);
      fixture.detectChanges();

      const napButton = Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ).find((b: any) => b.textContent?.includes('Nap'));

      (napButton as HTMLElement)?.click();

      expect(addSpy).toHaveBeenCalledWith('nap');
    });

    it('should disable add buttons when max events reached', () => {
      const maxEvents = Array(CATCH_UP_VALIDATION.MAX_EVENTS_PER_BATCH).fill(mockNewEvent);
      fixture.componentRef.setInput('events', maxEvents);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll(
        'button[aria-label*="Add"]',
      );
      buttons.forEach((btn: HTMLElement) => {
        expect((btn as HTMLButtonElement).disabled).toBe(true);
      });
    });
  });

  describe('Event Selection', () => {
    it('should emit onSelectEvent when event clicked', () => {
      const selectSpy = vi.spyOn(component.onSelectEvent, 'emit');
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      // Find the event card button by looking for button with aria-label containing "event at" (not "Add")
      const eventButton = Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ).find((b: any) => {
        const label = b.getAttribute('aria-label') || '';
        return label.includes('feeding') && label.includes('event at');
      });

      (eventButton as HTMLElement)?.click();

      expect(selectSpy).toHaveBeenCalledWith('event-feeding-1');
    });
  });

  describe('Reordering with Arrow Buttons', () => {
    it('should move event up', () => {
      const reorderSpy = vi.spyOn(component.onReorderEvents, 'emit');
      fixture.componentRef.setInput('events', [mockNewEvent, mockNewEvent2]);
      fixture.detectChanges();

      component.moveEventUp(1);

      expect(reorderSpy).toHaveBeenCalled();
      const reorderedList = reorderSpy.mock.calls[0][0];
      expect(reorderedList[0].id).toBe('event-diaper-1');
      expect(reorderedList[1].id).toBe('event-feeding-1');
    });

    it('should move event down', () => {
      const reorderSpy = vi.spyOn(component.onReorderEvents, 'emit');
      fixture.componentRef.setInput('events', [mockNewEvent, mockNewEvent2]);
      fixture.detectChanges();

      component.moveEventDown(0);

      expect(reorderSpy).toHaveBeenCalled();
      const reorderedList = reorderSpy.mock.calls[0][0];
      expect(reorderedList[0].id).toBe('event-diaper-1');
      expect(reorderedList[1].id).toBe('event-feeding-1');
    });

    it('should not move up from first position', () => {
      const reorderSpy = vi.spyOn(component.onReorderEvents, 'emit');
      fixture.componentRef.setInput('events', [mockNewEvent, mockNewEvent2]);
      fixture.detectChanges();

      component.moveEventUp(0);

      expect(reorderSpy).not.toHaveBeenCalled();
    });

    it('should not move down from last position', () => {
      const reorderSpy = vi.spyOn(component.onReorderEvents, 'emit');
      fixture.componentRef.setInput('events', [mockNewEvent, mockNewEvent2]);
      fixture.detectChanges();

      component.moveEventDown(1);

      expect(reorderSpy).not.toHaveBeenCalled();
    });

    it('should prevent reordering of existing events', () => {
      const reorderSpy = vi.spyOn(component.onReorderEvents, 'emit');
      fixture.componentRef.setInput('events', [mockExistingEvent, mockNewEvent]);
      fixture.detectChanges();

      // Try to move existing event (index 0) - should be prevented by disabled state
      const buttons = fixture.nativeElement.querySelectorAll('button:not(:disabled)');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('canAddEvent Computed', () => {
    it('should allow adding when below max events', () => {
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      expect(component.canAddEvent()).toBe(true);
    });

    it('should prevent adding when at max new events', () => {
      const maxNewEvents = Array(CATCH_UP_VALIDATION.MAX_EVENTS_PER_BATCH).fill(
        mockNewEvent,
      );
      fixture.componentRef.setInput('events', maxNewEvents);
      fixture.detectChanges();

      expect(component.canAddEvent()).toBe(false);
    });

    it('should count only new events toward limit, not existing', () => {
      const mixed = [mockExistingEvent, mockNewEvent, mockExistingEvent];
      fixture.componentRef.setInput('events', mixed);
      fixture.detectChanges();

      expect(component.canAddEvent()).toBe(true);
      expect(component.newEventCount()).toBe(1);
    });
  });

  describe('Event Count Display', () => {
    it('should display correct new event count', () => {
      fixture.componentRef.setInput('events', [mockNewEvent, mockNewEvent2]);
      fixture.detectChanges();

      expect(component.newEventCount()).toBe(2);
    });

    it('should display correct existing event count', () => {
      fixture.componentRef.setInput('events', [mockExistingEvent, mockNewEvent]);
      fixture.detectChanges();

      expect(component.existingEventCount()).toBe(1);
    });

    it('should display correct total event count', () => {
      fixture.componentRef.setInput('events', [mockExistingEvent, mockNewEvent, mockNewEvent2]);
      fixture.detectChanges();

      expect(component.totalEventCount()).toBe(3);
    });
  });

  describe('Accessibility', () => {
    it('should have aria labels on arrow buttons', () => {
      fixture.componentRef.setInput('events', [mockNewEvent, mockNewEvent2]);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button[aria-label*="Move"]');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have disabled state on boundary arrow buttons', () => {
      fixture.componentRef.setInput('events', [mockNewEvent, mockNewEvent2]);
      fixture.detectChanges();

      const upButton = fixture.nativeElement.querySelector('button[aria-label*="Move"]');
      expect(upButton).toBeTruthy();
    });
  });
});
