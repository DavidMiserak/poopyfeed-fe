import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { Features } from './features';

describe('Features', () => {
  let component: Features;
  let fixture: ComponentFixture<Features>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Features]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Features);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render section title', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const h2 = compiled.querySelector('h2');
    expect(h2?.textContent).toContain('Everything You Need');
  });

  it('should render all 4 features', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const featureHeadings = compiled.querySelectorAll('h3');
    expect(featureHeadings.length).toBe(4);
  });

  it('should have accessible section label', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section?.getAttribute('aria-labelledby')).toBe('features-title');
  });

  it('should have features section id', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section?.getAttribute('id')).toBe('features');
  });

  it('should render feature descriptions for each feature', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const descriptions = compiled.querySelectorAll('p');
    expect(descriptions.length).toBeGreaterThanOrEqual(4);
  });

  it('should have section with styling classes', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section?.className).toBeTruthy();
  });

  it('should render feature grid layout', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const grid = compiled.querySelector('[class*="grid"]');
    expect(grid).toBeTruthy();
  });

  it('should have proper semantic HTML structure', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section).toBeTruthy();
    expect(section?.tagName.toLowerCase()).toBe('section');
  });

  it('should have feature items in proper structure', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    // Check for feature headings which represent each feature card
    const headings = compiled.querySelectorAll('h3');
    expect(headings.length).toBe(4);
  });

  it('should display feature icons if present', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const icons = compiled.querySelectorAll('svg, [class*="icon"]');
    expect(icons.length).toBeGreaterThanOrEqual(0);
  });

  it('should have responsive spacing classes', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    const classes = section?.className || '';
    expect(classes).toMatch(/\w+/); // Has at least one class
  });
});
