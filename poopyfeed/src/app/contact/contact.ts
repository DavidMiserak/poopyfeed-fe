/**
 * Contact form component for user inquiries
 * Submits to FormSpree for email handling
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    subject: new FormControl('', [Validators.required]),
    message: new FormControl('', [
      Validators.required,
      Validators.minLength(10),
    ]),
  });

  get isSubmitting(): boolean {
    return this.form.disabled;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    // Disable form during submission
    this.form.disable();

    // FormSpree will handle the form submission
    // The form action will POST to FormSpree endpoint
    const formElement = document.querySelector('form') as HTMLFormElement;
    if (formElement) {
      formElement.submit();
    }
  }
}
