import { ComponentFixture, TestBed } from '@angular/core/testing';

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
});
