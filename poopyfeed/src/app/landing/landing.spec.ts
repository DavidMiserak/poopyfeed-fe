import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Landing } from './landing';

describe('Landing', () => {
  let component: Landing;
  let fixture: ComponentFixture<Landing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Landing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all section components', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-hero')).toBeTruthy();
    expect(compiled.querySelector('app-features')).toBeTruthy();
    expect(compiled.querySelector('app-benefits')).toBeTruthy();
    expect(compiled.querySelector('app-cta')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });

  it('should wrap sections in main element', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const main = compiled.querySelector('main');

    expect(main).toBeTruthy();
    expect(main?.querySelector('app-hero')).toBeTruthy();
    expect(main?.querySelector('app-features')).toBeTruthy();
    expect(main?.querySelector('app-benefits')).toBeTruthy();
    expect(main?.querySelector('app-cta')).toBeTruthy();
  });

  it('should render footer outside main', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('app-footer');
    const main = compiled.querySelector('main');

    expect(footer).toBeTruthy();
    expect(main?.contains(footer!)).toBe(false);
  });
});
