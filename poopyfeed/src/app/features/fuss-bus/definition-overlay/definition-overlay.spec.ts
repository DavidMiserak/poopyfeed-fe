import { describe, it, expect, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefinitionOverlayComponent } from './definition-overlay';

describe('DefinitionOverlayComponent', () => {
  let fixture: ComponentFixture<DefinitionOverlayComponent>;
  let component: DefinitionOverlayComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefinitionOverlayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DefinitionOverlayComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
  });

  it('does not render overlay when visible is false', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  describe('when visible is true', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('visible', true);
      fixture.componentRef.setInput('title', 'Colic hold');
      fixture.componentRef.setInput('body', 'Hold your baby tummy-down along your forearm.');
      fixture.detectChanges();
    });

    it('renders dialog with title and body', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#definition-overlay-title')?.textContent?.trim()).toBe('Colic hold');
      expect(el.querySelector('#definition-overlay-body')?.textContent?.trim()).toContain('Hold your baby tummy-down');
    });

    it('has role="dialog" and aria-modal="true"', () => {
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
      expect(dialog?.getAttribute('aria-modal')).toBe('true');
    });

    it('sets aria-labelledby and aria-describedby', () => {
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('aria-labelledby')).toBe('definition-overlay-title');
      expect(dialog?.getAttribute('aria-describedby')).toBe('definition-overlay-body');
    });

    it('emits dismiss when Close button is clicked', () => {
      const spy = vi.fn();
      component.dismiss.subscribe(spy);

      const el = fixture.nativeElement as HTMLElement;
      const closeBtn = el.querySelector('button');
      expect(closeBtn?.textContent?.trim()).toBe('Close');
      closeBtn?.click();

      expect(spy).toHaveBeenCalled();
    });

    it('emits dismiss when backdrop is clicked', () => {
      const spy = vi.fn();
      component.dismiss.subscribe(spy);

      const backdrop = document.createElement('div');
      backdrop.setAttribute('data-backdrop', 'true');
      component.onBackdropClick({ target: backdrop } as unknown as MouseEvent);

      expect(spy).toHaveBeenCalled();
    });

    it('emits dismiss when onEscape is called', () => {
      const spy = vi.fn();
      component.dismiss.subscribe(spy);

      component.onEscape();

      expect(spy).toHaveBeenCalled();
    });

    it('does not emit when non-backdrop element is clicked', () => {
      const spy = vi.fn();
      component.dismiss.subscribe(spy);

      const other = document.createElement('div');
      other.setAttribute('data-backdrop', 'false');
      component.onBackdropClick({ target: other } as unknown as MouseEvent);

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
