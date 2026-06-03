import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { take } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserProfile, xpProgressInLevel, CHARACTER_CLASSES, getLevelTitle, CharacterClass } from '../../core/models/user.model';
import { ACHIEVEMENTS } from '../../core/models/achievement.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly notify = inject(NotificationService);

  readonly currentUser = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly xpProgress = signal({ current: 0, required: 100, percentage: 0 });

  readonly azureConfig  = signal<{ pat: string; organization: string; project: string } | null>(null);
  readonly patInput     = signal('');
  readonly orgInput     = signal('');
  readonly projectInput = signal('');
  readonly showPat      = signal(false);
  readonly editingPat   = signal(false);
  readonly savingPat    = signal(false);

  readonly allAchievements = ACHIEVEMENTS;
  readonly classes = Object.entries(CHARACTER_CLASSES).map(([key, val]) => ({ key: key as CharacterClass, ...val }));
  readonly getLevelTitle = getLevelTitle;

  ngOnInit(): void {
    this.authService.currentUser$().pipe(take(1)).subscribe(authUser => {
      if (!authUser) { this.loading.set(false); return; }
      this.userService.getProfile(authUser.uid).pipe(take(1)).subscribe({
        next: profile => {
          this.currentUser.set(profile ?? null);
          if (profile) this.xpProgress.set(xpProgressInLevel(profile.xp));
          this.loading.set(false);
        },
        error: () => { this.loading.set(false); },
      });
      this.userService.getAzureConfig(authUser.uid).then(cfg => this.azureConfig.set(cfg));
    });
  }

  isAchievementUnlocked(id: string): boolean {
    return !!this.currentUser()?.achievements.find(a => a.id === id);
  }

  getClassInfo(cls: string) {
    return (CHARACTER_CLASSES as Record<string, (typeof CHARACTER_CLASSES)[keyof typeof CHARACTER_CLASSES] | undefined>)[cls];
  }

  startPatEdit(): void {
    const cfg = this.azureConfig();
    this.patInput.set('');
    this.orgInput.set(cfg?.organization ?? '');
    this.projectInput.set(cfg?.project ?? '');
    this.showPat.set(false);
    this.editingPat.set(true);
  }

  cancelPatEdit(): void {
    this.editingPat.set(false);
    this.showPat.set(false);
  }

  async savePat(): Promise<void> {
    const user = this.currentUser();
    const pat  = this.patInput().trim();
    const org  = this.orgInput().trim();
    const proj = this.projectInput().trim();
    if (!user || !pat || !org || !proj || this.savingPat()) return;
    this.savingPat.set(true);
    try {
      const config = { pat, organization: org, project: proj };
      await this.userService.saveAzureConfig(user.uid, config);
      this.azureConfig.set(config);
      this.editingPat.set(false);
      this.showPat.set(false);
      this.notify.success('Integração salva!', 'Azure DevOps configurado com sucesso.');
    } catch {
      this.notify.error('Erro', 'Não foi possível salvar a configuração.');
    } finally {
      this.savingPat.set(false);
    }
  }

  async changeClass(cls: CharacterClass): Promise<void> {
    const user = this.currentUser();
    if (!user || user.characterClass === cls) return;
    await this.userService.updateCharacterClass(user.uid, cls);
    this.currentUser.set({ ...user, characterClass: cls });
    this.notify.success('Classe alterada!', `Agora você é um ${CHARACTER_CLASSES[cls].name}`);
  }
}
