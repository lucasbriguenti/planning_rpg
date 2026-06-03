import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'achievement';
  title: string;
  message: string;
  icon?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _notifications = new BehaviorSubject<Notification[]>([]);
  readonly notifications$ = this._notifications.asObservable();

  show(type: Notification['type'], title: string, message: string, icon?: string, duration = 4000): void {
    const id = Math.random().toString(36).substring(2);
    const notification: Notification = { id, type, title, message, icon, duration };
    this._notifications.next([...this._notifications.value, notification]);
    if (duration > 0) setTimeout(() => this.dismiss(id), duration);
  }

  achievement(name: string, icon: string, xp: number): void {
    this.show('achievement', '🏆 Conquista Desbloqueada!', `${icon} ${name} — +${xp} XP`, icon, 6000);
  }

  success(title: string, message: string): void {
    this.show('success', title, message);
  }

  error(title: string, message: string): void {
    this.show('error', title, message);
  }

  info(title: string, message: string): void {
    this.show('info', title, message);
  }

  dismiss(id: string): void {
    this._notifications.next(this._notifications.value.filter(n => n.id !== id));
  }
}
