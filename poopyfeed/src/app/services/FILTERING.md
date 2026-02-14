# Advanced Filtering Implementation Guide

## Overview

Advanced filtering has been implemented across tracking lists (Feedings, Diapers, Naps) using a generic, reusable architecture. This guide explains the system and how to extend it.

## Architecture

### Components

1. **`FilterService`** (`filter.service.ts`)
    - Generic filtering logic
    - Date range parsing
    - Type filtering
    - Reusable across all tracking types

2. **`TrackingFilterComponent`** (`tracking-filter.ts`)
    - Reusable UI component
    - Date inputs (from/to)
    - Type dropdown
    - Active filter display
    - Clear button

3. **Updated Services** (e.g., `FeedingsService`)
    - Enhanced `list()` method with optional filter params
    - Query parameter support for API filtering

4. **Updated List Components** (e.g., `FeedingsList`)
    - Filter state management with signals
    - Client-side filtering with computed properties
    - Integration with filter component

## How It Works

### Signal-Based Filtering Flow

```text
User updates filter controls
         ↓
TrackingFilterComponent emits FilterCriteria
         ↓
Component receives in onFilterChange()
         ↓
filters signal updated
         ↓
computed property re-evaluates
         ↓
FilterService.filter() applies criteria
         ↓
Filtered items rendered
```

### Example: Feedings List

```typescript
// 1. Component has two signals:
allFeedings = signal<Feeding[]>([]); // From API
filters = signal<FilterCriteria>({}); // From user input

// 2. Computed derived value (auto-recalculates)
feedings = computed(() => {
  return this.filterService.filter(
    this.allFeedings(),
    this.filters(),
    'fed_at',        // timestamp field
    'feeding_type'   // type field
  );
});

// 3. When filter changes:
onFilterChange(criteria: FilterCriteria): void {
  this.filters.set(criteria); // Triggers computed re-evaluation
}

// 4. Template renders the computed value:
@for (feeding of feedings(); track feeding.id)
```

## Filtering Types

### Date Range Filtering

- **From Date** (`dateFrom`): Filter items on/after this date
- **To Date** (`dateTo`): Filter items before this date
- Dates are ISO format (YYYY-MM-DD)
- UTC-aware (handles timezone conversions)

### Type Filtering

Different resources have different type fields:

- **Feedings**: `feeding_type` (bottle | breast)
- **Diapers**: `change_type` (wet | dirty | both)
- **Naps**: N/A (no type filtering needed)

## API Integration

The services now support optional query parameters:

### Feedings Service

```typescript
// No filters - get all
this.feedingsService.list(childId).subscribe(...);

// With filters
this.feedingsService.list(childId, {
  dateFrom: '2024-01-01',
  dateTo: '2024-01-31',
  feeding_type: 'bottle'
}).subscribe(...);
```

### Query Parameters Sent to Backend

```bash
GET /api/v1/children/{childId}/feedings/?
  fed_at__gte=2024-01-01&
  fed_at__lt=2024-02-01&
  feeding_type=bottle
```

**Note**: The API supports Django's ORM filters:

- `__gte` = greater than or equal
- `__lt` = less than
- Exact match for type fields

## Implementation for Other Resources

### For Diapers (Similar to Feedings)

1. Update `DiapersService.list()`:

```typescript
list(
  childId: number,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    change_type?: string;
  }
): Observable<DiaperChange[]> {
  let params = new HttpParams();
  if (filters?.dateFrom) params = params.set('changed_at__gte', filters.dateFrom);
  if (filters?.dateTo) params = params.set('changed_at__lt', filters.dateTo);
  if (filters?.change_type) params = params.set('change_type', filters.change_type);

  return this.http.get<PaginatedResponse<DiaperChange>>(
    `${this.baseUrl(childId)}/`,
    { params }
  ).pipe(...);
}
```

1. Update `DiapersList` component:

```typescript
// Add filter options
changeTypeOptions = [
  { value: 'wet', label: 'Wet' },
  { value: 'dirty', label: 'Dirty' },
  { value: 'both', label: 'Both' },
];

// Replace diapers signal with allDiapers + filters + computed feedings
allDiapers = signal<DiaperChange[]>([]);
filters = signal<FilterCriteria>({});

diapers = computed(() => {
  return this.filterService.filter(
    this.allDiapers(),
    this.filters(),
    'changed_at' as keyof DiaperChange,
    'change_type' as keyof DiaperChange
  );
});

// Add filter change handler
onFilterChange(criteria: FilterCriteria): void {
  this.filters.set(criteria);
}
```

1. Update template:

```html
<app-tracking-filter
    [typeOptions]="changeTypeOptions"
    [filterLabel]="'Diaper Type'"
    (filterChange)="onFilterChange($event)"
/>
```

## Performance Considerations

### Client-Side vs Server-Side Filtering

