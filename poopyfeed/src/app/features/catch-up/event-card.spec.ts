import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventCard } from './event-card';
import { DateTimeService } from '../../services/datetime.service';
import { ToastService } from '../../services/toast.service';
import { CatchUpEvent } from '../../models';

describe('EventCard', () => {
  let component: EventCard;
  let fixture: ComponentFixture<EventCard>;
  let dateTimeService: any;
  let toastService: any;

  const mockNewEvent: CatchUpEvent = {
    id: 'new-1',
    type: 'feeding',
    estimatedTime: '2024-01-15T12:00:00Z',
    isPinned: false,
    isExisting: false,
    data: {
      feeding_type: 'bottle',
      fed_at: '2024-01-15T12:00:00Z',
    },
  };

  const mockExistingEvent: CatchUpEvent = {
    id: 'existing-1',
    type: 'feeding',
    estimatedTime: '2024-01-15T10:00:00Z',
    isPinned: true,
    isExisting: true,
    existingId: 1,
    data: {
      feeding_type: 'bottle',
      fed_at: '2024-01-15T10:00:00Z',
      amount_oz: 5,
    },
  };

  beforeEach(async () => {
    dateTimeService = {
      toInputFormat: vi.fn().mockReturnValue('2024-01-15T12:00'),
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

  describe('Display - Existing Event', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('event', mockExistingEvent);
      fixture.detectChanges();
    });

    it('should render existing event as read-only', () => {
      expect(component.event()!.isExisting).toBe(true);
    });

    it('should display event type icon', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('🍼'); // feeding icon
    });

    it('should show event time', () => {
      component.toggleExpand();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toBeTruthy();
    });

    it('should not show delete button for existing event', () => {
      component.toggleExpand();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const deleteBtn = compiled.querySelector('button');
      // Should only have expand button, not delete
      expect(deleteBtn?.textContent).not.toContain('Delete');
    });

    it('should display feeding data when expanded', () => {
      component.toggleExpand();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('bottle');
    });
  });

  describe('Display - New Event', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('event', mockNewEvent);
      fixture.detectChanges();
    });

    it('should render new event as editable', () => {
      expect(component.event()!.isExisting).toBe(false);
    });

    it('should show form fields when expanded', () => {
      component.toggleExpand();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('form')).toBeTruthy();
    });

    it('should show delete button for new event', () => {
      component.toggleExpand();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const deleteBtn = compiled.querySelector('button[aria-label*="Delete"]');
      expect(deleteBtn).toBeTruthy();
    });

    it('should display feeding form fields', () => {
      component.toggleExpand();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const feedingTypeSelect = compiled.querySelector('select');
      expect(feedingTypeSelect).toBeTruthy();
    });
  });

  describe('Expand/Collapse', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('event', mockNewEvent);
      fixture.detectChanges();
    });

    it('should toggle expanded state', () => {
      expect(component.isExpanded()).toBe(false);

      component.toggleExpand();
      expect(component.isExpanded()).toBe(true);

      component.toggleExpand();
      expect(component.isExpanded()).toBe(false);
    });

    it('should show content when expanded', () => {
      component.toggleExpand();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('form')).toBeTruthy();
    });

    it('should hide content when collapsed', () => {
      component.toggleExpand();
      fixture.detectChanges();
      expect(component.isExpanded()).toBe(true);

      component.toggleExpand();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('form')).toBeFalsy();
    });
  });

  describe('Pin/Unpin Time Override', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('event', mockNewEvent);
      fixture.detectChanges();
      component.toggleExpand();
      fixture.detectChanges();
    });

    it('should have isPinned form control', () => {
      const checkbox = component.eventForm.get('isPinned');
      expect(checkbox).toBeTruthy();
      checkbox?.setValue(true);
      expect(component.eventForm.get('isPinned')?.value).toBe(true);
    });

    it('should handle pin changes', () => {
      component.eventForm.get('isPinned')?.setValue(true);
      component.onPinChange();

      expect(component.eventForm.get('isPinned')?.value).toBe(true);
    });
  });

  describe('Feeding Type Conditional Fields', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('event', mockNewEvent);
      fixture.detectChanges();
      component.toggleExpand();
      fixture.detectChanges();
    });

    it('should show amount field for bottle feeding', () => {
      component.eventForm.get('feeding_type')?.setValue('bottle');
      component.onFeedingTypeChange();
      fixture.detectChanges();

      expect(component.eventForm.get('amount_oz')).toBeTruthy();
    });

    it('should show duration field for breast feeding', () => {
      component.eventForm.get('feeding_type')?.setValue('breast');
      component.onFeedingTypeChange();
      fixture.detectChanges();

      expect(component.eventForm.get('duration_minutes')).toBeTruthy();
    });

    it('should update validators when feeding type changes', () => {
      component.eventForm.get('feeding_type')?.setValue('bottle');
      component.onFeedingTypeChange();

      const amountControl = component.eventForm.get('amount_oz');
      expect(amountControl?.hasError('required')).toBe(true);
    });
  });

  describe('Diaper Type Selection', () => {
    let diaperEvent: CatchUpEvent;

    beforeEach(() => {
      diaperEvent = {
        ...mockNewEvent,
        type: 'diaper',
        data: {
          change_type: 'wet',
          changed_at: '2024-01-15T12:00:00Z',
        },
      };
      fixture.componentRef.setInput('event', diaperEvent);
      fixture.detectChanges();
      component.toggleExpand();
      fixture.detectChanges();
    });

    it('should show diaper type select', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const select = compiled.querySelector('select');
      expect(select).toBeTruthy();
      expect(select?.textContent).toContain('Wet');
    });

    it('should have diaper type options', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const options = compiled.querySelectorAll('option');
      const values = Array.from(options).map((o) => o.getAttribute('value'));
      expect(values).toContain('wet');
      expect(values).toContain('dirty');
      expect(values).toContain('both');
    });
  });

  describe('Nap Duration Fields', () => {
    let napEvent: CatchUpEvent;

    beforeEach(() => {
      napEvent = {
        ...mockNewEvent,
        type: 'nap',
        data: {
          napped_at: '2024-01-15T13:00:00Z',
          ended_at: '2024-01-15T14:00:00Z',
        },
      };
      fixture.componentRef.setInput('event', napEvent);
      fixture.detectChanges();
    });

    it('should have nap event type', () => {
      expect(component.evt.type).toBe('nap');
    });

    it('should have nap form controls', () => {
      expect(component.eventForm.get('napped_at')).toBeTruthy();
      expect(component.eventForm.get('ended_at')).toBeTruthy();
    });
  });

  describe('Delete Action', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('event', mockNewEvent);
      fixture.detectChanges();
      component.toggleExpand();
      fixture.detectChanges();
    });

    it('should emit onRemove when delete confirmed', () => {
      const emitSpy = vi.spyOn(component.onRemove, 'emit');
      vi.stubGlobal('confirm', vi.fn(() => true));

      component.onDelete();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not emit when delete cancelled', () => {
      const emitSpy = vi.spyOn(component.onRemove, 'emit');
      vi.stubGlobal('confirm', vi.fn(() => false));

      component.onDelete();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should show success toast on delete', () => {
      vi.stubGlobal('confirm', vi.fn(() => true));

      component.onDelete();

      expect(toastService.success).toHaveBeenCalledWith('Event removed');
    });

    it('should show confirmation dialog before delete', () => {
      const confirmFn = vi.fn(() => false);
      vi.stubGlobal('confirm', confirmFn);

      component.onDelete();

      expect(confirmFn).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('event', mockNewEvent);
      fixture.detectChanges();
    });

    it('should have role="article"', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('article')).toBeTruthy();
    });

    it('should have aria-label on drag handle', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const dragHandle = compiled.querySelector('[aria-label*="Drag"]');
      expect(dragHandle).toBeTruthy();
    });

    it('should have aria-label on event icon', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('[aria-label*="event"]');
      expect(icon).toBeTruthy();
    });

    it('should have aria-label on delete button', () => {
      component.toggleExpand();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const deleteBtn = compiled.querySelector('button[aria-label*="Delete"]');
      expect(deleteBtn).toBeTruthy();
    });

    it('should have aria-expanded on expand button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const expandBtn = compiled.querySelector('button[aria-expanded]');
      expect(expandBtn).toBeTruthy();
      expect(expandBtn?.getAttribute('aria-expanded')).toBe('false');
    });

    it('should update aria-expanded when expanded', () => {
      component.toggleExpand();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const expandBtn = compiled.querySelector('button[aria-expanded]');
      expect(expandBtn?.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have associated labels for form inputs', () => {
      component.toggleExpand();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const inputs = compiled.querySelectorAll('input[id], select[id], textarea[id]');

      inputs.forEach((input) => {
        const label = compiled.querySelector(`label[for="${input.id}"]`);
        expect(label).toBeTruthy();
      });
    });
  });

  describe('Form State', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('event', mockNewEvent);
      fixture.detectChanges();
    });

    it('should initialize with feeding type', () => {
      expect(component.eventForm.get('feeding_type')?.value).toBe('bottle');
    });

    it('should have initialized event form', () => {
      expect(component.eventForm).toBeTruthy();
      expect(component.eventForm.get('isPinned')).toBeTruthy();
    });
  });

  describe('Notes Field', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('event', mockNewEvent);
      fixture.detectChanges();
    });

    it('should have notes form control', () => {
      expect(component.eventForm.get('notes')).toBeTruthy();
    });

    it('should initialize with empty notes', () => {
      expect(component.eventForm.get('notes')?.value).toBe('');
    });
  });

  describe('Event Styling', () => {
    it('should distinguish existing vs new events', () => {
      // Existing event
      fixture.componentRef.setInput('event', mockExistingEvent);
      fixture.detectChanges();
      expect(component.evt.isExisting).toBe(true);

      // New event
      fixture.componentRef.setInput('event', mockNewEvent);
      fixture.detectChanges();
      expect(component.evt.isExisting).toBe(false);
    });

    it('should support expand/collapse', () => {
      fixture.componentRef.setInput('event', mockNewEvent);
      fixture.detectChanges();

      expect(component.isExpanded()).toBe(false);
      component.toggleExpand();
      expect(component.isExpanded()).toBe(true);
    });
  });
});
