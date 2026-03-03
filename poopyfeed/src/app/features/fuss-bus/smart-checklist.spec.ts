import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SmartChecklistComponent } from './smart-checklist';
import type { ChecklistItem } from './fuss-bus.utils';

function makeItems(): ChecklistItem[] {
  return [
    { id: 'fed', label: 'Fed recently', kind: 'auto', autoStatus: 'ok', detail: 'Fed 30 min ago', interactive: false },
    { id: 'diaper', label: 'Clean diaper', kind: 'auto', autoStatus: 'ok', detail: 'Changed 15 min ago', interactive: false },
    { id: 'nap', label: 'Nap on schedule', kind: 'auto', autoStatus: 'warning', detail: 'Last nap ended 3.5h ago', interactive: false },
    { id: 'comfortable_temperature', label: 'Comfortable temperature', kind: 'manual', interactive: true },
  ];
}

describe('SmartChecklistComponent', () => {
  let component: SmartChecklistComponent;
  let fixture: ComponentFixture<SmartChecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartChecklistComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SmartChecklistComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', makeItems());
    fixture.componentRef.setInput('manualCheckedIds', new Set<string>([]));
    fixture.detectChanges();
  });

  it('shows progress label with auto and manual counts', () => {
    expect(component.progressLabel()).toBe('2 of 4 checked'); // fed + diaper ok; nap warning, manual unchecked
  });

  it('updates progress when manual item is checked', () => {
    fixture.componentRef.setInput('manualCheckedIds', new Set(['comfortable_temperature']));
    fixture.detectChanges();
    expect(component.progressLabel()).toBe('3 of 4 checked');
  });

  it('emits toggle when manual item is toggled', () => {
    let emitted: string | null = null;
    component.manualToggle.subscribe((id: string) => (emitted = id));
    component.onToggle('comfortable_temperature');
    expect(emitted).toBe('comfortable_temperature');
  });

  it('emits logNow when Log now is triggered', () => {
    let emitted: 'feeding' | 'diaper' | 'nap' | null = null;
    component.logNow.subscribe((t) => (emitted = t));
    component.onLogNow('feeding');
    expect(emitted).toBe('feeding');
  });

  it('accepts manualCheckedIds as array', () => {
    fixture.componentRef.setInput('manualCheckedIds', ['comfortable_temperature']);
    fixture.detectChanges();
    expect(component.isManualChecked('comfortable_temperature')).toBe(true);
  });
});
