import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
} from '@angular/core';
import { SYMPTOM_TYPES, type FussBusSymptomId } from './fuss-bus.data';
import { getChildAgeInMonths } from './fuss-bus.utils';

@Component({
  selector: 'app-fuss-bus-symptom-selection',
  standalone: true,
  templateUrl: './symptom-selection.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymptomSelectionComponent {
  /** Child date of birth (YYYY-MM-DD) for age filtering. */
  childDateOfBirth = input.required<string>();
  selectedSymptom = input<FussBusSymptomId | null>(null);

  symptomSelected = output<FussBusSymptomId>();

  private ageMonths = computed(() => {
    const dob = this.childDateOfBirth();
    return dob ? getChildAgeInMonths(dob) : 0;
  });

  /** Symptoms to show: hide Refusing food when age < 12 months. */
  visibleSymptoms = computed(() => {
    const age = this.ageMonths();
    return SYMPTOM_TYPES.filter((s) => {
      if (s.minAgeMonths != null) return age >= s.minAgeMonths;
      return true;
    });
  });

  isSelected(id: FussBusSymptomId): boolean {
    return this.selectedSymptom() === id;
  }

  select(id: FussBusSymptomId): void {
    this.symptomSelected.emit(id);
  }
}
