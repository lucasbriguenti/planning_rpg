import { Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, switchMap, of } from 'rxjs';
import { NotificationService, Notification } from './core/services/notification.service';
import { UserService } from './core/services/user.service';
import { AuthService } from './core/services/auth.service';
import { UserProfile, xpProgressInLevel, CHARACTER_CLASSES } from './core/models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private router = inject(Router);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);

  notifications: Notification[] = [];
  currentUser: UserProfile | null = null;
  isMenuOpen = false;
  xpPercentage = 0;
  charIcon = '⚔️';

  get isAuthPage(): boolean {
    return this.router.url.startsWith('/auth');
  }

  ngOnInit(): void {
    this.notificationService.notifications$.subscribe(n => (this.notifications = n));

    this.authService.currentUser$().pipe(
      switchMap(u => u ? this.userService.getProfile(u.uid) : of(null))
    ).subscribe(profile => {
      this.currentUser = profile ?? null;
      if (profile) {
        this.xpPercentage = xpProgressInLevel(profile.xp).percentage;
        this.charIcon = CHARACTER_CLASSES[profile.characterClass]?.icon ?? '⚔️';
      }
    });

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.isMenuOpen = false;
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => this.router.navigate(['/auth/login']));
  }

  dismissNotification(id: string): void {
    this.notificationService.dismiss(id);
  }
}
