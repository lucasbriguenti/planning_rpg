import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { take } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { SessionService } from '../../../core/services/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserProfile } from '../../../core/models/user.model';

@Component({
  selector: 'app-session-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './session-create.component.html',
  styleUrl: './session-create.component.scss',
})
export class SessionCreateComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly sessionService = inject(SessionService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly currentUser = signal<UserProfile | null>(null);
  readonly loading = signal(false);

  form = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
  });

  ngOnInit(): void {
    this.authService.currentUser$().pipe(take(1)).subscribe(authUser => {
      if (!authUser) return;
      this.userService.getProfile(authUser.uid).pipe(take(1)).subscribe(profile => {
        this.currentUser.set(profile ?? null);
      });
    });
  }

  async submit(): Promise<void> {
    const user = this.currentUser();
    if (this.form.invalid || !user || this.loading()) return;
    this.loading.set(true);
    try {
      const { name, description } = this.form.value;
      const sessionId = await this.sessionService.createSession(user, name!, description || undefined);
      await this.userService.incrementStats(user.uid, { totalSessions: 1 });
      await this.userService.addXp(user.uid, 25);
      this.notify.success('Sessão criada!', 'Adicione as histórias dentro da missão.');
      this.router.navigate(['/sessions', sessionId]);
    } catch (err) {
      console.error('Erro ao criar sessão:', err);
      this.notify.error('Erro', 'Não foi possível criar a sessão.');
      this.loading.set(false);
    }
  }
}
