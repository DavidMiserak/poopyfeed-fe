import { describe, it, expect, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DeleteConfirmationComponent } from './delete-confirmation.component';

describe('DeleteConfirmationComponent', () => {
  let component: DeleteConfirmationComponent;
  let fixture: ComponentFixture<DeleteConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteConfirmationComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmationComponent);
    component = fixture.componentInstance;
  });

  describe('Inputs', () => {
    it('should have default accentColor to rose', () => {
      expect(component.accentColor()).toBe('rose');
    });

    it('should have default error to null', () => {
      expect(component.error()).toBeNull();
    });
  });

  describe('Outputs', () => {
    it('should emit confirmed event when onConfirm is called', () => {
      const spy = vi.fn();
      component.confirmed.subscribe(spy);

      component.onConfirm();

      expect(spy).toHaveBeenCalled();
    });

    it('should emit cancelled event when onCancel is called', () => {
      const spy = vi.fn();
      component.cancelled.subscribe(spy);

      component.onCancel();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('buildBackLinkClass', () => {
    it('should apply rose hover color by default', () => {
      const classes = component.buildBackLinkClass();

      expect(classes).toContain('hover:text-rose-400');
    });

    it('should include common link classes', () => {
      const classes = component.buildBackLinkClass();

      expect(classes).toContain('text-slate-600');
      expect(classes).toContain('transition-colors');
      expect(classes).toContain('font-medium');
      expect(classes).toContain('inline-flex');
      expect(classes).toContain('items-center');
    });

    it('should return a valid class string', () => {
      const classes = component.buildBackLinkClass();
      expect(typeof classes).toBe('string');
      expect(classes.length).toBeGreaterThan(0);
    });
  });
});
