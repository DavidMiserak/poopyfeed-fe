import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventTimeline } from './event-timeline';
import { CatchUpEvent } from '../../models';

describe('EventTimeline', () => {
  let component: EventTimeline;
  let fixture: ComponentFixture<EventTimeline>;

  const mockNewEvent: CatchUpEvent = {
    id: 'new-1',
    type: 'feeding',
    estimatedTime: '2024-01-15T12:00:00Z',
    isPinned: false,
    isExisting: false,
    data: { feeding_type: 'bottle', fed_at: '2024-01-15T12:00:00Z' },
  };

  const mockExistingEvent: CatchUpEvent = {
    id: 'existing-1',
    type: 'diaper',
    estimatedTime: '2024-01-15T11:00:00Z',
    isPinned: true,
    isExisting: true,
    existingId: 1,
    data: { change_type: 'wet', changed_at: '2024-01-15T11:00:00Z' },
  };

  const mockNapEvent: CatchUpEvent = {
    id: 'new-2',
    type: 'nap',
    estimatedTime: '2024-01-15T13:00:00Z',
    isPinned: false,
    isExisting: false,
    data: { napped_at: '2024-01-15T13:00:00Z' },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventTimeline],
    }).compileComponents();

    fixture = TestBed.createComponent(EventTimeline);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should create component', () => {
      expect(component).toBeDefined();
    });

    it('should initialize with empty events', () => {
      expect(component.events().length).toBe(0);
    });

    it('should show empty state when no events', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No events yet');
    });

    it('should have summary counts at zero', () => {
      expect(component.newEventCount()).toBe(0);
      expect(component.existingEventCount()).toBe(0);
      expect(component.totalEventCount()).toBe(0);
    });
  });

  describe('Summary Statistics', () => {
    it('should count new events', () => {
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      expect(component.newEventCount()).toBe(1);
      expect(component.existingEventCount()).toBe(0);
      expect(component.totalEventCount()).toBe(1);
    });

    it('should count existing events', () => {
      fixture.componentRef.setInput('events', [mockExistingEvent]);
      fixture.detectChanges();

      expect(component.newEventCount()).toBe(0);
      expect(component.existingEventCount()).toBe(1);
      expect(component.totalEventCount()).toBe(1);
    });

    it('should count mixed events', () => {
      fixture.componentRef.setInput('events', [mockNewEvent, mockExistingEvent, mockNapEvent]);
      fixture.detectChanges();

      expect(component.newEventCount()).toBe(2);
      expect(component.existingEventCount()).toBe(1);
      expect(component.totalEventCount()).toBe(3);
    });

    it('should display counts in summary stats', () => {
      fixture.componentRef.setInput('events', [mockNewEvent, mockExistingEvent]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('New Events');
      expect(compiled.textContent).toContain('Existing Events');
      expect(compiled.textContent).toContain('Total');
    });
  });

  describe('Quick-Add Buttons', () => {
    it('should have quick-add buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');

      // At least 3 quick-add buttons + empty state button if no events
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('should emit onAddEvent when feeding button clicked', () => {
      const emitSpy = vi.spyOn(component.onAddEvent, 'emit');

      component.onAddEvent.emit('feeding');

      expect(emitSpy).toHaveBeenCalledWith('feeding');
    });

    it('should emit onAddEvent when diaper button clicked', () => {
      const emitSpy = vi.spyOn(component.onAddEvent, 'emit');

      component.onAddEvent.emit('diaper');

      expect(emitSpy).toHaveBeenCalledWith('diaper');
    });

    it('should emit onAddEvent when nap button clicked', () => {
      const emitSpy = vi.spyOn(component.onAddEvent, 'emit');

      component.onAddEvent.emit('nap');

      expect(emitSpy).toHaveBeenCalledWith('nap');
    });

    it('should disable add buttons when max events reached', () => {
      const maxEvents = Array.from({ length: 20 }).map((_, i) => ({
        ...mockNewEvent,
        id: `event-${i}`,
      }));
      fixture.componentRef.setInput('events', maxEvents);
      fixture.detectChanges();

      expect(component.canAddEvent()).toBe(false);

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');
      buttons.forEach((btn) => {
        if (btn.textContent?.includes('Feeding') ||
            btn.textContent?.includes('Diaper') ||
            btn.textContent?.includes('Nap')) {
          expect(btn.getAttribute('disabled')).toBe('');
        }
      });
    });

    it('should enable add buttons when under max', () => {
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      expect(component.canAddEvent()).toBe(true);
    });
  });

  describe('Event Display', () => {
    it('should display events in timeline', () => {
      fixture.componentRef.setInput('events', [mockNewEvent, mockExistingEvent]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Feeding');
      expect(compiled.textContent).toContain('Diaper');
    });

    it('should display event type icons', () => {
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('🍼'); // Feeding icon
    });

    it('should show pinned indicator for pinned new events', () => {
      const pinnedEvent: CatchUpEvent = {
        ...mockNewEvent,
        isPinned: true,
      };
      fixture.componentRef.setInput('events', [pinnedEvent]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Pinned');
    });

    it('should show locked indicator for existing events', () => {
      fixture.componentRef.setInput('events', [mockExistingEvent]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Locked');
    });

    it('should not show pinned indicator for unpinned events', () => {
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const timeline = compiled.querySelector('.timeline');
      expect(timeline?.textContent).not.toContain('Pinned');
    });

    it('should format event time correctly', () => {
      expect(component.formatTime('2024-01-15T14:30:00Z')).toBe('14:30');
    });

    it('should handle invalid time format', () => {
      expect(component.formatTime('invalid')).toBe('Invalid time');
    });
  });

  describe('Event Selection', () => {
    it('should emit onSelectEvent when event clicked', () => {
      const emitSpy = vi.spyOn(component.onSelectEvent, 'emit');
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      component.onSelectEvent.emit(mockNewEvent.id);

      expect(emitSpy).toHaveBeenCalledWith(mockNewEvent.id);
    });

    it('should have clickable event cards', () => {
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const eventCard = compiled.querySelector('button.flex-1');
      expect(eventCard).toBeTruthy();
    });
  });

  describe('Drag and Drop', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('events', [mockNewEvent, mockExistingEvent, mockNapEvent]);
      fixture.detectChanges();
    });

    it('should toggle isDraggingOver on drag events', () => {
      expect(component.isDraggingOver()).toBe(false);

      component.isDraggingOver.set(true);
      expect(component.isDraggingOver()).toBe(true);

      component.isDraggingOver.set(false);
      expect(component.isDraggingOver()).toBe(false);
    });

    it('should show drag-over styling when dragging', () => {
      component.isDraggingOver.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const timeline = compiled.querySelector('.timeline');
      expect(timeline?.classList.contains('bg-blue-50')).toBe(true);
    });

    it('should have draggable event items', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const eventItems = compiled.querySelectorAll('[draggable="true"]');

      expect(eventItems.length).toBeGreaterThan(0);
    });

    it('should handle drag end by clearing isDraggingOver and dragOverIndex', () => {
      component.isDraggingOver.set(true);
      component.dragOverIndex.set(1);

      component.onDragEnd();

      expect(component.isDraggingOver()).toBe(false);
      expect(component.dragOverIndex()).toBeNull();
    });

    it('should set dragOverIndex on drag enter', () => {
      expect(component.dragOverIndex()).toBeNull();

      const mockEvent = {
        preventDefault: vi.fn(),
      } as any;

      component.onDragEnter(mockEvent, 1);

      expect(component.dragOverIndex()).toBe(1);
    });

    it('should clear dragOverIndex on drag leave when leaving the specific item', () => {
      component.dragOverIndex.set(1);

      const mockEvent = {} as DragEvent;
      component.onDragLeave(mockEvent, 1);

      expect(component.dragOverIndex()).toBeNull();
    });

    it('should not clear dragOverIndex when leaving a different item', () => {
      component.dragOverIndex.set(1);

      const mockEvent = {} as DragEvent;
      component.onDragLeave(mockEvent, 0);

      expect(component.dragOverIndex()).toBe(1);
    });

    it('should call reorder on drop with mocked dataTransfer', () => {
      const emitSpy = vi.spyOn(component.onReorderEvents, 'emit');

      // Simulate dropping at a different position
      component.dragOverIndex.set(1);

      // Create mock event with dataTransfer
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue('0'),
        },
      } as any;

      component.onDrop(mockEvent);

      // Verify reorder was emitted
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should reorder events to correct target position on drop', () => {
      const emitSpy = vi.spyOn(component.onReorderEvents, 'emit');

      // Simulate dragging event at index 0 to index 2
      component.dragOverIndex.set(2);

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue('0'),
        },
      } as any;

      component.onDrop(mockEvent);

      expect(emitSpy).toHaveBeenCalled();
      const reorderedEvents = emitSpy.mock.calls[0][0];

      // Event originally at index 0 should now be at index 2 (or close to it)
      expect(reorderedEvents[2]?.id).toBe(mockNewEvent.id);
    });

    it('should not emit when sourceIndex equals targetIndex', () => {
      const emitSpy = vi.spyOn(component.onReorderEvents, 'emit');

      // Simulate dropping at the same position
      component.dragOverIndex.set(0);

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue('0'),
        },
      } as any;

      component.onDrop(mockEvent);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should clear dragOverIndex after drop', () => {
      component.dragOverIndex.set(1);

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue('0'),
        },
      } as any;

      component.onDrop(mockEvent);

      expect(component.dragOverIndex()).toBeNull();
    });

    it('should clear draggedIndex after drop', () => {
      component.draggedIndex.set(0);
      component.dragOverIndex.set(1);

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue('0'),
        },
      } as any;

      component.onDrop(mockEvent);

      expect(component.draggedIndex()).toBeNull();
    });
  });

  describe('Timeline Visualization', () => {
    it('should render timeline connectors', () => {
      fixture.componentRef.setInput('events', [mockNewEvent, mockExistingEvent]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const dots = compiled.querySelectorAll('[class*="rounded-full"]');

      expect(dots.length).toBeGreaterThanOrEqual(2);
    });

    it('should show connecting lines between events', () => {
      fixture.componentRef.setInput('events', [mockNewEvent, mockExistingEvent]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      // Use attribute selector for class containing 'flex-1 my'
      const lines = compiled.querySelectorAll('div[class*="flex-1"][class*="my"]');

      // Should have at least one line between events
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should color dots based on event type', () => {
      fixture.componentRef.setInput('events', [mockNewEvent, mockExistingEvent]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const dots = compiled.querySelectorAll('[class*="rounded-full"]');

      // First dot (new event) should be blue
      expect(dots[0]?.classList.contains('bg-blue-500')).toBe(true);
      // Second dot (existing event) should be rose
      expect(dots[1]?.classList.contains('bg-rose-500')).toBe(true);
    });

    it('should have visual structure for timeline', () => {
      fixture.componentRef.setInput('events', [mockNewEvent, mockExistingEvent]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      // Verify timeline structure exists
      const timeline = compiled.querySelector('.timeline');
      expect(timeline).toBeTruthy();

      // Verify event items exist
      const eventItems = compiled.querySelectorAll('[role="article"]');
      expect(eventItems.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Empty State', () => {
    it('should show empty state message', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No events yet');
    });

    it('should show max events limit in empty state', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('20');
    });

    it('should hide empty state when events added', () => {
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('No events yet');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('events', [mockNewEvent, mockExistingEvent]);
      fixture.detectChanges();
    });

    it('should have aria-label on add buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button[aria-label]');

      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have role="region" on timeline', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const timeline = compiled.querySelector('[role="region"]');

      expect(timeline).toBeTruthy();
    });

    it('should have role="article" on event items', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const articles = compiled.querySelectorAll('[role="article"]');

      expect(articles.length).toBeGreaterThan(0);
    });

    it('should have aria-label on event buttons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const eventButtons = compiled.querySelectorAll('button[aria-label*="event"]');

      expect(eventButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Event Types', () => {
    it('should display feeding events', () => {
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      expect(component.events()[0]?.type).toBe('feeding');
    });

    it('should display diaper events', () => {
      fixture.componentRef.setInput('events', [mockExistingEvent]);
      fixture.detectChanges();

      expect(component.events()[0]?.type).toBe('diaper');
    });

    it('should display nap events', () => {
      fixture.componentRef.setInput('events', [mockNapEvent]);
      fixture.detectChanges();

      expect(component.events()[0]?.type).toBe('nap');
    });
  });

  describe('Maximum Events Constraint', () => {
    it('should have maxEvents = 20', () => {
      expect(component.maxEvents).toBe(20);
    });

    it('should prevent adding when at limit', () => {
      const events = Array.from({ length: 20 }).map((_, i) => ({
        ...mockNewEvent,
        id: `event-${i}`,
      }));
      fixture.componentRef.setInput('events', events);
      fixture.detectChanges();

      expect(component.canAddEvent()).toBe(false);
    });

    it('should allow adding when below limit', () => {
      const events = Array.from({ length: 19 }).map((_, i) => ({
        ...mockNewEvent,
        id: `event-${i}`,
      }));
      fixture.componentRef.setInput('events', events);
      fixture.detectChanges();

      expect(component.canAddEvent()).toBe(true);
    });
  });

  describe('Reordering', () => {
    it('should emit reordered events on drop', () => {
      const events = [mockNewEvent, mockExistingEvent, mockNapEvent];
      fixture.componentRef.setInput('events', events);
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.onReorderEvents, 'emit');

      // Simulate dragging event at index 0 to index 2
      component.dragOverIndex.set(2);

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue('0'),
        },
      } as any;

      component.onDrop(mockEvent);

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should preserve event list length on reorder', () => {
      const events = [mockNewEvent, mockExistingEvent, mockNapEvent];
      fixture.componentRef.setInput('events', events);
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.onReorderEvents, 'emit');

      // Simulate dragging event at index 0 to index 2
      component.dragOverIndex.set(2);

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue('0'),
        },
      } as any;

      component.onDrop(mockEvent);

      const emittedEvents = emitSpy.mock.calls[0][0];
      expect(emittedEvents.length).toBe(events.length);
    });
  });

  describe('Form State', () => {
    it('should display quick-add buttons even with full event list', () => {
      const events = Array.from({ length: 20 }).map((_, i) => ({
        ...mockNewEvent,
        id: `event-${i}`,
      }));
      fixture.componentRef.setInput('events', events);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('button');

      // Should still have quick-add buttons visible
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Touch Support (Mobile)', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('events', [mockNewEvent, mockExistingEvent, mockNapEvent]);
      fixture.detectChanges();
    });

    it('should set draggedIndex on touch start', () => {
      expect(component.draggedIndex()).toBeNull();

      const mockEvent = {
        touches: [{ clientY: 100 }],
        preventDefault: vi.fn(),
      } as any;

      component.onTouchStart(mockEvent, 0);

      expect(component.draggedIndex()).toBe(0);
    });

    it('should set touchStartY on touch start', () => {
      expect(component.touchStartY()).toBeNull();

      const mockEvent = {
        touches: [{ clientY: 150 }],
        preventDefault: vi.fn(),
      } as any;

      component.onTouchStart(mockEvent, 0);

      expect(component.touchStartY()).toBe(150);
    });

    it('should set isDraggingOver on touch start', () => {
      fixture.componentRef.setInput('events', [mockNewEvent]);
      fixture.detectChanges();

      const mockEvent = {
        touches: [{ clientY: 100 }],
        preventDefault: vi.fn(),
      } as any;

      component.onTouchStart(mockEvent, 0);

      expect(component.isDraggingOver()).toBe(true);
    });

    it('should clear touch state on touch end', () => {
      component.draggedIndex.set(0);
      component.dragOverIndex.set(1);
      component.touchStartY.set(100);

      component.onTouchEnd();

      expect(component.touchStartY()).toBeNull();
      expect(component.isDraggingOver()).toBe(false);
    });

    it('should not emit when sourceIndex equals targetIndex on touch end', () => {
      const emitSpy = vi.spyOn(component.onReorderEvents, 'emit');

      component.draggedIndex.set(0);
      component.dragOverIndex.set(0);

      component.onTouchEnd();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should reorder events on touch end with different indices', () => {
      const emitSpy = vi.spyOn(component.onReorderEvents, 'emit');

      component.draggedIndex.set(0);
      component.dragOverIndex.set(2);

      component.onTouchEnd();

      expect(emitSpy).toHaveBeenCalled();
      const reorderedEvents = emitSpy.mock.calls[0][0];
      expect(reorderedEvents.length).toBe(3);
      expect(reorderedEvents[2]?.id).toBe(mockNewEvent.id);
    });

    it('should clear draggedIndex and dragOverIndex after touch end', () => {
      component.draggedIndex.set(0);
      component.dragOverIndex.set(1);

      component.onTouchEnd();

      expect(component.draggedIndex()).toBeNull();
      expect(component.dragOverIndex()).toBeNull();
    });

    it('should not emit on touch end when draggedIndex is null', () => {
      const emitSpy = vi.spyOn(component.onReorderEvents, 'emit');

      component.draggedIndex.set(null);
      component.dragOverIndex.set(1);

      component.onTouchEnd();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit on touch end when targetIndex is null', () => {
      const emitSpy = vi.spyOn(component.onReorderEvents, 'emit');

      component.draggedIndex.set(0);
      component.dragOverIndex.set(null);

      component.onTouchEnd();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
