import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { switchMap } from 'rxjs';

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

  signupForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
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

    // Sign up, then automatically log in
    this.authService
      .signup({ email, password })
      .pipe(
        switchMap(() => {
          // After successful signup, login with same credentials
          return this.authService.login({ email, password });
        })
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          // TODO: Navigate to dashboard once it exists
          this.router.navigate(['/']);
        },
        error: (err: Error) => {
          this.isSubmitting.set(false);
          this.error.set(err.message);
        },
      });
  }
}
