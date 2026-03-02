import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword {
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  isSubmitting = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const { email } = this.form.value;
    if (!email) {
      this.error.set('Email is required');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);
    this.success.set(null);

    this.authService.requestPasswordReset({ email }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const message =
          "If an account exists for that email, we've sent password reset instructions.";
        this.success.set(message);
        this.toast.success(message);
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        this.error.set(err.message);
        this.toast.error(err.message);
      },
    });
  }
}
