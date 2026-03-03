/**
 * Fuss Bus shell: 3-step wizard (symptom selection, smart checklist, suggestions).
 * Uses existing APIs: child, dashboard-summary, pattern-alerts, timeline.
 */

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  afterNextRender,
  Injector,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';
import { ChildrenService } from '../../services/children.service';
import { AnalyticsService } from '../../services/analytics.service';
import { NapsService } from '../../services/naps.service';
import { DiapersService } from '../../services/diapers.service';
import { FeedingsService } from '../../services/feedings.service';
import { DateTimeService } from '../../services/datetime.service';
import { ToastService } from '../../services/toast.service';
import { Child } from '../../models/child.model';
import type { NapCreate } from '../../models/nap.model';
import type { DiaperChangeCreate } from '../../models/diaper.model';
import type { FeedingCreate } from '../../models/feeding.model';
import type { DashboardSummaryResponse, PatternAlertsResponse } from '../../models/analytics.model';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { getGenderIconDetailed, getAgeInWeeks } from '../../utils/date.utils';
import { getRecommendedBottleAmount } from '../../utils/bottle-feeding.utils';
import type { FussBusSymptomId } from './fuss-bus.data';
import {
  getChildAgeInMonths,
  getAutoCheckState,
  buildChecklistItems,
  prioritizeSuggestions,
  getDevelopmentalContexts,
  type AutoCheckState as AutoCheckStateType,
} from './fuss-bus.utils';
import { StepIndicatorComponent } from './step-indicator';
import { SymptomSelectionComponent } from './symptom-selection';
import { SmartChecklistComponent } from './smart-checklist';
import { SuggestionsComponent } from './suggestions';

const SELF_CARE_ELEVATE_MS = 5 * 60 * 1000;

