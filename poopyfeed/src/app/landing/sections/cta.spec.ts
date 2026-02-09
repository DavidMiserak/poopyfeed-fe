import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Cta } from './cta';

describe('Cta', () => {
  let component: Cta;
  let fixture: ComponentFixture<Cta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cta],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Cta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render CTA headline', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const h2 = compiled.querySelector('h2');
    expect(h2?.textContent).toContain('Start Tracking Today');
  });

  it('should have sign up button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[routerLink="/signup"]');
    expect(link?.textContent).toContain('Sign Up Free');
  });

  it('should display trust signal', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent;
    expect(text).toContain('No credit card required');
  });

  it('should have accessible section label', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section?.getAttribute('aria-labelledby')).toBe('cta-title');
  });
});
