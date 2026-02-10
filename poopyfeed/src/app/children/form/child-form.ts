import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ChildrenService } from '../../services/children.service';
import { ToastService } from '../../services/toast.service';
import { Child, ChildCreate } from '../../models/child.model';

@Component({
  selector: 'app-child-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './child-form.html',
  styleUrl: './child-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildForm implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private childrenService = inject(ChildrenService);
  private toast = inject(ToastService);

  childId = signal<number | null>(null);
  isEdit = computed(() => this.childId() !== null);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  childForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    date_of_birth: new FormControl('', [Validators.required]),
    gender: new FormControl<'M' | 'F' | 'O'>('M', [Validators.required]),
  });

  ngOnInit() {
    // Check if we're editing an existing child
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.childId.set(Number(id));
      this.loadChild(Number(id));
    }
  }

  loadChild(id: number) {
    this.childrenService.get(id).subscribe({
      next: (child) => {
        this.childForm.patchValue({
          name: child.name,
          date_of_birth: child.date_of_birth,
          gender: child.gender,
        });
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  onSubmit() {
    if (this.childForm.invalid) {
      return;
    }

    const formData = this.childForm.value;

    if (!formData.name || !formData.date_of_birth || !formData.gender) {
      this.error.set('All fields are required');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const childData: ChildCreate = {
      name: formData.name,
      date_of_birth: formData.date_of_birth,
      gender: formData.gender,
    };

    const operation = this.isEdit()
      ? this.childrenService.update(this.childId()!, childData)
      : this.childrenService.create(childData);

    operation.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const actionName = this.isEdit() ? 'updated' : 'created';
        this.toast.success(`Child ${actionName} successfully`);
        this.router.navigate(['/children']);
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.error.set(err.message);
        this.toast.error(err.message);
      },
    });
  }

  onCancel() {
    this.router.navigate(['/children']);
  }
}
