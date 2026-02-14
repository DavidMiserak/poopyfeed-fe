import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  template: `
    <div class="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
        <!-- Date Range Section -->
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
          <div class="flex flex-col">
            <label for="dateFrom" class="mb-1 text-sm font-medium text-gray-700">
              From
            </label>
            <input
              id="dateFrom"
              type="date"
              [value]="filters().dateFrom || ''"
              (change)="onDateFromChange($event)"
              class="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              [attr.aria-label]="'Filter from date'"
            />
          </div>

          <div class="flex flex-col">
            <label for="dateTo" class="mb-1 text-sm font-medium text-gray-700">
              To
            </label>
            <input
              id="dateTo"
              type="date"
              [value]="filters().dateTo || ''"
              (change)="onDateToChange($event)"
              class="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              [attr.aria-label]="'Filter to date'"
            />
          </div>
        </div>

        <!-- Type Filter Section -->
        @if (typeOptions().length > 0) {
          <div class="flex flex-col">
            <label for="filterType" class="mb-1 text-sm font-medium text-gray-700">
              {{ filterLabel() }}
            </label>
            <select
              id="filterType"
              [value]="filters().type || ''"
              (change)="onTypeChange($event)"
              class="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              [attr.aria-label]="filterLabel()"
            >
              <option value="">All Types</option>
              @for (option of typeOptions(); track option.value) {
                <option [value]="option.value">
                  {{ option.label }}
                </option>
              }
            </select>
          </div>
        }

        <!-- Clear Button -->
        @if (hasActiveFilters()) {
          <button
            (click)="clearFilters()"
            class="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            [attr.aria-label]="'Clear all filters'"
          >
            Clear
          </button>
        }
      </div>

      <!-- Active Filters Display -->
      @if (hasActiveFilters()) {
        <div class="mt-3 flex flex-wrap gap-2">
          @if (filters().dateFrom) {
            <div class="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
              <span>From: {{ formatDateForDisplay(filters().dateFrom!) }}</span>
            </div>
          }
          @if (filters().dateTo) {
            <div class="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
              <span>To: {{ formatDateForDisplay(filters().dateTo!) }}</span>
            </div>
          }
          @if (filters().type) {
            <div class="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
              <span>{{ getTypeLabel(filters().type!) }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
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
