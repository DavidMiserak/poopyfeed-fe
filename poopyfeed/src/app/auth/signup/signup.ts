import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { ToastService } from '../../services/toast.service';
import { GaTrackingService } from '../../services/ga-tracking.service';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup {
  private router = inject(Router);
  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  private toast = inject(ToastService);
  private gaTracking = inject(GaTrackingService);

  signupForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  isSubmitting = signal(false);
  error = signal<string | null>(null);

  onSubmit() {
    if (this.signupForm.invalid) {
      return;
    }

    const { email, password, confirmPassword } = this.signupForm.value;

    // Check if passwords match
    if (password !== confirmPassword) {
      this.error.set('Passwords do not match');
      return;
    }

    if (!email || !password) {
      this.error.set('Email and password are required');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    // Sign up (allauth automatically logs in the user)
    this.authService
      .signup({ email, password })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toast.success('Account created successfully');
          this.gaTracking.trackEvent('sign_up');
          // Load profile (timezone) so timeline and other views show times in user's timezone
          this.accountService.getProfile().subscribe({
            next: () => this.router.navigate(['/children']),
            error: () => this.router.navigate(['/children']),
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
