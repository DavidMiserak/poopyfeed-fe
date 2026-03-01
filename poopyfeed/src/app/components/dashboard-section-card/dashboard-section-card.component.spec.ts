import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardSectionCardComponent } from './dashboard-section-card.component';

describe('DashboardSectionCardComponent', () => {
  let fixture: ComponentFixture<DashboardSectionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSectionCardComponent],
    }).compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(DashboardSectionCardComponent);
    fixture.componentRef.setInput('title', "Today's Summary");
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render title input', () => {
    fixture = TestBed.createComponent(DashboardSectionCardComponent);
    fixture.componentRef.setInput('title', 'Quick Log');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Quick Log');
  });

  it('should apply default rose border class', () => {
    fixture = TestBed.createComponent(DashboardSectionCardComponent);
    fixture.componentRef.setInput('title', 'Section');
    fixture.detectChanges();
    expect(fixture.componentInstance.borderClass()).toBe('border-rose-400/20');
  });

  it('should apply amber border class when borderColor is amber', () => {
    fixture = TestBed.createComponent(DashboardSectionCardComponent);
    fixture.componentRef.setInput('title', 'Section');
    fixture.componentRef.setInput('borderColor', 'amber');
    fixture.detectChanges();
    expect(fixture.componentInstance.borderClass()).toBe('border-amber-400/20');
  });

  it('should apply orange border class when borderColor is orange', () => {
    fixture = TestBed.createComponent(DashboardSectionCardComponent);
    fixture.componentRef.setInput('title', 'Section');
    fixture.componentRef.setInput('borderColor', 'orange');
    fixture.detectChanges();
    expect(fixture.componentInstance.borderClass()).toBe('border-orange-400/20');
  });

  it('should apply purple border class when borderColor is purple', () => {
    fixture = TestBed.createComponent(DashboardSectionCardComponent);
    fixture.componentRef.setInput('title', 'Section');
    fixture.componentRef.setInput('borderColor', 'purple');
    fixture.detectChanges();
    expect(fixture.componentInstance.borderClass()).toBe('border-purple-400/20');
  });

  it('should project content into ng-content', () => {
    fixture = TestBed.createComponent(DashboardSectionCardComponent);
    fixture.componentRef.setInput('title', 'Section');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const h2 = el.querySelector('h2');
    expect(h2?.textContent?.trim()).toBe('Section');
  });
});
