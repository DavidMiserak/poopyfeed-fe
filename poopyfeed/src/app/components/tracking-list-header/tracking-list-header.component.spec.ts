import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackingListHeaderComponent } from './tracking-list-header.component';

describe('TrackingListHeaderComponent', () => {
  let component: TrackingListHeaderComponent;
  let fixture: ComponentFixture<TrackingListHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackingListHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackingListHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Feedings');
    fixture.componentRef.setInput('addButtonLabel', 'Add Feeding');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Feedings');
  });

  it('should render add button label', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Add Feeding');
  });

  describe('onBackClick', () => {
    it('should emit back event', () => {
      const spy = vi.fn();
      component.back.subscribe(spy);

      component.onBackClick();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onAddClick', () => {
    it('should emit add event', () => {
      const spy = vi.fn();
      component.add.subscribe(spy);

      component.onAddClick();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('buildBackButtonClass', () => {
    it('should use rose hover color by default', () => {
      expect(component.buildBackButtonClass()).toContain('hover:text-rose-400');
    });

    it('should use orange hover color when accentColor is orange', () => {
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.detectChanges();
      expect(component.buildBackButtonClass()).toContain('hover:text-orange-400');
    });

    it('should use amber hover color when accentColor is amber', () => {
      fixture.componentRef.setInput('accentColor', 'amber');
      fixture.detectChanges();
      expect(component.buildBackButtonClass()).toContain('hover:text-amber-400');
    });
  });

  describe('buildAddButtonClass', () => {
    it('should use rose border by default', () => {
      expect(component.buildAddButtonClass()).toContain('border-rose-400');
    });

    it('should use orange border when accentColor is orange', () => {
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.detectChanges();
      expect(component.buildAddButtonClass()).toContain('border-orange-400');
    });

    it('should use amber border when accentColor is amber', () => {
      fixture.componentRef.setInput('accentColor', 'amber');
      fixture.detectChanges();
      expect(component.buildAddButtonClass()).toContain('border-amber-400');
    });
  });

  describe('buildAddButtonMobileClass', () => {
    it('should use rose border by default', () => {
      expect(component.buildAddButtonMobileClass()).toContain('border-rose-400');
    });

    it('should use orange border when accentColor is orange', () => {
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.detectChanges();
      expect(component.buildAddButtonMobileClass()).toContain('border-orange-400');
    });

    it('should use amber border when accentColor is amber', () => {
      fixture.componentRef.setInput('accentColor', 'amber');
      fixture.detectChanges();
      expect(component.buildAddButtonMobileClass()).toContain('border-amber-400');
    });
  });

  describe('buildGradientClass', () => {
    it('should use rose gradient by default', () => {
      expect(component.buildGradientClass()).toContain('from-rose-400');
    });

    it('should use orange gradient when accentColor is orange', () => {
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.detectChanges();
      expect(component.buildGradientClass()).toContain('from-orange-400');
    });

    it('should use amber gradient when accentColor is amber', () => {
      fixture.componentRef.setInput('accentColor', 'amber');
      fixture.detectChanges();
      expect(component.buildGradientClass()).toContain('from-amber-400');
    });

    it('should include transition class', () => {
      expect(component.buildGradientClass()).toContain('transition-transform');
    });
  });

  describe('Template interaction', () => {
    it('should trigger back event on back button click', () => {
      const spy = vi.fn();
      component.back.subscribe(spy);

      const backButton = fixture.nativeElement.querySelector('button');
      backButton?.click();

      expect(spy).toHaveBeenCalled();
    });

    it('should render Back to advanced tools text', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Back to advanced tools');
    });
  });
});
