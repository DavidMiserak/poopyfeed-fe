import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SymptomSelectionComponent } from './symptom-selection';

describe('SymptomSelectionComponent', () => {
  let component: SymptomSelectionComponent;
  let fixture: ComponentFixture<SymptomSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SymptomSelectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SymptomSelectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('childDateOfBirth', '2025-01-01'); // ~14 months from 2026-03
    fixture.detectChanges();
  });

  it('shows Refusing food when child is 12+ months', () => {
    fixture.componentRef.setInput('childDateOfBirth', '2025-01-01');
    fixture.detectChanges();
    expect(component.visibleSymptoms().length).toBe(4);
    expect(component.visibleSymptoms().some((s) => s.id === 'refusing_food')).toBe(true);
  });

  it('hides Refusing food when child is under 12 months', () => {
    fixture.componentRef.setInput('childDateOfBirth', '2025-09-01'); // ~6 months
    fixture.detectChanges();
    expect(component.visibleSymptoms().some((s) => s.id === 'refusing_food')).toBe(false);
    expect(component.visibleSymptoms().length).toBe(3);
  });

  it('emits symptomSelected when a symptom is clicked', () => {
    let emitted: string | null = null;
    fixture.componentRef.setInput('childDateOfBirth', '2025-09-01');
    fixture.detectChanges();
    component.symptomSelected.subscribe((id) => (emitted = id));
    component.select('crying');
    expect(emitted).toBe('crying');
  });

  it('isSelected returns true for selected symptom', () => {
    fixture.componentRef.setInput('selectedSymptom', 'wont_sleep');
    fixture.detectChanges();
    expect(component.isSelected('wont_sleep')).toBe(true);
    expect(component.isSelected('crying')).toBe(false);
  });
});
