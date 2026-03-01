import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SummaryNavComponent } from './summary-nav';

describe('SummaryNavComponent', () => {
  let fixture: ComponentFixture<SummaryNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryNavComponent);
    fixture.componentRef.setInput('childId', 1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render back to advanced link with childId', () => {
    const el = fixture.nativeElement as HTMLElement;
    const links = el.querySelectorAll<HTMLAnchorElement>('a');
    const backLink = Array.from(links).find((a) => a.textContent?.includes('Back to Advanced'));
    expect(backLink).toBeTruthy();
    expect(fixture.componentInstance.childId()).toBe(1);
  });

  it('should render Print button', () => {
    const el = fixture.nativeElement as HTMLElement;
    const printBtn = el.querySelector('button[aria-label="Print summary"]');
    expect(printBtn?.textContent?.trim()).toContain('Print');
  });

  it('should emit printRequested when Print is clicked', () => {
    const emitSpy = vi.fn();
    fixture.componentInstance.printRequested.subscribe(emitSpy);
    const el = fixture.nativeElement as HTMLElement;
    const printBtn = el.querySelector<HTMLButtonElement>('button[aria-label="Print summary"]');
    printBtn?.click();
    fixture.detectChanges();
    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
