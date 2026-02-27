import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private router = inject(Router);
  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  private toast = inject(ToastService);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  isSubmitting = signal(false);
  error = signal<string | null>(null);

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.value;

    if (!email || !password) {
      this.error.set('Email and password are required');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success('Logged in successfully');
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
