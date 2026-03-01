import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdvancedToolsGridComponent } from './advanced-tools-grid';

describe('AdvancedToolsGridComponent', () => {
  let fixture: ComponentFixture<AdvancedToolsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvancedToolsGridComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdvancedToolsGridComponent);
    fixture.componentRef.setInput('childId', 1);
    fixture.componentRef.setInput('childName', 'Baby Alice');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render back to dashboard link with childId', () => {
    const el = fixture.nativeElement as HTMLElement;
    const links = el.querySelectorAll<HTMLAnchorElement>('a');
    const backLink = Array.from(links).find((a) => a.textContent?.includes('Back to Dashboard'));
    expect(backLink).toBeTruthy();
    expect(fixture.componentInstance.childId()).toBe(1);
  });

  it('should render heading with child name', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Advanced options for Baby Alice');
  });

  it('should render intro copy', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Power tools and deep dives live here.');
  });

  it('should render all advanced tool links', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('For the Doctor');
    expect(el.textContent).toContain('Trends & Analytics');
    expect(el.textContent).toContain('Export Data');
    expect(el.textContent).toContain('7‑Day Timeline');
    expect(el.textContent).toContain('Catch‑Up Mode');
    expect(el.textContent).toContain('All Feedings');
    expect(el.textContent).toContain('All Diapers');
    expect(el.textContent).toContain('All Naps');
    expect(el.textContent).toContain('Manage Sharing');
  });
});
