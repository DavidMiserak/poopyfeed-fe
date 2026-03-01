import { describe, it, expect, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let component: ConfirmDialogComponent;

  function setMessage(msg: string): void {
    fixture.componentRef.setInput('message', msg);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('message', 'Msg');
    fixture.detectChanges();
  });

  describe('Inputs', () => {
    it('should have default title empty string', () => {
      expect(component.title()).toBe('');
    });

    it('should use required message input', () => {
      fixture.componentRef.setInput('message', 'Delete this item?');
      fixture.detectChanges();
      expect(component.message()).toBe('Delete this item?');
    });

    it('should have default confirmLabel "Confirm"', () => {
      expect(component.confirmLabel()).toBe('Confirm');
    });

    it('should have default cancelLabel "Cancel"', () => {
      expect(component.cancelLabel()).toBe('Cancel');
    });

    it('should have default variant "primary"', () => {
      expect(component.variant()).toBe('primary');
    });
  });

  describe('Outputs', () => {
    it('should emit confirmed when onConfirm is called', () => {
      const spy = vi.fn();
      component.confirmed.subscribe(spy);

      component.onConfirm();

      expect(spy).toHaveBeenCalled();
    });

    it('should emit cancelled when onCancel is called', () => {
      const spy = vi.fn();
      component.cancelled.subscribe(spy);

      component.onCancel();

      expect(spy).toHaveBeenCalled();
    });

    it('should emit cancelled when onEscape is called', () => {
      const spy = vi.fn();
      component.cancelled.subscribe(spy);

      component.onEscape();

      expect(spy).toHaveBeenCalled();
    });

    it('should emit cancelled when backdrop is clicked', () => {
      const spy = vi.fn();
      component.cancelled.subscribe(spy);

      const backdrop = document.createElement('div');
      backdrop.setAttribute('data-backdrop', 'true');
      component.onBackdropClick({ target: backdrop } as unknown as MouseEvent);

      expect(spy).toHaveBeenCalled();
    });

    it('should not emit when non-backdrop element is clicked', () => {
      const spy = vi.fn();
      component.cancelled.subscribe(spy);

      const other = document.createElement('div');
      other.setAttribute('data-backdrop', 'false');
      component.onBackdropClick({ target: other } as unknown as MouseEvent);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('DOM rendering', () => {
    it('should render message', () => {
      setMessage('Delete this child?');
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Delete this child?');
    });

    it('should render title when provided', () => {
      fixture.componentRef.setInput('message', 'Msg');
      fixture.componentRef.setInput('title', 'Confirm action');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#confirm-dialog-title')?.textContent).toContain('Confirm action');
    });

    it('should not render title element when title is empty', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#confirm-dialog-title')).toBeNull();
    });

    it('should render custom confirm and cancel labels', () => {
      fixture.componentRef.setInput('message', 'Msg');
      fixture.componentRef.setInput('confirmLabel', 'Yes, delete');
      fixture.componentRef.setInput('cancelLabel', 'Keep');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Yes, delete');
      expect(el.textContent).toContain('Keep');
    });

    it('should apply danger variant classes when variant is danger', () => {
      fixture.componentRef.setInput('message', 'Msg');
      fixture.componentRef.setInput('variant', 'danger');
      fixture.detectChanges();
      const panel = fixture.nativeElement.querySelector('.border-red-300');
      expect(panel).toBeTruthy();
    });

    it('should apply primary variant classes when variant is primary', () => {
      fixture.componentRef.setInput('message', 'Msg');
      fixture.componentRef.setInput('variant', 'primary');
      fixture.detectChanges();
      const panel = fixture.nativeElement.querySelector('.border-rose-300');
      expect(panel).toBeTruthy();
    });

    it('should have role="dialog" and aria-modal="true"', () => {
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
      expect(dialog?.getAttribute('aria-modal')).toBe('true');
    });

    it('should set aria-labelledby when title is provided', () => {
      fixture.componentRef.setInput('message', 'Msg');
      fixture.componentRef.setInput('title', 'Confirm action');
      fixture.detectChanges();
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('aria-labelledby')).toBe('confirm-dialog-title');
    });

    it('should not set aria-labelledby when title is empty', () => {
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('aria-labelledby')).toBeNull();
    });
  });
});
