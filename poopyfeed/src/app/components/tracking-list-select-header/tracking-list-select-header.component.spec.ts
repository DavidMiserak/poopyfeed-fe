import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackingListSelectHeaderComponent } from './tracking-list-select-header.component';

describe('TrackingListSelectHeaderComponent', () => {
  let component: TrackingListSelectHeaderComponent;
  let fixture: ComponentFixture<TrackingListSelectHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackingListSelectHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackingListSelectHeaderComponent);
    component = fixture.componentInstance;
  });

  describe('rendering', () => {
    it('should render checkbox', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 0);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeTruthy();
    });

    it('should check checkbox when isAllSelected is true', () => {
      fixture.componentRef.setInput('isAllSelected', true);
      fixture.componentRef.setInput('selectedCount', 5);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const checkbox = fixture.nativeElement.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should uncheck checkbox when isAllSelected is false', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 0);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const checkbox = fixture.nativeElement.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('display text', () => {
    it('should show "All selected" when isAllSelected is true', () => {
      fixture.componentRef.setInput('isAllSelected', true);
      fixture.componentRef.setInput('selectedCount', 5);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('All selected');
    });

    it('should show selection count when partial selection', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 3);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('3 of 5 selected');
    });

    it('should show "Select all" when no selection', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 0);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Select all');
    });

    it('should update text when selectedCount changes', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 0);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      let text = fixture.nativeElement.textContent;
      expect(text).toContain('Select all');

      fixture.componentRef.setInput('selectedCount', 2);
      fixture.detectChanges();

      text = fixture.nativeElement.textContent;
      expect(text).toContain('2 of 5 selected');
    });
  });

  describe('checkbox colors', () => {
    it('should apply rose checkbox color for rose accent', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 0);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');

      expect(component.checkboxClass()).toBe('text-rose-500');
    });

    it('should apply orange checkbox color for orange accent', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 0);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'orange');

      expect(component.checkboxClass()).toBe('text-orange-500');
    });

    it('should apply amber checkbox color for amber accent', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 0);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'amber');

      expect(component.checkboxClass()).toBe('text-amber-500');
    });

    it('should apply checkbox color class to input element', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 0);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.detectChanges();

      const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
      expect(checkbox.className).toContain('text-orange-500');
    });
  });

  describe('events', () => {
    it('should emit toggleSelectAll event when checkbox changed', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 0);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      let toggleEmitted = false;
      component.toggleSelectAll.subscribe(() => {
        toggleEmitted = true;
      });

      const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
      checkbox.dispatchEvent(new Event('change'));

      expect(toggleEmitted).toBe(true);
    });

    it('should emit event when toggling from unchecked to checked', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 0);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      let emitCount = 0;
      component.toggleSelectAll.subscribe(() => {
        emitCount++;
      });

      const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
      checkbox.dispatchEvent(new Event('change'));

      expect(emitCount).toBe(1);
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on checkbox', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 0);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
      expect(checkbox.getAttribute('aria-label')).toBe('Select all items');
    });

    it('should have proper semantic HTML structure', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 0);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const div = fixture.nativeElement.querySelector('div');
      expect(div.className).toContain('flex');
      expect(div.className).toContain('items-center');
      expect(div.className).toContain('gap-4');
    });
  });

  describe('edge cases', () => {
    it('should handle zero total count', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 0);
      fixture.componentRef.setInput('totalCount', 0);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Select all');
    });

    it('should handle selectedCount greater than totalCount (should not happen, but be safe)', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 10);
      fixture.componentRef.setInput('totalCount', 5);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('10 of 5 selected');
    });

    it('should handle large numbers', () => {
      fixture.componentRef.setInput('isAllSelected', false);
      fixture.componentRef.setInput('selectedCount', 999);
      fixture.componentRef.setInput('totalCount', 1000);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('999 of 1000 selected');
    });
  });
});
