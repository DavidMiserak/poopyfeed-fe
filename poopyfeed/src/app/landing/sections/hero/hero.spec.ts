import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Hero } from './hero';
import { AuthService } from '../../../services/auth.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Hero', () => {
  let component: Hero;
  let fixture: ComponentFixture<Hero>;
  let authService: AuthService;

  beforeEach(async () => {
    const authServiceMock = {
      isAuthenticated: vi.fn(() => false),
      getToken: vi.fn(() => null),
    };

    await TestBed.configureTestingModule({
      imports: [Hero],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Hero);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render hero headline', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1');
    expect(h1?.textContent).toContain('Track Your Baby');
  });

  it('should have primary CTA button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[routerLink="/signup"]');
    expect(link?.textContent).toContain('Get Started');
  });

  it('should have accessible section label', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section?.getAttribute('aria-labelledby')).toBe('hero-title');
  });

  it('should have subheading text', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const subheading = compiled.querySelector('p, .subtitle, .description');
    expect(subheading?.textContent).toBeTruthy();
  });

  it('should have hero section element', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section).toBeTruthy();
  });

  it('should have layout elements with styling', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section?.className).toBeTruthy();
  });

  it('should have responsive heading styling', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1');
    expect(h1?.className).toBeTruthy();
  });

  it('should render CTA button with proper link target', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const ctaButton = compiled.querySelector('a[routerLink="/signup"]');
    expect(ctaButton).toBeTruthy();
    expect(ctaButton?.getAttribute('routerLink')).toBe('/signup');
  });

  it('should have semantic section structure', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section?.tagName.toLowerCase()).toBe('section');
  });

  it('should display multiple CTA options if available', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('a, button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('should have hero background styling', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    const styles = window.getComputedStyle(section!);
    expect(section?.className).toBeTruthy();
  });

  it('should have proper text hierarchy', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1');
    const paragraphs = compiled.querySelectorAll('p');
    expect(h1).toBeTruthy();
    expect(paragraphs.length).toBeGreaterThanOrEqual(1);
  });

  it('should inject AuthService', () => {
    expect(component.authService).toBeTruthy();
  });

  it('should have access to authentication state', () => {
    expect(component.authService.isAuthenticated).toBeDefined();
  });
});
