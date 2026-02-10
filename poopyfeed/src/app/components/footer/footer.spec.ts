import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Footer } from './footer';
import { RouterTestingModule } from '@angular/router/testing';

describe('Footer Component', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have current year property', () => {
    const currentYear = new Date().getFullYear();
    expect(component['currentYear']).toBe(currentYear);
  });

  it('should render footer element', () => {
    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer).toBeTruthy();
  });

  it('should contain copyright symbol', () => {
    const copyright = fixture.nativeElement.textContent;
    expect(copyright).toContain('©');
  });

  it('should display current year in copyright', () => {
    const currentYear = new Date().getFullYear();
    const footerText = fixture.nativeElement.textContent;
    expect(footerText).toContain(currentYear.toString());
  });

  it('should have footer class', () => {
    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer.classList.contains('footer')).toBeTruthy();
  });

  it('should contain navigation links', () => {
    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should have router links for internal navigation', () => {
    const routerLinks = fixture.nativeElement.querySelectorAll('[routerLink]');
    expect(routerLinks.length).toBeGreaterThan(0);
  });

  it('should have nav element with proper aria-label', () => {
    const nav = fixture.nativeElement.querySelector('[aria-label="Footer navigation"]');
    expect(nav).toBeTruthy();
  });

  it('should have proper semantic HTML with footer element', () => {
    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer.tagName.toLowerCase()).toBe('footer');
  });

  it('should render footer sections', () => {
    const sections = fixture.nativeElement.querySelectorAll('.footer-section');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('should render footer brand section', () => {
    const brand = fixture.nativeElement.querySelector('.footer-brand');
    expect(brand).toBeTruthy();
  });

  it('should display PoopyFeed branding', () => {
    const logoText = fixture.nativeElement.querySelector('.logo-text');
    expect(logoText?.textContent).toContain('PoopyFeed');
  });

  it('should render footer bottom section', () => {
    const bottom = fixture.nativeElement.querySelector('.footer-bottom');
    expect(bottom).toBeTruthy();
  });

  it('should have footer container structure', () => {
    const container = fixture.nativeElement.querySelector('.footer-container');
    expect(container).toBeTruthy();
  });

  it('should display tagline', () => {
    const tagline = fixture.nativeElement.querySelector('.footer-tagline');
    expect(tagline).toBeTruthy();
    expect(tagline?.textContent).toContain('baby care tracking');
  });

  it('should have footer headings in sections', () => {
    const headings = fixture.nativeElement.querySelectorAll('.footer-heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should display footer links', () => {
    const links = fixture.nativeElement.querySelectorAll('.footer-link');
    expect(links.length).toBeGreaterThan(0);
  });
});
