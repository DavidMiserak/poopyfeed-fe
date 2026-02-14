import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackingFilterComponent } from './tracking-filter';

describe('TrackingFilterComponent', () => {
  let component: TrackingFilterComponent;
  let fixture: ComponentFixture<TrackingFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackingFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackingFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty filters', () => {
    expect(component.filters()).toEqual({});
  });

  it('should not show clear button when no filters active', () => {
    fixture.detectChanges();
    const clearButton = fixture.nativeElement.querySelector(
      'button:has-text("Clear")'
    );

    expect(clearButton).toBeFalsy();
  });

  describe('onDateFromChange()', () => {
    it('should update filters when date from changes', () => {
      let lastCriteria: any;
      component.filterChange.subscribe((criteria) => {
        lastCriteria = criteria;
      });

      const event = new Event('change');
      const input = document.createElement('input');
      input.value = '2024-01-15';
      Object.defineProperty(event, 'target', { value: input, enumerable: true });

      component.onDateFromChange(event);

      expect(lastCriteria.dateFrom).toBe('2024-01-15');
    });

    it('should clear dateFrom when empty', () => {
      component.filters.set({ dateFrom: '2024-01-15' });

      let lastCriteria: any;
      component.filterChange.subscribe((criteria) => {
        lastCriteria = criteria;
      });

      const event = new Event('change');
      const input = document.createElement('input');
      input.value = '';
      Object.defineProperty(event, 'target', { value: input, enumerable: true });

      component.onDateFromChange(event);

      expect(lastCriteria.dateFrom).toBeUndefined();
    });
  });

  describe('onDateToChange()', () => {
    it('should update filters when date to changes', () => {
      let lastCriteria: any;
      component.filterChange.subscribe((criteria) => {
        lastCriteria = criteria;
      });

      const event = new Event('change');
      const input = document.createElement('input');
      input.value = '2024-01-31';
      Object.defineProperty(event, 'target', { value: input, enumerable: true });

      component.onDateToChange(event);

      expect(lastCriteria.dateTo).toBe('2024-01-31');
    });

    it('should clear dateTo when empty', () => {
      component.filters.set({ dateTo: '2024-01-31' });

      let lastCriteria: any;
      component.filterChange.subscribe((criteria) => {
        lastCriteria = criteria;
      });

      const event = new Event('change');
      const input = document.createElement('input');
      input.value = '';
      Object.defineProperty(event, 'target', { value: input, enumerable: true });

      component.onDateToChange(event);

      expect(lastCriteria.dateTo).toBeUndefined();
    });
  });


  describe('clearFilters()', () => {
    it('should clear all filters', () => {
      component.filters.set({
        dateFrom: '2024-01-15',
        dateTo: '2024-01-31',
        type: 'bottle',
      });

      let lastCriteria: any;
      component.filterChange.subscribe((criteria) => {
        lastCriteria = criteria;
      });

      component.clearFilters();

      expect(lastCriteria).toEqual({});
    });

    it('should reset filters signal', () => {
      component.filters.set({ dateFrom: '2024-01-15' });

      component.clearFilters();

      expect(component.filters()).toEqual({});
    });
  });

  describe('hasActiveFilters()', () => {
    it('should return false when no filters', () => {
      component.filters.set({});

      expect(component.hasActiveFilters()).toBeFalsy();
    });

    it('should return true when dateFrom is set', () => {
      component.filters.set({ dateFrom: '2024-01-15' });

      expect(component.hasActiveFilters()).toBeTruthy();
    });

    it('should return true when dateTo is set', () => {
      component.filters.set({ dateTo: '2024-01-31' });

      expect(component.hasActiveFilters()).toBeTruthy();
    });

    it('should return true when type is set', () => {
      component.filters.set({ type: 'bottle' });

      expect(component.hasActiveFilters()).toBeTruthy();
    });

    it('should return true when multiple filters are set', () => {
      component.filters.set({
        dateFrom: '2024-01-15',
        dateTo: '2024-01-31',
        type: 'bottle',
      });

      expect(component.hasActiveFilters()).toBeTruthy();
    });
  });

  describe('formatDateForDisplay()', () => {
    it('should format ISO date string', () => {
      const formatted = component.formatDateForDisplay('2024-01-15');
      const regex = /^[A-Z][a-z]{2},\s[A-Z][a-z]{2}\s\d{1,2}$/;

      expect(formatted).toMatch(regex);
    });
  });

  describe('getTypeLabel()', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('typeOptions', [
        { value: 'bottle', label: 'Bottle' },
        { value: 'breast', label: 'Breast' },
      ]);
      fixture.detectChanges();
    });

    it('should return label for valid type value', () => {
      const label = component.getTypeLabel('bottle');

      expect(label).toBe('Bottle');
    });

    it('should return value when label not found', () => {
      const label = component.getTypeLabel('unknown');

      expect(label).toBe('unknown');
    });
  });

  describe('combined filter updates', () => {
    it('should emit correct criteria after multiple changes', () => {
      const emittedValues: any[] = [];

      component.filterChange.subscribe((criteria) => {
        emittedValues.push(criteria);
      });

      // First change
      const dateFromEvent = new Event('change');
      const dateFromInput = document.createElement('input');
      dateFromInput.value = '2024-01-15';
      Object.defineProperty(dateFromEvent, 'target', {
        value: dateFromInput,
        enumerable: true,
      });
      component.onDateFromChange(dateFromEvent);

      // Second change
      const dateToEvent = new Event('change');
      const dateToInput = document.createElement('input');
      dateToInput.value = '2024-01-31';
      Object.defineProperty(dateToEvent, 'target', {
        value: dateToInput,
        enumerable: true,
      });
      component.onDateToChange(dateToEvent);

      expect(emittedValues[1]).toEqual({
        dateFrom: '2024-01-15',
        dateTo: '2024-01-31',
      });
    });
  });

  describe('type options input', () => {
    it('should not display type select when no options provided', () => {
      fixture.componentRef.setInput('typeOptions', []);
      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector('select');

      expect(select).toBeFalsy();
    });

    it('should display type select when options provided', () => {
      fixture.componentRef.setInput('typeOptions', [
        { value: 'bottle', label: 'Bottle' },
        { value: 'breast', label: 'Breast' },
      ]);
      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector('select');

      expect(select).toBeTruthy();
    });
  });

  describe('filter label input', () => {
    it('should default to "Type" label', () => {
      expect(component.filterLabel()).toBe('Type');
    });
  });
});
