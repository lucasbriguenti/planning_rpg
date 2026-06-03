import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { take } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserProfile, CHARACTER_CLASSES, getLevelTitle } from '../../core/models/user.model';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  readonly players = signal<UserProfile[]>([]);
  readonly currentUid = signal<string | null>(null);
  readonly loading = signal(true);
  readonly getLevelTitle = getLevelTitle;

  ngOnInit(): void {
    this.authService.currentUser$().pipe(take(1)).subscribe(u => this.currentUid.set(u?.uid ?? null));
    this.userService.getLeaderboard(20).subscribe(players => {
      this.players.set(players);
      this.loading.set(false);
    });
  }

  getClassInfo(cls: string) { return (CHARACTER_CLASSES as Record<string, (typeof CHARACTER_CLASSES)[keyof typeof CHARACTER_CLASSES] | undefined>)[cls]; }
  getRankIcon(i: number): string { return i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`; }
  getRankClass(i: number): string { return i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''; }
}
