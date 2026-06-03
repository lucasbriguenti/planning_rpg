import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CHARACTER_CLASSES, CharacterClass } from '../../../core/models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly classes = Object.entries(CHARACTER_CLASSES).map(([key, val]) => ({ key: key as CharacterClass, ...val }));

  form = this.fb.group({
    displayName:    ['', [Validators.required, Validators.minLength(2)]],
    email:          ['', [Validators.required, Validators.email]],
    password:       ['', [Validators.required, Validators.minLength(6)]],
    characterClass: ['warrior' as CharacterClass, Validators.required],
  });

  selectClass(cls: CharacterClass): void {
    this.form.patchValue({ characterClass: cls });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    const { displayName, email, password, characterClass } = this.form.value;
    this.authService.register(email!, password!, displayName!, characterClass! as CharacterClass).subscribe({
      next: () => {
        this.notify.success('Bem-vindo, Aventureiro!', 'Sua jornada começa agora!');
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.loading.set(false);
        this.notify.error('Falha ao criar conta', this.getFirebaseError(err.code));
      },
    });
  }

  private getFirebaseError(code: string): string {
    const map: Record<string, string> = {
      'auth/email-already-in-use': 'Este email já está em uso',
      'auth/weak-password': 'Senha muito fraca (mínimo 6 caracteres)',
    };
    return map[code] ?? 'Erro desconhecido. Tente novamente.';
  }
}
