import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly countdown = signal(0);
  readonly errorMessage = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  send(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    const email = this.form.value.email!;

    this.authService.resetPassword(email).subscribe({
      next: () => this.onSendSuccess(),
      error: err => {
        const msg = this.authService.getResetPasswordErrorMessage(err);
        if (msg === null) {
          this.onSendSuccess();
        } else {
          this.loading.set(false);
          this.errorMessage.set(msg);
        }
      },
    });
  }

  resend(): void {
    if (this.countdown() > 0 || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    const email = this.form.value.email!;

    this.authService.resetPassword(email).subscribe({
      next: () => this.startCountdown(),
      error: err => {
        const msg = this.authService.getResetPasswordErrorMessage(err);
        this.loading.set(false);
        if (msg !== null) this.errorMessage.set(msg);
        else this.startCountdown();
      },
    });
  }

  private onSendSuccess(): void {
    this.loading.set(false);
    this.submitted.set(true);
    this.startCountdown();
  }

  private startCountdown(): void {
    this.countdown.set(60);
    const interval = setInterval(() => {
      this.countdown.update(v => v - 1);
      if (this.countdown() <= 0) clearInterval(interval);
    }, 1000);
    this.destroyRef.onDestroy(() => clearInterval(interval));
  }
}
