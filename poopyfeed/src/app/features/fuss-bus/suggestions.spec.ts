import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuggestionsComponent } from './suggestions';

describe('SuggestionsComponent', () => {
  let fixture: ComponentFixture<SuggestionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SuggestionsComponent);
    fixture.componentRef.setInput('suggestions', [
      { text: 'Baby may be hungry — Fed 4h ago', priority: 'high' },
      { text: 'Try techniques from the Soothing Toolkit', priority: 'low' },
    ]);
    fixture.componentRef.setInput('developmentalContexts', []);
    fixture.componentRef.setInput('showColicSection', false);
    fixture.componentRef.setInput('selfCareElevated', false);
    fixture.detectChanges();
  });

  it('renders suggestions', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Baby may be hungry');
    expect(el.textContent).toContain('Soothing Toolkit');
  });

  it('shows colic section when showColicSection is true', () => {
    fixture.componentRef.setInput('showColicSection', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('About colic');
    expect(el.textContent).toContain('3-3-3');
  });

  it('shows developmental contexts when provided', () => {
    fixture.componentRef.setInput('developmentalContexts', ['Teething can cause discomfort.']);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Teething can cause discomfort');
  });

  it('applies elevated styling to self-care when selfCareElevated is true', () => {
    fixture.componentRef.setInput('selfCareElevated', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const section = el.querySelector('[aria-label="Take care of yourself"]');
    expect(section?.classList.contains('bg-rose-100')).toBe(true);
  });

  it('renders glossary terms in soothing toolkit as clickable buttons', () => {
    const el = fixture.nativeElement as HTMLElement;
    const colicHoldButton = Array.from(el.querySelectorAll('button')).find(
      (btn) => btn.textContent?.trim() === 'Colic hold'
    );
    expect(colicHoldButton).toBeTruthy();
    expect(colicHoldButton?.getAttribute('aria-label')).toBe('What is Colic hold?');
  });

  it('opens definition overlay when a glossary term is clicked', () => {
    const el = fixture.nativeElement as HTMLElement;
    const colicHoldButton = Array.from(el.querySelectorAll('button')).find(
      (btn) => btn.textContent?.trim() === 'Colic hold'
    );
    expect(colicHoldButton).toBeTruthy();
    colicHoldButton?.click();
    fixture.detectChanges();
    const overlay = el.querySelector('app-definition-overlay');
    expect(overlay).toBeTruthy();
    const dialog = el.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(el.querySelector('#definition-overlay-title')?.textContent?.trim()).toBe('Colic hold');
  });
});
