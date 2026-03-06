import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StepIndicatorComponent } from './step-indicator';

describe('StepIndicatorComponent', () => {
  let fixture: ComponentFixture<StepIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepIndicatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StepIndicatorComponent);
    fixture.componentRef.setInput('currentStep', 1);
    fixture.detectChanges();
  });

  it('shows step 1 of 3 and step label', () => {
    fixture.componentRef.setInput('currentStep', 1);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Step 1 of 3');
    expect(el.textContent).toContain("What's happening?");
  });

  it('shows step 2 label when currentStep is 2', () => {
    fixture.componentRef.setInput('currentStep', 2);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Step 2 of 3');
    expect(el.textContent).toContain('Things to consider');
  });

  it('has accessible status role', () => {
    const el = fixture.nativeElement as HTMLElement;
    const status = el.querySelector('[role="status"]');
    expect(status).toBeTruthy();
  });
});
