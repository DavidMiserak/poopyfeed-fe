import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  private toast = inject(ToastService);

  private key: string | null = this.route.snapshot.paramMap.get('key');

  form = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  isSubmitting = signal(false);
  error = signal<string | null>(null);

  get hasValidKey(): boolean {
    return !!this.key;
  }

  onSubmit(): void {
    if (!this.hasValidKey) {
      this.error.set('Invalid or expired reset link.');
      return;
    }

    if (this.form.invalid) {
      return;
    }

    const { password, confirmPassword } = this.form.value;
    if (!password || !confirmPassword) {
      this.error.set('Password is required');
      return;
    }

    if (password !== confirmPassword) {
      this.error.set('Passwords do not match');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    this.authService
      .resetPassword({ key: this.key as string, password })
      .subscribe({
        next: () => {
          // After resetting password, load profile and navigate to children
          this.accountService.getProfile().subscribe({
            next: () => {
              this.isSubmitting.set(false);
              this.toast.success('Password reset successfully');
              this.router.navigate(['/children']);
            },
            error: () => {
              this.isSubmitting.set(false);
              this.toast.success('Password reset successfully');
              this.router.navigate(['/children']);
            },
          });
        },
        error: (err: Error) => {
          this.isSubmitting.set(false);
          this.error.set(err.message);
          this.toast.error(err.message);
        },
      });
  }
}
