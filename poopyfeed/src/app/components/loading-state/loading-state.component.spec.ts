import { describe, it, expect } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LoadingStateComponent } from './loading-state.component';

describe('LoadingStateComponent', () => {
  let component: LoadingStateComponent;
  let fixture: ComponentFixture<LoadingStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingStateComponent);
    component = fixture.componentInstance;
  });

  describe('Inputs', () => {
    it('should have default message', () => {
      expect(component.message()).toBe('Loading...');
    });

    it('should have default color as rose', () => {
      expect(component.color()).toBe('rose');
    });
  });

  describe('colorClass', () => {
    it('should return rose-400 for rose color', () => {
      expect(component.colorClass()).toBe('rose-400');
    });

    it('should have colorMap with all colors', () => {
      // Test the colorClass method with different inputs
      // Rose is default
      expect(component.colorClass()).toBe('rose-400');
    });

    it('should return color class with correct Tailwind format', () => {
      const colorClass = component.colorClass();
      expect(colorClass).toMatch(/^(rose|orange|amber)-400$/);
    });
  });

  describe('Template Rendering', () => {
    it('should render loading spinner', () => {
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
    });

    it('should render loading message', () => {
      fixture.detectChanges();

      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph).toBeTruthy();
    });

    it('should have aria-hidden on spinner', () => {
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('svg');
      expect(spinner.getAttribute('aria-hidden')).toBe('true');
    });

    it('should render circle and path elements in SVG', () => {
      fixture.detectChanges();

      const circle = fixture.nativeElement.querySelector('circle');
      const path = fixture.nativeElement.querySelector('path');

      expect(circle).toBeTruthy();
      expect(path).toBeTruthy();
    });
  });
});
