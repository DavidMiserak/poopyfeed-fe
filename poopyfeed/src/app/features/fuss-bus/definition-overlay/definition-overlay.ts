import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

/**
 * Dismissable overlay that shows a term title and explanation body.
 * Used in Fuss Bus for glossary terms (e.g. Colic hold, Swaddling) and song lyrics.
 */
@Component({
  selector: 'app-definition-overlay',
  standalone: true,
  templateUrl: './definition-overlay.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class DefinitionOverlayComponent {
  visible = input<boolean>(false);
  title = input<string>('');
  body = input<string>('');

  dismiss = output<void>();

  onEscape(): void {
    if (this.visible()) this.dismiss.emit();
  }

  onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement)?.getAttribute('data-backdrop') === 'true') {
      this.dismiss.emit();
    }
  }

  onBackdropKeydown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if ((event.target as HTMLElement)?.getAttribute('data-backdrop') === 'true') {
        this.dismiss.emit();
      }
    }
  }
}
