import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { NapsService } from '../../../services/naps.service';
import { ChildrenService } from '../../../services/children.service';
import { DateTimeService } from '../../../services/datetime.service';
import { ToastService } from '../../../services/toast.service';
import { Nap, NapCreate, NAP_VALIDATION } from '../../../models/nap.model';
import { TrackingFormBase } from '../../../utils/form-base';

@Component({
  selector: 'app-nap-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './nap-form.html',
  styleUrl: './nap-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NapForm
  extends TrackingFormBase<Nap, NapCreate, NapsService>
  implements OnInit
{
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected service = inject(NapsService);
  protected childrenService = inject(ChildrenService);
  protected datetimeService = inject(DateTimeService);
  protected toast = inject(ToastService);

  // Expose validation constants for template
  VALIDATION = NAP_VALIDATION;

  protected form = new FormGroup({
    napped_at: new FormControl('', [Validators.required]),
    notes: new FormControl('', [
      Validators.maxLength(NAP_VALIDATION.MAX_NOTES_LENGTH),
    ]),
  });

  protected resourceName = 'nap';
  protected listRoute = 'naps';
  protected successMessageCreate = 'Nap recorded successfully';
  protected successMessageUpdate = 'Nap updated successfully';

  // Expose form to template
  get napForm() {
    return this.form;
  }

  ngOnInit() {
    this.initializeForm();
  }

  protected setDefaultDateTime() {
    const now = new Date();
    this.form.patchValue({
      napped_at: this.datetimeService.toInputFormat(now),
    });
  }

  protected buildCreateDto(): NapCreate {
    const formValue = this.form.value;
    const timestamp = this.convertLocalToUtc(formValue.napped_at!);
    return {
      napped_at: timestamp,
      notes: formValue.notes || undefined,
    };
  }

  protected patchFormWithResource(resource: Nap) {
    const localDate = this.convertUtcToLocal(resource.napped_at);
    this.form.patchValue({
      napped_at: this.formatForInput(localDate),
      notes: resource.notes || '',
    });
  }
}
