import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Toast } from './toast';
import { ToastService } from '../../services/toast.service';

describe('Toast Component', () => {
  let component: Toast;
  let fixture: ComponentFixture<Toast>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Toast],
      providers: [ToastService],
    }).compileComponents();

    fixture = TestBed.createComponent(Toast);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getToastClasses', () => {
    it('should return success classes', () => {
      const classes = component.getToastClasses('success');
      expect(classes).toBe('bg-emerald-50 border-emerald-400 text-emerald-900 text-opacity-80');
    });

    it('should return error classes', () => {
      const classes = component.getToastClasses('error');
      expect(classes).toBe('bg-red-50 border-red-400 text-red-900 text-opacity-80');
    });

    it('should return warning classes', () => {
      const classes = component.getToastClasses('warning');
      expect(classes).toBe('bg-amber-50 border-amber-400 text-amber-900 text-opacity-80');
    });

    it('should return info classes', () => {
      const classes = component.getToastClasses('info');
      expect(classes).toBe('bg-blue-50 border-blue-400 text-blue-900 text-opacity-80');
    });

    it('should return default (info) classes for unknown type', () => {
      const classes = component.getToastClasses('unknown');
      expect(classes).toBe('bg-blue-50 border-blue-400 text-blue-900 text-opacity-80');
    });
  });

  describe('getIconEmoji', () => {
    it('should return success emoji', () => {
      const emoji = component.getIconEmoji('success');
      expect(emoji).toBe('✓');
    });

    it('should return error emoji', () => {
      const emoji = component.getIconEmoji('error');
      expect(emoji).toBe('⚠');
    });

    it('should return warning emoji', () => {
      const emoji = component.getIconEmoji('warning');
      expect(emoji).toBe('!');
    });

    it('should return info emoji', () => {
      const emoji = component.getIconEmoji('info');
      expect(emoji).toBe('ℹ');
    });

    it('should return default (info) emoji for unknown type', () => {
      const emoji = component.getIconEmoji('unknown');
      expect(emoji).toBe('ℹ');
    });
  });

  describe('getTitle', () => {
    it('should return success title', () => {
      const title = component.getTitle('success');
      expect(title).toBe('Success');
    });

    it('should return error title', () => {
      const title = component.getTitle('error');
      expect(title).toBe('Error');
    });

    it('should return warning title', () => {
      const title = component.getTitle('warning');
      expect(title).toBe('Warning');
    });

    it('should return info title', () => {
      const title = component.getTitle('info');
      expect(title).toBe('Info');
    });

    it('should return default (info) title for unknown type', () => {
      const title = component.getTitle('unknown');
      expect(title).toBe('Info');
    });
  });

  describe('toastService integration', () => {
    it('should have access to toastService', () => {
      expect(component.toastService).toBe(toastService);
    });

    it('should render toast when service emits', () => {
      toastService.success('Test message');
      fixture.detectChanges();

      const toastElement = fixture.nativeElement.querySelector('[role="alert"]');
      expect(toastElement).toBeTruthy();
      expect(toastElement.textContent).toContain('Test message');
    });

    it('should render multiple toasts', () => {
      toastService.success('Message 1');
      toastService.error('Message 2');
      fixture.detectChanges();

      const toasts = fixture.nativeElement.querySelectorAll('[role="alert"]');
      expect(toasts.length).toBe(2);
    });

    it('should remove toast when close button clicked', () => {
      const toastId = toastService.success('Test message');
      fixture.detectChanges();

      const closeButton = fixture.nativeElement.querySelector('button');
      closeButton.click();
      fixture.detectChanges();

      const toasts = fixture.nativeElement.querySelectorAll('[role="alert"]');
      expect(toasts.length).toBe(0);
    });

    it('should display correct emoji in toast', () => {
      toastService.success('Test');
      fixture.detectChanges();

      const emoji = fixture.nativeElement.querySelector('span.text-xl');
      expect(emoji.textContent?.trim()).toBe('✓');
    });

    it('should display correct title in toast', () => {
      toastService.error('Test');
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('p.font-medium');
      expect(title.textContent?.trim()).toBe('Error');
    });
  });

  describe('accessibility', () => {
    it('should have aria-live="polite" on container', () => {
      const container = fixture.nativeElement.querySelector('[aria-live="polite"]');
      expect(container).toBeTruthy();
      expect(container.getAttribute('aria-atomic')).toBe('true');
    });

    it('should have role="alert" on each toast', () => {
      toastService.success('Test');
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
    });

    it('should have aria-label on close button', () => {
      toastService.info('Test');
      fixture.detectChanges();

      const closeButton = fixture.nativeElement.querySelector('button');
      expect(closeButton.getAttribute('aria-label')).toBe('Close notification');
    });
  });
});
