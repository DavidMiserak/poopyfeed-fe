import { describe, it, expect, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ErrorCardComponent } from './error-card.component';

describe('ErrorCardComponent', () => {
  let component: ErrorCardComponent;
  let fixture: ComponentFixture<ErrorCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorCardComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorCardComponent);
    component = fixture.componentInstance;
  });

  describe('Inputs', () => {
    it('should have default errorMessage', () => {
      expect(component.errorMessage()).toBe('An unexpected error occurred');
    });

    it('should have default backButtonText', () => {
      expect(component.backButtonText()).toBe('Go Back');
    });

    it('should have default borderColor as rose', () => {
      expect(component.borderColor()).toBe('rose');
    });

    it('should have default gradientColor as rose', () => {
      expect(component.gradientColor()).toBe('rose');
    });

    it('should default useRouter to true', () => {
      expect(component.useRouter()).toBe(true);
    });

    it('should default backRoute to empty array', () => {
      expect(component.backRoute()).toEqual([]);
    });
  });

  describe('Outputs', () => {
    it('should emit backAction event', () => {
      const spy = vi.fn();
      component.backAction.subscribe(spy);

      component.backAction.emit();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('buildButtonClass', () => {
    it('should include base button classes', () => {
      const classes = component.buildButtonClass();

      expect(classes).toContain('group');
      expect(classes).toContain('relative');
      expect(classes).toContain('inline-flex');
      expect(classes).toContain('px-6');
      expect(classes).toContain('py-3');
      expect(classes).toContain('rounded-xl');
      expect(classes).toContain('font-bold');
      expect(classes).toContain('text-white');
      expect(classes).toContain('border-2');
    });
  });

  describe('buildGradientClass', () => {
    it('should apply rose gradient by default', () => {
      const classes = component.buildGradientClass();

      expect(classes).toContain('from-rose-400');
      expect(classes).toContain('via-orange-400');
      expect(classes).toContain('to-amber-400');
    });

    it('should apply orange gradient when gradientColor is orange', () => {
      fixture.componentRef.setInput('gradientColor', 'orange');
      fixture.detectChanges();
      const classes = component.buildGradientClass();

      expect(classes).toContain('from-orange-400');
      expect(classes).toContain('via-orange-500');
      expect(classes).toContain('to-amber-400');
    });

    it('should apply amber gradient when gradientColor is amber', () => {
      fixture.componentRef.setInput('gradientColor', 'amber');
      fixture.detectChanges();
      const classes = component.buildGradientClass();

      expect(classes).toContain('from-amber-400');
      expect(classes).toContain('via-amber-500');
      expect(classes).toContain('to-amber-600');
    });

    it('should include transition classes', () => {
      const classes = component.buildGradientClass();

      expect(classes).toContain('transition-transform');
      expect(classes).toContain('duration-300');
      expect(classes).toContain('group-hover:scale-110');
    });
  });

  describe('template branches', () => {
    it('should render router link when useRouter is true', () => {
      fixture.componentRef.setInput('useRouter', true);
      fixture.componentRef.setInput('backRoute', ['/dashboard']);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const link = el.querySelector('a');
      expect(link).toBeTruthy();
      expect(el.querySelector('button')).toBeFalsy();
    });

    it('should render button and emit backAction when useRouter is false', () => {
      fixture.componentRef.setInput('useRouter', false);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const button = el.querySelector('button');
      expect(button).toBeTruthy();
      expect(el.querySelector('a[routerLink]')).toBeFalsy();

      const spy = vi.fn();
      component.backAction.subscribe(spy);
      (button as HTMLButtonElement).click();
      expect(spy).toHaveBeenCalled();
    });
  });
});
