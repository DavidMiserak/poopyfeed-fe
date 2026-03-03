import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import type { PrioritizedSuggestion } from './fuss-bus.utils';
import {
  SOOTHING_TOOLKIT,
  WHEN_TO_CALL_DOCTOR_BULLETS,
  SELF_CARE_ITEMS,
  COLIC_SECTION,
  FUSS_BUS_GLOSSARY,
  type GlossaryEntry,
  type GlossarySong,
} from './fuss-bus.data';
import { DefinitionOverlayComponent } from './definition-overlay/definition-overlay';

@Component({
  selector: 'app-fuss-bus-suggestions',
  standalone: true,
  imports: [DefinitionOverlayComponent],
  templateUrl: './suggestions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestionsComponent {
  suggestions = input.required<PrioritizedSuggestion[]>();
  developmentalContexts = input<string[]>([]);
  showColicSection = input<boolean>(false);
  selfCareElevated = input<boolean>(false);

  readonly soothingToolkit = SOOTHING_TOOLKIT;
  readonly doctorBullets = WHEN_TO_CALL_DOCTOR_BULLETS;
  readonly selfCareItems = SELF_CARE_ITEMS;
  readonly colicSection = COLIC_SECTION;
  readonly glossary = FUSS_BUS_GLOSSARY;
  readonly singingSongs: GlossarySong[] = FUSS_BUS_GLOSSARY['Singing']?.songs ?? [];

  glossaryEntry = signal<GlossaryEntry | null>(null);

  openDefinition(term: string): void {
    const entry = FUSS_BUS_GLOSSARY[term];
    if (entry) this.glossaryEntry.set(entry);
  }

  openSongLyrics(song: GlossarySong): void {
    this.glossaryEntry.set({ title: song.title, body: song.lyrics });
  }

  onDismiss(): void {
    this.glossaryEntry.set(null);
  }

  hasDefinition(term: string): boolean {
    return term in FUSS_BUS_GLOSSARY;
  }
}
