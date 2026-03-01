import { describe, it, expect, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActionButtonGroupComponent } from './action-button-group.component';

describe('ActionButtonGroupComponent', () => {
  let component: ActionButtonGroupComponent;
  let fixture: ComponentFixture<ActionButtonGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionButtonGroupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionButtonGroupComponent);
    component = fixture.componentInstance;
  });

  describe('Event Outputs', () => {
    it('should emit cancel event when onCancel is called', () => {
      const spy = vi.fn();
      component.cancelClick.subscribe(spy);

      component.onCancel();

      expect(spy).toHaveBeenCalled();
    });

    it('should emit primary event when onPrimaryClick is called', () => {
      const spy = vi.fn();
      component.primary.subscribe(spy);

      component.onPrimaryClick();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('buildPrimaryButtonClass', () => {
    it('should apply rose border color by default', () => {
      const classes = component.buildPrimaryButtonClass();

      expect(classes).toContain('border-rose-400');
      expect(classes).toContain('border-2');
    });

    it('should include common button classes', () => {
      const classes = component.buildPrimaryButtonClass();

      expect(classes).toContain('flex-1');
      expect(classes).toContain('px-6');
      expect(classes).toContain('py-3');
      expect(classes).toContain('rounded-xl');
      expect(classes).toContain('text-white');
      expect(classes).toContain('shadow-xl');
      expect(classes).toContain('disabled:opacity-50');
    });

    it('should return a valid class string', () => {
      const classes = component.buildPrimaryButtonClass();
      expect(typeof classes).toBe('string');
      expect(classes.length).toBeGreaterThan(0);
    });
  });

  describe('buildGradientClass', () => {
    function setRequiredInputs(): void {
      fixture.componentRef.setInput('primaryLabel', 'Save');
      fixture.componentRef.setInput('primaryLoadingLabel', 'Saving...');
    }

    it('should apply rose gradient by default', () => {
      const classes = component.buildGradientClass();

      expect(classes).toContain('from-rose-400');
      expect(classes).toContain('via-rose-500');
      expect(classes).toContain('to-rose-600');
    });

    it('should apply orange gradient when accentColor is orange', () => {
      setRequiredInputs();
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.detectChanges();
      const classes = component.buildGradientClass();
      expect(classes).toContain('from-orange-400');
      expect(classes).toContain('via-orange-500');
      expect(classes).toContain('to-orange-600');
    });

    it('should apply amber gradient when accentColor is amber', () => {
      setRequiredInputs();
      fixture.componentRef.setInput('accentColor', 'amber');
      fixture.detectChanges();
      const classes = component.buildGradientClass();
      expect(classes).toContain('from-amber-400');
      expect(classes).toContain('via-amber-500');
      expect(classes).toContain('to-amber-600');
    });

    it('should apply red gradient when accentColor is red', () => {
      setRequiredInputs();
      fixture.componentRef.setInput('accentColor', 'red');
      fixture.detectChanges();
      const classes = component.buildGradientClass();
      expect(classes).toContain('from-red-500');
      expect(classes).toContain('via-rose-500');
      expect(classes).toContain('to-red-600');
    });

    it('should include transition classes', () => {
      const classes = component.buildGradientClass();

      expect(classes).toContain('transition-transform');
      expect(classes).toContain('duration-300');
      expect(classes).toContain('group-hover:scale-110');
      expect(classes).toContain('group-disabled:scale-100');
    });

    it('should return a valid gradient string', () => {
      const classes = component.buildGradientClass();
      expect(typeof classes).toBe('string');
      expect(classes.length).toBeGreaterThan(0);
    });
  });

  describe('buildPrimaryButtonClass accent colors', () => {
    function setRequiredInputs(): void {
      fixture.componentRef.setInput('primaryLabel', 'Save');
      fixture.componentRef.setInput('primaryLoadingLabel', 'Saving...');
    }

    it('should apply orange border when accentColor is orange', () => {
      setRequiredInputs();
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.detectChanges();
      const classes = component.buildPrimaryButtonClass();
      expect(classes).toContain('border-orange-400');
    });

    it('should apply amber border when accentColor is amber', () => {
      setRequiredInputs();
      fixture.componentRef.setInput('accentColor', 'amber');
      fixture.detectChanges();
      const classes = component.buildPrimaryButtonClass();
      expect(classes).toContain('border-amber-400');
    });

    it('should apply red border when accentColor is red', () => {
      setRequiredInputs();
      fixture.componentRef.setInput('accentColor', 'red');
      fixture.detectChanges();
      const classes = component.buildPrimaryButtonClass();
      expect(classes).toContain('border-red-600');
    });
  });
});
