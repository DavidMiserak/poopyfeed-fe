import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
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
import { ToastService } from '../../../services/toast.service';
import {
  DiaperChange,
  DiaperChangeCreate,
  DIAPER_VALIDATION,
} from '../../../models/diaper.model';
import {
  TrackingFormBase,
} from '../../../utils/form-base';

@Component({
  selector: 'app-diaper-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './diaper-form.html',
  styleUrl: './diaper-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiaperForm
  extends TrackingFormBase<DiaperChange, DiaperChangeCreate, DiapersService>
  implements OnInit
{
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected service = inject(DiapersService);
  protected childrenService = inject(ChildrenService);
  protected datetimeService = inject(DateTimeService);
  protected toast = inject(ToastService);

  // Expose validation constants for template
  VALIDATION = DIAPER_VALIDATION;

  protected form = new FormGroup({
    change_type: new FormControl<'wet' | 'dirty' | 'both'>('wet', [
      Validators.required,
    ]),
    changed_at: new FormControl('', [Validators.required]),
    notes: new FormControl('', [
      Validators.maxLength(DIAPER_VALIDATION.MAX_NOTES_LENGTH),
    ]),
  });

  protected resourceName = 'diaper';
  protected listRoute = 'diapers';
  protected successMessageCreate = 'Diaper change recorded successfully';
  protected successMessageUpdate = 'Diaper change updated successfully';

  // Expose form to template
  get diaperForm() {
    return this.form;
  }

  ngOnInit() {
    this.initializeForm();
  }

  protected setDefaultDateTime() {
    const now = new Date();
    this.form.patchValue({
      changed_at: this.datetimeService.toInputFormat(now),
    });
  }

  protected buildCreateDto(): DiaperChangeCreate {
    const formValue = this.form.value;
    const timestamp = this.convertLocalToUtc(formValue.changed_at!);
    return {
      change_type: formValue.change_type!,
      changed_at: timestamp,
      notes: formValue.notes || undefined,
    };
  }

  protected patchFormWithResource(resource: DiaperChange) {
    const localDate = this.convertUtcToLocal(resource.changed_at);
    this.form.patchValue({
      change_type: resource.change_type,
      changed_at: this.formatForInput(localDate),
      notes: resource.notes || '',
    });
  }
}
