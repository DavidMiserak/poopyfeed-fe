import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackingBulkActionsComponent } from './tracking-bulk-actions.component';
import { CommonModule } from '@angular/common';

describe('TrackingBulkActionsComponent', () => {
  let component: TrackingBulkActionsComponent;
  let fixture: ComponentFixture<TrackingBulkActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackingBulkActionsComponent, CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackingBulkActionsComponent);
    component = fixture.componentInstance;
  });

  describe('rendering', () => {
    it('should display the selected count', () => {
      fixture.componentRef.setInput('selectedCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', false);
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('5 selected');
    });

    it('should display delete button with correct count', () => {
      fixture.componentRef.setInput('selectedCount', 3);
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('isDeleting', false);
      fixture.detectChanges();

      const deleteBtn = fixture.nativeElement.querySelector('button:nth-of-type(2)');
      expect(deleteBtn.textContent).toContain('Delete 3');
    });

    it('should have Cancel and Delete buttons', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'amber');
      fixture.componentRef.setInput('isDeleting', false);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toContain('Cancel');
      expect(buttons[1].textContent).toContain('Delete');
    });
  });

  describe('gradient classes', () => {
    it('should apply rose gradient for rose accent color', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', false);

      expect(component.gradientClass()).toBe('from-rose-100 to-pink-100');
    });

    it('should apply orange gradient for orange accent color', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('isDeleting', false);

      expect(component.gradientClass()).toBe('from-orange-100 to-amber-100');
    });

    it('should apply amber gradient for amber accent color', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'amber');
      fixture.componentRef.setInput('isDeleting', false);

      expect(component.gradientClass()).toBe('from-amber-100 to-yellow-100');
    });
  });

  describe('border classes', () => {
    it('should apply rose border for rose accent color', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', false);

      expect(component.borderClass()).toBe('border-rose-300');
    });

    it('should apply orange border for orange accent color', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('isDeleting', false);

      expect(component.borderClass()).toBe('border-orange-300');
    });

    it('should apply amber border for amber accent color', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'amber');
      fixture.componentRef.setInput('isDeleting', false);

      expect(component.borderClass()).toBe('border-amber-300');
    });
  });

  describe('delete state', () => {
    it('should show spinning icon when isDeleting is true', () => {
      fixture.componentRef.setInput('selectedCount', 2);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', true);
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
    });

    it('should not show spinner when isDeleting is false', () => {
      fixture.componentRef.setInput('selectedCount', 2);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', false);
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('svg.animate-spin');
      expect(spinner).toBeFalsy();
    });

    it('should disable buttons when isDeleting is true', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons.forEach((btn: HTMLButtonElement) => {
        expect(btn.disabled).toBe(true);
      });
    });

    it('should enable buttons when isDeleting is false', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', false);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons.forEach((btn: HTMLButtonElement) => {
        expect(btn.disabled).toBe(false);
      });
    });
  });

  describe('events', () => {
    it('should emit cancel event when Cancel button clicked', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', false);
      fixture.detectChanges();

      let cancelEmitted = false;
      component.cancel.subscribe(() => {
        cancelEmitted = true;
      });

      const cancelBtn = fixture.nativeElement.querySelector('button:first-of-type');
      cancelBtn.click();

      expect(cancelEmitted).toBe(true);
    });

    it('should emit delete event when Delete button clicked', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', false);
      fixture.detectChanges();

      let deleteEmitted = false;
      component.delete.subscribe(() => {
        deleteEmitted = true;
      });

      const deleteBtn = fixture.nativeElement.querySelector('button:nth-of-type(2)');
      deleteBtn.click();

      expect(deleteEmitted).toBe(true);
    });

    it('should not emit delete event when button is disabled', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', true);
      fixture.detectChanges();

      let deleteEmitted = false;
      component.delete.subscribe(() => {
        deleteEmitted = true;
      });

      const deleteBtn = fixture.nativeElement.querySelector('button:nth-of-type(2)');
      deleteBtn.click();

      // Button is disabled, so click shouldn't trigger the event
      expect(deleteEmitted).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on Cancel button', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', false);
      fixture.detectChanges();

      const cancelBtn = fixture.nativeElement.querySelector('button:first-of-type');
      expect(cancelBtn.getAttribute('aria-label')).toBe('Cancel selection');
    });

    it('should have aria-label on Delete button', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', false);
      fixture.detectChanges();

      const deleteBtn = fixture.nativeElement.querySelector('button:nth-of-type(2)');
      expect(deleteBtn.getAttribute('aria-label')).toBe('Delete selected items');
    });

    it('should set aria-busy when isDeleting is true', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', true);
      fixture.detectChanges();

      const deleteBtn = fixture.nativeElement.querySelector('button:nth-of-type(2)');
      expect(deleteBtn.getAttribute('aria-busy')).toBe('true');
    });

    it('should have aria-hidden on spinner SVG', () => {
      fixture.componentRef.setInput('selectedCount', 1);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('isDeleting', true);
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
