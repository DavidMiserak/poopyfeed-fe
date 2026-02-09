import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Benefits } from './benefits';

describe('Benefits', () => {
  let component: Benefits;
  let fixture: ComponentFixture<Benefits>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Benefits]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Benefits);
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
    expect(h2?.textContent).toContain('Why Parents Love PoopyFeed');
  });

  it('should render all 3 benefit cards', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const benefitHeadings = compiled.querySelectorAll('h3');
    expect(benefitHeadings.length).toBe(3);
  });

  it('should have accessible section label', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section?.getAttribute('aria-labelledby')).toBe('benefits-title');
  });
});
