import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private router = inject(Router);

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

    this.isSubmitting.set(true);
    this.error.set(null);

    // TODO: Implement actual login API call
    // For now, simulate a login
    setTimeout(() => {
      this.isSubmitting.set(false);
      // this.router.navigate(['/dashboard']);
      console.log('Login submitted:', this.loginForm.value);
    }, 1000);
  }
}