**Current Implementation**: Client-side filtering of all items

**Pros**:

- Instant filter updates (no API call latency)
- No server load for filtering
- Works offline (if data already loaded)
- Great UX for small datasets

**Cons**:

- Loads all items into memory
- Not scalable for 10,000+ items per child

**When to Switch to Server-Side**:

- If single child has 1000+ tracked items
- If performance becomes an issue
- Use API-level filtering then

### Server-Side Filtering (Future)

When needed, replace the computed property:

```typescript
// Instead of computed + client-side filter:
feedings = computed(() => this.allFeedings());

// Use this to fetch filtered data:
onFilterChange(criteria: FilterCriteria): void {
  this.filters.set(criteria);
  this.isLoading.set(true);

  // Call service with filters - API does the filtering
  this.feedingsService.list(this.childId()!, {
    dateFrom: criteria.dateFrom,
    dateTo: criteria.dateTo,
    feeding_type: criteria.type
  }).subscribe({
    next: (feedings) => {
      this.allFeedings.set(feedings);
      this.isLoading.set(false);
    }
  });
}
```

## Testing

### Filter Service Tests

```typescript
describe("FilterService", () => {
    let service: FilterService;

    beforeEach(() => {
        service = TestBed.inject(FilterService);
    });

    it("should filter by date range", () => {
        const items = [
            { id: 1, fed_at: "2024-01-15T10:00:00Z" },
            { id: 2, fed_at: "2024-01-25T10:00:00Z" },
            { id: 3, fed_at: "2024-02-05T10:00:00Z" },
        ];

        const filtered = service.filter(
            items,
            {
                dateFrom: "2024-01-20",
                dateTo: "2024-02-01",
            },
            "fed_at" as keyof (typeof items)[0],
        );

        expect(filtered.length).toBe(1);
        expect(filtered[0].id).toBe(2);
    });

    it("should filter by type", () => {
        const items = [
            { id: 1, feeding_type: "bottle" },
            { id: 2, feeding_type: "breast" },
            { id: 3, feeding_type: "bottle" },
        ];

        const filtered = service.filter(
            items,
            {
                type: "bottle",
            },
            "fed_at" as keyof (typeof items)[0],
            "feeding_type" as keyof (typeof items)[0],
        );

        expect(filtered.length).toBe(2);
    });

    it("should clear filters", () => {
        const items = [
            { id: 1, fed_at: "2024-01-15T10:00:00Z" },
            { id: 2, fed_at: "2024-01-25T10:00:00Z" },
        ];

        const filtered = service.filter(
            items,
            {},
            "fed_at" as keyof (typeof items)[0],
        );

        expect(filtered.length).toBe(2);
    });
});
```

### Component Tests

```typescript
describe('FeedingsList', () => {
  // Test that filters signal updates
  it('should apply filters when onFilterChange is called', () => {
    const component = TestBed.createComponent(FeedingsList);
    component.componentInstance.allFeedings.set([
      { id: 1, feeding_type: 'bottle', fed_at: '2024-01-15T10:00:00Z', ... },
      { id: 2, feeding_type: 'breast', fed_at: '2024-01-25T10:00:00Z', ... },
    ]);

    component.componentInstance.onFilterChange({
      type: 'bottle'
    });

    expect(component.componentInstance.feedings().length).toBe(1);
  });

  // Test filter change event from TrackingFilterComponent
  it('should receive filter changes from child component', () => {
    const component = TestBed.createComponent(FeedingsList);
    const filter = component.debugElement.query(
      By.directive(TrackingFilterComponent)
    ).componentInstance as TrackingFilterComponent;

    spyOn(component.componentInstance, 'onFilterChange');

    filter.filterChange.emit({ type: 'bottle' });

    expect(component.componentInstance.onFilterChange).toHaveBeenCalledWith({
      type: 'bottle'
    });
  });
});
```

## Accessibility

The filter component includes:

- ✅ `<label>` elements with `for` attributes
- ✅ `aria-label` attributes on inputs
- ✅ Semantic HTML (`<select>`, `<input type="date">`)
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ WCAG AA color contrast

## Future Enhancements

1. **Multi-Field Filtering**: Add notes/observations search
2. **Saved Filters**: Remember user's last filter choice
3. **Export Filtered Data**: Export only filtered results
4. **Filter Presets**: "Last Week", "Last Month", "Last 7 Days"
5. **Advanced Queries**: Combine multiple conditions
6. **Server-Side Pagination**: For large datasets

## Summary

- ✅ Generic `FilterService` handles all filtering logic
- ✅ Reusable `TrackingFilterComponent` for UI
- ✅ Signal-based reactive filtering
- ✅ Computed properties for automatic updates
- ✅ Clean integration with existing services
- ✅ Easy to extend to other resource types
- ✅ Accessible and performant
