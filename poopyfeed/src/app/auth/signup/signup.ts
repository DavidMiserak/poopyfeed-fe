import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup {
  private router = inject(Router);

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

    // Check if passwords match
    const password = this.signupForm.value.password;
    const confirmPassword = this.signupForm.value.confirmPassword;

    if (password !== confirmPassword) {
      this.error.set('Passwords do not match');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    // TODO: Implement actual signup API call
    // For now, simulate a signup
    setTimeout(() => {
      this.isSubmitting.set(false);
      // this.router.navigate(['/dashboard']);
      console.log('Signup submitted:', this.signupForm.value);
    }, 1000);
  }
}