@Component({
  selector: 'app-fuss-bus',
  standalone: true,
  imports: [
    RouterLink,
    ErrorCardComponent,
    StepIndicatorComponent,
    SymptomSelectionComponent,
    SmartChecklistComponent,
    SuggestionsComponent,
  ],
  templateUrl: './fuss-bus.html',
  styleUrl: './fuss-bus.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FussBusComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private childrenService = inject(ChildrenService);
  private analyticsService = inject(AnalyticsService);

  childId = signal<number | null>(null);
  child = signal<Child | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  /** Non-blocking: show message but continue with all items as manual. */
  trackingDataError = signal<string | null>(null);

  currentStep = signal<1 | 2 | 3>(1);
  selectedSymptom = signal<FussBusSymptomId | null>(null);
  manualCheckedIds = signal<Set<string>>(new Set());
  /** Cached API data for checklist/suggestions. */
  dashboardSummary = signal<DashboardSummaryResponse | null>(null);
  patternAlerts = signal<PatternAlertsResponse | null>(null);
  timelineResults = signal<import('../../models/analytics.model').TimelineEvent[]>([]);
  /** Derived when we have child DOB; used for checklist and suggestions. */
  autoCheckState = signal<AutoCheckStateType | null>(null);

  selfCareElevated = signal(false);
  private selfCareTimerId: number | null = null;

  /** Child age in months from date_of_birth. */
  childAgeMonths = computed(() => {
    const c = this.child();
    if (!c?.date_of_birth) return 0;
    return getChildAgeInMonths(c.date_of_birth);
  });

  /** Checklist items for Step 2 (symptom + age + auto state). */
  checklistItems = computed(() => {
    const symptom = this.selectedSymptom();
    const state = this.autoCheckState();
    if (!symptom || !state) return [];
    return buildChecklistItems(symptom, this.childAgeMonths(), state);
  });

  /** Suggestions for Step 3. */
  suggestions = computed(() => {
    const symptom = this.selectedSymptom();
    const state = this.autoCheckState();
    const manualIds = this.manualCheckedIds();
    const items = this.checklistItems();
    if (!symptom || !state) return [];
    const uncheckedAuto: ('fed' | 'diaper' | 'nap')[] = [];
    if (state.fed !== 'ok') uncheckedAuto.push('fed');
    if (state.diaper !== 'ok') uncheckedAuto.push('diaper');
    if (state.nap !== 'ok') uncheckedAuto.push('nap');
    const uncheckedManual = items.filter((i) => i.kind === 'manual' && !manualIds.has(i.id)).map((i) => i.id);
    return prioritizeSuggestions(uncheckedAuto, uncheckedManual, symptom, this.childAgeMonths(), state);
  });

  developmentalContexts = computed(() => getDevelopmentalContexts(this.childAgeMonths()));

  /** Show colic section when 0–4 months and symptom is Crying. */
  showColicSection = computed(() => {
    const age = this.childAgeMonths();
    return age <= 4 && this.selectedSymptom() === 'crying';
  });

  getGenderIcon = getGenderIconDetailed;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('childId');
    if (!idParam) {
      this.error.set('Child not found.');
      this.isLoading.set(false);
      return;
    }
    const numericId = Number(idParam);
    if (Number.isNaN(numericId)) {
      this.error.set('Invalid child.');
      this.isLoading.set(false);
      return;
    }
    this.childId.set(numericId);
    this.loadData();
  }

  private loadData(): void {
    const id = this.childId();
    if (!id) return;

    this.error.set(null);
    this.trackingDataError.set(null);
    this.isLoading.set(true);

    const child$ = this.childrenService.get(id).pipe(
      catchError((err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
        return of(null);
      })
    );
    const dashboard$ = this.analyticsService.getDashboardSummary(id).pipe(
      catchError(() => of(null))
    );
    const patternAlerts$ = this.analyticsService.getPatternAlerts(id).pipe(
      catchError(() => of(null))
    );
    const timeline$ = this.analyticsService.getTimeline(id, 1, 50).pipe(
      catchError(() => of({ count: 0, next: null, previous: null, results: [] }))
    );

    child$.subscribe((child) => {
      if (!child) return;
      this.child.set(child);
      this.titleService.setTitle(`The Fuss Bus – ${child.name} – PoopyFeed`);

      forkJoin({
        dashboard: dashboard$,
        patternAlerts: patternAlerts$,
        timeline: timeline$,
      }).subscribe({
        next: ({ dashboard, patternAlerts, timeline }) => {
          if (!dashboard || !patternAlerts) {
            this.trackingDataError.set('Couldn\'t load tracking data — check items manually.');
          }
          this.dashboardSummary.set(dashboard ?? null);
          this.patternAlerts.set(patternAlerts ?? null);
          this.timelineResults.set(timeline?.results ?? []);
          const c = this.child();
          const ageMonths = c ? getChildAgeInMonths(c.date_of_birth) : 6;
          this.autoCheckState.set(
            getAutoCheckState(dashboard ?? null, patternAlerts ?? null, timeline?.results ?? null, new Date(), ageMonths)
          );
          this.isLoading.set(false);
        },
        error: () => {
          this.trackingDataError.set('Couldn\'t load tracking data — check items manually.');
          this.dashboardSummary.set(null);
          this.patternAlerts.set(null);
          this.timelineResults.set([]);
          this.autoCheckState.set(
            getAutoCheckState(null, null, null, new Date(), this.childAgeMonths())
          );
          this.isLoading.set(false);
        },
      });
    });
  }

  /** Start 5-minute timer for self-care emphasis (client-only, SSR-safe). */
  private startSelfCareTimer(): void {
    if (typeof window === 'undefined') return;
    this.selfCareTimerId = window.setTimeout(() => {
      this.selfCareElevated.set(true);
      this.selfCareTimerId = null;
    }, SELF_CARE_ELEVATE_MS);
  }

  constructor() {
    afterNextRender(() => this.startSelfCareTimer(), { injector: inject(Injector) });
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined' && this.selfCareTimerId != null) {
      window.clearTimeout(this.selfCareTimerId);
      this.selfCareTimerId = null;
    }
  }

  onSymptomSelected(id: FussBusSymptomId): void {
    this.selectedSymptom.set(id);
  }

  onNext(): void {
    const step = this.currentStep();
    if (step === 1) this.currentStep.set(2);
    else if (step === 2) this.currentStep.set(3);
  }

  onBack(): void {
    const step = this.currentStep();
    if (step === 2) this.currentStep.set(1);
    else if (step === 3) this.currentStep.set(2);
  }

  onStartOver(): void {
    this.selectedSymptom.set(null);
    this.manualCheckedIds.set(new Set());
    this.currentStep.set(1);
  }

  onToggleManual(id: string): void {
    const set = new Set(this.manualCheckedIds());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.manualCheckedIds.set(set);
  }

  onLogNow(type: 'feeding' | 'diaper' | 'nap'): void {
    const id = this.childId();
    if (!id) return;
    if (type === 'feeding') this.router.navigate(['/children', id, 'feedings', 'create']);
    else if (type === 'diaper') this.router.navigate(['/children', id, 'diapers', 'create']);
    else this.router.navigate(['/children', id, 'naps', 'create']);
  }

  canProceedFromStep1 = computed(() => this.selectedSymptom() != null);
  canProceedFromStep2 = computed(() => true);
}
