import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

import { take } from 'rxjs';
import { ACHIEVEMENTS } from '../../core/models/achievement.model';
import { Session } from '../../core/models/session.model';
import { CHARACTER_CLASSES, UserProfile, getLevelTitle, xpProgressInLevel } from '../../core/models/user.model';
import { NotificationService } from '../../core/services/notification.service';
import { SessionService } from '../../core/services/session.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly sessionService = inject(SessionService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly currentUser = signal<UserProfile | null>(null);
  readonly sessions = signal<Session[]>([]);
  readonly loading = signal(true);
  readonly joining = signal(false);
  readonly showJoinModal = signal(false);
  readonly xpProgress = signal({ current: 0, required: 100, percentage: 0 });

  readonly activeSessions = computed(() =>
    this.sessions().filter(s => s.status !== 'completed').slice(0, 6)
  );

  readonly completedSessions = computed(() =>
    this.sessions().filter(s => s.status === 'completed').slice(0, 3)
  );

  readonly unlockedAchievements = computed(() =>
    this.currentUser()?.achievements ?? []
  );

  readonly lockedAchievements = computed(() => {
    const unlockedIds = new Set(this.unlockedAchievements().map(a => a.id));
    return this.allAchievements.filter(a => !unlockedIds.has(a.id)).slice(0, 3);
  });

  joinForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  getClassInfo(cls: string) {
    return (CHARACTER_CLASSES as Record<string, (typeof CHARACTER_CLASSES)[keyof typeof CHARACTER_CLASSES] | undefined>)[cls];
  }

  getLevelTitle = getLevelTitle;
  allAchievements = ACHIEVEMENTS;

  ngOnInit(): void {
    this.authService.currentUser$().pipe(take(1)).subscribe({
      next: authUser => {
        if (!authUser) {
          this.loading.set(false);
          return;
        }

        this.loading.set(false);

        this.userService.getProfile(authUser.uid).subscribe({
          next: profile => {
            this.currentUser.set(profile ?? null);
            if (profile) this.xpProgress.set(xpProgressInLevel(profile.xp));
          },
          error: err => console.error('Perfil:', err),
        });

        this.sessionService.getUserSessions(authUser.uid).subscribe({
          next: sessions => {
            this.sessions.set([...sessions].sort((a, b) => {
              const ta = (a.createdAt as unknown as { seconds: number })?.seconds ?? 0;
              const tb = (b.createdAt as unknown as { seconds: number })?.seconds ?? 0;
              return tb - ta;
            }));
          },
          error: err => console.error('Sessões:', err),
        });
      },
      error: err => {
        console.error('Auth state:', err);
        this.loading.set(false);
      },
    });
  }

  joinSession(): void {
    const code = this.joinForm.value.code?.trim();
    if (!code || !this.currentUser()) return;
    this.joining.set(true);
    this.sessionService.findSessionByCode(code)
      .then(session => {
        if (!session) {
          this.notify.error('Sessão não encontrada', 'Verifique o código e tente novamente.');
          this.joining.set(false);
          return;
        }
        return this.sessionService.joinSession(session.id, this.currentUser()!).then(() => {
          this.router.navigate(['/sessions', session.id]);
          this.joining.set(false);
          this.showJoinModal.set(false);
        });
      })
      .catch(() => {
        this.notify.error('Erro', 'Não foi possível entrar na sessão.');
        this.joining.set(false);
      });
  }
}
