import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryEmptyStateComponent } from './summary-empty-state';

describe('SummaryEmptyStateComponent', () => {
  let fixture: ComponentFixture<SummaryEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryEmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryEmptyStateComponent);
    fixture.componentRef.setInput('childName', 'Baby Alice');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render empty message with child name', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No activity in the last 7 days for Baby Alice.');
  });

  it('should render static hint to start logging', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Start logging feedings, diapers, and naps to see a summary here.');
  });
});
