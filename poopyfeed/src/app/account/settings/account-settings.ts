import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { TimezoneCheckService } from '../../services/timezone-check.service';
import { ToastService } from '../../services/toast.service';
import { TIMEZONES } from '../timezones';

@Component({
  selector: 'app-account-settings',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './account-settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettings implements OnInit {
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private tzCheck = inject(TimezoneCheckService);
  private notificationService = inject(NotificationService);
  pushService = inject(PushNotificationService);

  timezones = TIMEZONES;

  // Push notification state
  pushToggling = signal(false);
  isLoading = signal(true);
  loadError = signal<string | null>(null);

  // Profile form state
  profileSubmitting = signal(false);
  profileError = signal<string | null>(null);
  profileSuccess = signal<string | null>(null);

  // Timezone form state
  timezoneSubmitting = signal(false);
  timezoneError = signal<string | null>(null);
  timezoneSuccess = signal<string | null>(null);

  // Quiet hours form state
  quietHoursSubmitting = signal(false);
  quietHoursError = signal<string | null>(null);
  quietHoursSuccess = signal<string | null>(null);

  // Password form state
  passwordSubmitting = signal(false);
  passwordError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);

  // Delete form state
  deleteSubmitting = signal(false);
  deleteError = signal<string | null>(null);

  profileForm = new FormGroup({
    first_name: new FormControl('', [Validators.maxLength(150)]),
    last_name: new FormControl('', [Validators.maxLength(150)]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  timezoneForm = new FormGroup({
    timezone: new FormControl('UTC', [Validators.required]),
  });

  quietHoursForm = new FormGroup({
    enabled: new FormControl(false),
    start_time: new FormControl('22:00', [Validators.required]),
    end_time: new FormControl('07:00', [Validators.required]),
  });

  passwordForm = new FormGroup({
    current_password: new FormControl('', [Validators.required]),
    new_password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
    new_password_confirm: new FormControl('', [Validators.required]),
  });

  deleteForm = new FormGroup({
    current_password: new FormControl('', [Validators.required]),
  });

  ngOnInit() {
    this.accountService.getProfile().subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
        });
        this.timezoneForm.patchValue({
          timezone: profile.timezone,
        });
        this.isLoading.set(false);
        this.loadQuietHours();
      },
      error: (err: Error) => {
        this.loadError.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  private loadQuietHours(): void {
    this.notificationService.getQuietHours().subscribe({
      next: (qh) => {
        this.quietHoursForm.patchValue({
          enabled: qh.enabled,
          start_time: this.timeToInputValue(qh.start_time),
          end_time: this.timeToInputValue(qh.end_time),
        });
      },
      error: () => {
        // Non-blocking: quiet hours card can show error or empty
      },
    });
  }

  /** Convert API "HH:MM:SS" to input value "HH:MM". */
  private timeToInputValue(apiTime: string): string {
    return apiTime.slice(0, 5);
  }

  /** Convert form "HH:MM" to API "HH:MM:00" if needed. */
  private inputValueToTime(value: string): string {
    return value.length === 5 ? `${value}:00` : value;
  }

  onQuietHoursSubmit() {
    if (this.quietHoursForm.invalid) return;

    this.quietHoursSubmitting.set(true);
    this.quietHoursError.set(null);
    this.quietHoursSuccess.set(null);

    const value = this.quietHoursForm.value;
    this.notificationService
      .updateQuietHours({
        enabled: value.enabled ?? false,
        start_time: this.inputValueToTime(value.start_time ?? '22:00'),
        end_time: this.inputValueToTime(value.end_time ?? '07:00'),
      })
      .subscribe({
        next: () => {
          this.quietHoursSubmitting.set(false);
          this.quietHoursSuccess.set('Quiet hours saved.');
          this.toast.success('Quiet hours saved');
        },
        error: (err: Error) => {
          this.quietHoursSubmitting.set(false);
          this.quietHoursError.set(err.message);
          this.toast.error(err.message);
        },
      });
  }

  onProfileSubmit() {
    if (this.profileForm.invalid) return;

    this.profileSubmitting.set(true);
    this.profileError.set(null);
    this.profileSuccess.set(null);

    this.accountService
      .updateProfile({
        first_name: this.profileForm.value.first_name ?? '',
        last_name: this.profileForm.value.last_name ?? '',
        email: this.profileForm.value.email ?? '',
      })
      .subscribe({
        next: () => {
          this.profileSubmitting.set(false);
          this.profileSuccess.set('Profile updated successfully.');
          this.toast.success('Profile updated successfully');
        },
        error: (err: Error) => {
          this.profileSubmitting.set(false);
          this.profileError.set(err.message);
          this.toast.error(err.message);
        },
      });
  }

  onTimezoneSubmit() {
    if (this.timezoneForm.invalid) return;

    this.timezoneSubmitting.set(true);
    this.timezoneError.set(null);
    this.timezoneSuccess.set(null);

    this.accountService
      .updateProfile({
        timezone: this.timezoneForm.value.timezone ?? 'UTC',
      })
      .subscribe({
        next: () => {
          this.timezoneSubmitting.set(false);
          this.timezoneSuccess.set('Timezone updated successfully.');
          this.toast.success('Timezone updated successfully');
          this.tzCheck.clearDismissal();
        },
        error: (err: Error) => {
          this.timezoneSubmitting.set(false);
          this.timezoneError.set(err.message);
          this.toast.error(err.message);
        },
      });
  }

  onPasswordSubmit() {
    if (this.passwordForm.invalid) return;

    this.passwordSubmitting.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    const values = this.passwordForm.value;

    if (values.new_password !== values.new_password_confirm) {
      this.passwordSubmitting.set(false);
      this.passwordError.set('New passwords do not match.');
      return;
    }

    this.accountService
      .changePassword({
        current_password: values.current_password ?? '',
        new_password: values.new_password ?? '',
        new_password_confirm: values.new_password_confirm ?? '',
      })
      .subscribe({
        next: (response) => {
          this.authService.updateToken(response.auth_token);
          this.passwordSubmitting.set(false);
          this.passwordSuccess.set('Password changed successfully.');
          this.passwordForm.reset();
          this.toast.success('Password changed successfully');
        },
        error: (err: Error) => {
          this.passwordSubmitting.set(false);
          this.passwordError.set(err.message);
          this.toast.error(err.message);
        },
      });
  }

  async togglePush() {
    this.pushToggling.set(true);
    try {
      if (this.pushService.pushEnabled()) {
        await this.pushService.unregisterDevice();
        this.toast.success('Push notifications disabled');
      } else {
        const success = await this.pushService.requestPermission();
        if (success) {
          this.toast.success('Push notifications enabled');
        } else {
          this.toast.error(
            'Could not enable push notifications. Check browser permissions.'
          );
        }
      }
    } catch {
      this.toast.error('Failed to update push notification settings');
    } finally {
      this.pushToggling.set(false);
    }
  }

  onDeleteSubmit() {
    if (this.deleteForm.invalid) return;

    this.deleteSubmitting.set(true);
    this.deleteError.set(null);

    this.accountService
      .deleteAccount({
        current_password: this.deleteForm.value.current_password ?? '',
      })
      .subscribe({
        next: () => {
          this.toast.success('Account deleted successfully');
          this.authService.clearAuthAndRedirect('/');
        },
        error: (err: Error) => {
          this.deleteSubmitting.set(false);
          this.deleteError.set(err.message);
          this.toast.error(err.message);
        },
      });
  }
}
