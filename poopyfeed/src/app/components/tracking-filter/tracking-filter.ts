import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject,
} from '@angular/core';
import { FilterService, FilterCriteria } from '../../services/filter.service';

/**
 * Reusable filter controls component for tracking lists.
 *
 * Provides date range and type filtering for Feedings, Diapers, and Naps lists.
 * Emits filter changes as the user updates controls.
 *
 * @example
 * <app-tracking-filter
 *   [typeOptions]="feedingTypes"
 *   [filterLabel]="'Feeding Type'"
 *   (filterChange)="onFilterChange($event)"
 * />
 */
@Component({
  selector: 'app-tracking-filter',
  templateUrl: './tracking-filter.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingFilterComponent {
  private filterService = inject(FilterService);

  // Inputs
  typeOptions = input<Array<{ value: string; label: string }>>([]);
  filterLabel = input('Type');

  // Outputs
  filterChange = output<FilterCriteria>();

  // State
  filters = signal<FilterCriteria>({});

  // Computed
  hasActiveFilters = computed(
    () => !!(this.filters().dateFrom || this.filters().dateTo || this.filters().type)
  );

  // Handlers
  onDateFromChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateFilter({ dateFrom: value || undefined });
  }

  onDateToChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateFilter({ dateTo: value || undefined });
  }

  onTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.updateFilter({ type: value || undefined });
  }

  clearFilters(): void {
    this.filters.set({});
    this.filterChange.emit({});
  }

  // Utilities
  private updateFilter(partial: Partial<FilterCriteria>): void {
    const updated = { ...this.filters(), ...partial };
    this.filters.set(updated);
    this.filterChange.emit(updated);
  }

  formatDateForDisplay(isoDate: string): string {
    return this.filterService.formatDateForDisplay(isoDate);
  }

  getTypeLabel(typeValue: string): string {
    const option = this.typeOptions().find((opt) => opt.value === typeValue);
    return option?.label || typeValue;
  }
}
