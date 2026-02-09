import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DiapersService } from '../../../services/diapers.service';
import { ChildrenService } from '../../../services/children.service';
import { DateTimeService } from '../../../services/datetime.service';
import {
  DiaperChange,
  DiaperChangeCreate,
  DIAPER_VALIDATION,
} from '../../../models/diaper.model';
import { Child } from '../../../models/child.model';

@Component({
  selector: 'app-diaper-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './diaper-form.html',
  styleUrl: './diaper-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiaperForm implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private diapersService = inject(DiapersService);
  private childrenService = inject(ChildrenService);
  private datetimeService = inject(DateTimeService);

  childId = signal<number | null>(null);
  diaperId = signal<number | null>(null);
  child = signal<Child | null>(null);
  isEdit = computed(() => this.diaperId() !== null);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  // Expose validation constants for template
  VALIDATION = DIAPER_VALIDATION;

  diaperForm = new FormGroup({
    change_type: new FormControl<'wet' | 'dirty' | 'both'>('wet', [
      Validators.required,
    ]),
    changed_at: new FormControl('', [Validators.required]),
    notes: new FormControl('', [
      Validators.maxLength(DIAPER_VALIDATION.MAX_NOTES_LENGTH),
    ]),
  });

  ngOnInit() {
    const childId = this.route.snapshot.paramMap.get('childId');
    const diaperId = this.route.snapshot.paramMap.get('id');

    if (childId) {
      this.childId.set(Number(childId));
      this.loadChild(Number(childId));
    }

    if (diaperId) {
      this.diaperId.set(Number(diaperId));
      if (childId) {
        this.loadDiaper(Number(childId), Number(diaperId));
      }
    } else {
      // Set default changed_at to current time
      const now = new Date();
      this.diaperForm.patchValue({
        changed_at: this.datetimeService.toInputFormat(now),
      });
    }
  }

  loadChild(childId: number) {
    this.childrenService.get(childId).subscribe({
      next: (child) => {
        this.child.set(child);
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  loadDiaper(childId: number, diaperId: number) {
    this.diapersService.get(childId, diaperId).subscribe({
      next: (diaper) => {
        // Convert UTC time to local datetime-local format
        const localDate = this.datetimeService.toLocal(diaper.changed_at);
        this.diaperForm.patchValue({
          change_type: diaper.change_type,
          changed_at: this.datetimeService.toInputFormat(localDate),
          notes: diaper.notes || '',
        });
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  onSubmit() {
    if (this.diaperForm.invalid || !this.childId()) {
      Object.keys(this.diaperForm.controls).forEach((key) => {
        const control = this.diaperForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValue = this.diaperForm.value;
    const childId = this.childId()!;

    // Convert local datetime to UTC
    const localDate = this.datetimeService.fromInputFormat(
      formValue.changed_at!
    );
    const utcDateTime = this.datetimeService.toUTC(localDate);

    const diaperData: DiaperChangeCreate = {
      change_type: formValue.change_type!,
      changed_at: utcDateTime,
      notes: formValue.notes || undefined,
    };

    if (this.isEdit()) {
      this.diapersService
        .update(childId, this.diaperId()!, diaperData)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.router.navigate(['/children', childId, 'diapers']);
          },
          error: (err: Error) => {
            this.isSubmitting.set(false);
            this.error.set(err.message);
          },
        });
    } else {
      this.diapersService.create(childId, diaperData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/children', childId, 'diapers']);
        },
        error: (err: Error) => {
          this.isSubmitting.set(false);
          this.error.set(err.message);
        },
      });
    }
  }

  onCancel() {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'diapers']);
    }
  }
}
