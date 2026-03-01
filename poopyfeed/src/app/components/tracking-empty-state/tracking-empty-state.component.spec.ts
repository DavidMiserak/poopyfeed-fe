import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackingEmptyStateComponent } from './tracking-empty-state.component';

describe('TrackingEmptyStateComponent', () => {
  let component: TrackingEmptyStateComponent;
  let fixture: ComponentFixture<TrackingEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackingEmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackingEmptyStateComponent);
    component = fixture.componentInstance;
  });

  describe('rendering', () => {
    it('should display emoji', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');
      fixture.detectChanges();

      const emoji = fixture.nativeElement.querySelector('div.text-6xl');
      expect(emoji.textContent).toBe('🧷');
    });

    it('should display title', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No diaper changes recorded');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('h2');
      expect(title.textContent).toContain('No diaper changes recorded');
    });

    it('should display subtitle', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Start tracking your baby');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Start tracking your baby');
    });

    it('should display button with correct label', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add First Diaper Change');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.textContent).toContain('Add First Diaper Change');
    });
  });

  describe('gradient classes', () => {
    it('should return rose gradient for rose accent', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');

      expect(component.gradientClass()).toBe('from-rose-400 to-rose-500');
    });

    it('should return orange gradient for orange accent', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');

      expect(component.gradientClass()).toBe('from-orange-400 to-orange-500');
    });

    it('should return amber gradient for amber accent', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'amber');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');

      expect(component.gradientClass()).toBe('from-amber-400 to-amber-500');
    });
  });

  describe('border classes', () => {
    it('should return rose border for rose accent', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');

      expect(component.borderClass()).toBe('border-rose-400');
    });

    it('should return orange border for orange accent', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');

      expect(component.borderClass()).toBe('border-orange-400');
    });

    it('should return amber border for amber accent', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'amber');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');

      expect(component.borderClass()).toBe('border-amber-400');
    });
  });

  describe('background classes', () => {
    it('should return rose background for rose accent', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');

      expect(component.bgClass()).toBe('border-rose-400/20');
    });

    it('should return orange background for orange accent', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');

      expect(component.bgClass()).toBe('border-orange-400/20');
    });

    it('should return amber background for amber accent', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'amber');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');

      expect(component.bgClass()).toBe('border-amber-400/20');
    });
  });

  describe('events', () => {
    it('should emit add event when button clicked', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');
      fixture.detectChanges();

      let addEmitted = false;
      component.add.subscribe(() => {
        addEmitted = true;
      });

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(addEmitted).toBe(true);
    });

    it('should emit add event only once per click', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');
      fixture.detectChanges();

      let emitCount = 0;
      component.add.subscribe(() => {
        emitCount++;
      });

      const button = fixture.nativeElement.querySelector('button');
      button.click();
      button.click();

      expect(emitCount).toBe(2);
    });
  });

  describe('styling', () => {
    it('should have proper card styling classes', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('div.bg-white\\/80');
      expect(card.className).toContain('backdrop-blur-lg');
      expect(card.className).toContain('rounded-3xl');
      expect(card.className).toContain('shadow-2xl');
      expect(card.className).toContain('p-12');
      expect(card.className).toContain('border-2');
    });

    it('should have gradient button with proper styling', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.className).toContain('group');
      expect(button.className).toContain('relative');
      expect(button.className).toContain('rounded-xl');
      expect(button.className).toContain('shadow-xl');
    });

    it('should have gradient span inside button', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('button span.absolute');
      expect(span).toBeTruthy();
      expect(span.className).toContain('inset-0');
      expect(span.className).toContain('bg-gradient-to-br');
    });
  });

  describe('button hover behavior', () => {
    it('should have hover and active states on button', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.className).toContain('hover:shadow-2xl');
      expect(button.className).toContain('hover:-translate-y-1');
      expect(button.className).toContain('active:translate-y-0');
    });
  });

  describe('text content', () => {
    it('should display emoji correctly', () => {
      fixture.componentRef.setInput('emoji', '🍼');
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('subtitle', 'Test');
      fixture.componentRef.setInput('accentColor', 'rose');
      fixture.componentRef.setInput('buttonLabel', 'Add');
      fixture.detectChanges();

      const emoji = fixture.nativeElement.querySelector('div.text-6xl');
      expect(emoji.textContent).toBe('🍼');
    });

    it('should support different emojis', () => {
      const emojis = ['😴', '🧷', '🍼'];

      emojis.forEach(emoji => {
        fixture.componentRef.setInput('emoji', emoji);
        fixture.componentRef.setInput('title', 'Test');
        fixture.componentRef.setInput('subtitle', 'Test');
        fixture.componentRef.setInput('accentColor', 'rose');
        fixture.componentRef.setInput('buttonLabel', 'Add');
        fixture.detectChanges();

        const emojiElement = fixture.nativeElement.querySelector('div.text-6xl');
        expect(emojiElement.textContent).toBe(emoji);
      });
    });
  });

  describe('accessibility', () => {
    it('should have button with type "button"', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.type).toBe('button');
    });

    it('should have heading semantic element for title', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');
      fixture.detectChanges();

      const heading = fixture.nativeElement.querySelector('h2');
      expect(heading).toBeTruthy();
    });

    it('should have proper text hierarchy', () => {
      fixture.componentRef.setInput('emoji', '🧷');
      fixture.componentRef.setInput('title', 'No items');
      fixture.componentRef.setInput('subtitle', 'Add your first item');
      fixture.componentRef.setInput('accentColor', 'orange');
      fixture.componentRef.setInput('buttonLabel', 'Add Item');
      fixture.detectChanges();

      const h2 = fixture.nativeElement.querySelector('h2');
      const p = fixture.nativeElement.querySelector('p');

      expect(h2).toBeTruthy();
      expect(p).toBeTruthy();
    });
  });
});
