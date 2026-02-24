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
      component.cancel.subscribe(spy);

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
    it('should apply rose gradient by default', () => {
      const classes = component.buildGradientClass();

      expect(classes).toContain('from-rose-400');
      expect(classes).toContain('via-rose-500');
      expect(classes).toContain('to-rose-600');
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
});
