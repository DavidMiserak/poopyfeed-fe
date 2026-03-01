import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackingItemContainerComponent } from './tracking-item-container.component';

describe('TrackingItemContainerComponent', () => {
  let component: TrackingItemContainerComponent;
  let fixture: ComponentFixture<TrackingItemContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackingItemContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackingItemContainerComponent);
    component = fixture.componentInstance;
  });

  describe('rendering', () => {
    it('should render container div', () => {
      fixture.componentRef.setInput('isSelected', false);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('div');
      expect(container).toBeTruthy();
    });

    it('should have rounded-xl class', () => {
      fixture.componentRef.setInput('isSelected', false);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('div');
      expect(container.className).toContain('rounded-xl');
    });

    it('should render a single container', () => {
      fixture.componentRef.setInput('isSelected', false);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const containers = fixture.nativeElement.querySelectorAll('div');
      expect(containers.length).toBe(1);
    });

    it('should have hover and transition classes', () => {
      fixture.componentRef.setInput('isSelected', false);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('div');
      expect(container.className).toContain('hover:shadow-md');
      expect(container.className).toContain('transition-all');
    });
  });

  describe('background gradient classes computed', () => {
    it('should compute rose gradient for rose accent', () => {
      fixture.componentRef.setInput('isSelected', false);
      fixture.componentRef.setInput('accentColor', 'rose');

      expect(component.bgClass()).toBe('from-rose-50 to-pink-50');
    });

    it('should compute orange gradient for orange accent', () => {
      fixture.componentRef.setInput('isSelected', false);
      fixture.componentRef.setInput('accentColor', 'orange');

      expect(component.bgClass()).toBe('from-orange-50 to-amber-50');
    });

    it('should compute amber gradient for amber accent', () => {
      fixture.componentRef.setInput('isSelected', false);
      fixture.componentRef.setInput('accentColor', 'amber');

      expect(component.bgClass()).toBe('from-amber-50 to-yellow-50');
    });
  });

  describe('ring classes computed for selection', () => {
    it('should compute rose ring for rose accent', () => {
      fixture.componentRef.setInput('isSelected', true);
      fixture.componentRef.setInput('accentColor', 'rose');

      expect(component.ringClass()).toBe('ring-rose-400');
    });

    it('should compute orange ring for orange accent', () => {
      fixture.componentRef.setInput('isSelected', true);
      fixture.componentRef.setInput('accentColor', 'orange');

      expect(component.ringClass()).toBe('ring-orange-400');
    });

    it('should compute amber ring for amber accent', () => {
      fixture.componentRef.setInput('isSelected', true);
      fixture.componentRef.setInput('accentColor', 'amber');

      expect(component.ringClass()).toBe('ring-amber-400');
    });
  });

  describe('selection state', () => {
    it('should not have ring-2 class when not selected', () => {
      fixture.componentRef.setInput('isSelected', false);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('div');
      expect(container.className).not.toContain('ring-2');
    });

    it('should have ring-2 class when selected', () => {
      fixture.componentRef.setInput('isSelected', true);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('div');
      expect(container.className).toContain('ring-2');
    });

    it('should have ring color binding when selected with orange', () => {
      fixture.componentRef.setInput('isSelected', true);
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('div');
      expect(container.className).toContain('ring-2');
      expect(container.className).toContain('ring-orange-400');
    });

    it('should have ring color binding when selected with amber', () => {
      fixture.componentRef.setInput('isSelected', true);
      fixture.componentRef.setInput('accentColor', 'amber');
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('div');
      expect(container.className).toContain('ring-2');
      expect(container.className).toContain('ring-amber-400');
    });

    it('should toggle selection state when input changes', () => {
      fixture.componentRef.setInput('isSelected', false);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      let container = fixture.nativeElement.querySelector('div');
      expect(container.className).not.toContain('ring-2');

      fixture.componentRef.setInput('isSelected', true);
      fixture.detectChanges();

      container = fixture.nativeElement.querySelector('div');
      expect(container.className).toContain('ring-2');
    });
  });

  describe('background gradient binding', () => {
    it('should have bg-gradient-to-r class', () => {
      fixture.componentRef.setInput('isSelected', false);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('div');
      expect(container.className).toContain('bg-gradient-to-r');
    });

    it('should update when accent color changes', () => {
      fixture.componentRef.setInput('isSelected', false);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      // Verify computed property returns correct gradient
      expect(component.bgClass()).toBe('from-rose-50 to-pink-50');

      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.detectChanges();

      // Verify computed property updated
      expect(component.bgClass()).toBe('from-orange-50 to-amber-50');
    });
  });

  describe('core functionality', () => {
    it('should have base styling classes on the container', () => {
      fixture.componentRef.setInput('isSelected', false);
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('div');
      expect(container.className).toContain('rounded-xl');
      expect(container.className).toContain('hover:shadow-md');
      expect(container.className).toContain('transition-all');
      expect(container.className).toContain('bg-gradient-to-r');
    });

    it('should support all three accent colors', () => {
      const colors: ('rose' | 'orange' | 'amber')[] = ['rose', 'orange', 'amber'];
      const expectedGradients = {
        rose: 'from-rose-50 to-pink-50',
        orange: 'from-orange-50 to-amber-50',
        amber: 'from-amber-50 to-yellow-50',
      };

      colors.forEach(color => {
        fixture.componentRef.setInput('isSelected', false);
        fixture.componentRef.setInput('accentColor', color);

        expect(component.bgClass()).toBe(expectedGradients[color]);
      });
    });

    it('should support selected and unselected states for all colors', () => {
      const colors: ('rose' | 'orange' | 'amber')[] = ['rose', 'orange', 'amber'];

      colors.forEach(color => {
        fixture.componentRef.setInput('accentColor', color);

        // Test unselected
        fixture.componentRef.setInput('isSelected', false);
        fixture.detectChanges();
        let container = fixture.nativeElement.querySelector('div');
        expect(container.className).not.toContain('ring-2');

        // Test selected
        fixture.componentRef.setInput('isSelected', true);
        fixture.detectChanges();
        container = fixture.nativeElement.querySelector('div');
        expect(container.className).toContain('ring-2');
      });
    });

    it('should apply correct ring color for all accent colors when selected', () => {
      const colors: ('rose' | 'orange' | 'amber')[] = ['rose', 'orange', 'amber'];
      const expectedRings = {
        rose: 'ring-rose-400',
        orange: 'ring-orange-400',
        amber: 'ring-amber-400',
      };

      colors.forEach(color => {
        fixture.componentRef.setInput('isSelected', true);
        fixture.componentRef.setInput('accentColor', color);
        fixture.detectChanges();

        const container = fixture.nativeElement.querySelector('div');
        expect(container.className).toContain(expectedRings[color]);
      });
    });
  });
});
