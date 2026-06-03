import { Injectable, NgZone, inject } from '@angular/core';
import {
  doc, setDoc, getDoc, updateDoc,
  collection, query, orderBy, limit, onSnapshot,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { UserProfile, levelFromXp } from '../models/user.model';
import { AchievementStats, ACHIEVEMENTS } from '../models/achievement.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly db = inject(FirebaseService).db;
  private readonly ngZone = inject(NgZone);

  async createProfile(uid: string, profile: UserProfile): Promise<void> {
    await setDoc(doc(this.db, 'users', uid), profile);
  }

  async profileExists(uid: string): Promise<boolean> {
    return (await getDoc(doc(this.db, 'users', uid))).exists();
  }

  getProfile(uid: string): Observable<UserProfile | undefined> {
    return new Observable(observer => {
      getDoc(doc(this.db, 'users', uid))
        .then(snap => this.ngZone.run(() => {
          observer.next(snap.exists() ? (snap.data() as UserProfile) : undefined);
          observer.complete();
        }))
        .catch(err => this.ngZone.run(() => observer.error(err)));
    });
  }

  getLeaderboard(top = 20): Observable<UserProfile[]> {
    const q = query(collection(this.db, 'users'), orderBy('xp', 'desc'), limit(top));
    return new Observable(observer => {
      const unsub = onSnapshot(q,
        snap => this.ngZone.run(() => observer.next(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)))),
        err  => this.ngZone.run(() => observer.error(err))
      );
      return () => unsub();
    });
  }

  async addXp(uid: string, amount: number): Promise<void> {
    const snap = await getDoc(doc(this.db, 'users', uid));
    if (!snap.exists()) return;
    const profile = snap.data() as UserProfile;
    const newXp = (profile.xp ?? 0) + amount;
    await updateDoc(doc(this.db, 'users', uid), { xp: newXp, level: levelFromXp(newXp), updatedAt: new Date() });
  }

  async incrementStats(uid: string, stats: Partial<Pick<UserProfile, 'totalVotes' | 'totalSessions' | 'perfectConsensus'>>): Promise<void> {
    const ref = doc(this.db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const profile = snap.data() as UserProfile;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const merged = { ...profile };

    if (stats.totalVotes)       { merged.totalVotes       = (profile.totalVotes ?? 0) + stats.totalVotes;            updates['totalVotes']       = merged.totalVotes; }
    if (stats.totalSessions)    { merged.totalSessions    = (profile.totalSessions ?? 0) + stats.totalSessions;      updates['totalSessions']    = merged.totalSessions; }
    if (stats.perfectConsensus) { merged.perfectConsensus = (profile.perfectConsensus ?? 0) + stats.perfectConsensus; updates['perfectConsensus'] = merged.perfectConsensus; }

    await updateDoc(ref, updates);
    await this.checkAchievements(uid, {
      totalVotes:          merged.totalVotes ?? 0,
      totalSessions:       merged.totalSessions ?? 0,
      perfectConsensus:    merged.perfectConsensus ?? 0,
      consecutiveSessions: 0,
      firstVote:           merged.totalVotes === 1,
    }, profile);
  }

  private async checkAchievements(uid: string, stats: AchievementStats, profile: UserProfile): Promise<void> {
    const ref = doc(this.db, 'users', uid);
    const existingIds = (profile.achievements ?? []).map(a => a.id);
    const newAchievements = [...(profile.achievements ?? [])];
    let xpBonus = 0;

    for (const def of ACHIEVEMENTS) {
      if (!existingIds.includes(def.id) && def.condition(stats)) {
        newAchievements.push({ id: def.id, name: def.name, description: def.description, icon: def.icon, unlockedAt: new Date() });
        xpBonus += def.xpReward;
      }
    }

    if (xpBonus > 0 || newAchievements.length !== existingIds.length) {
      const currentXp = (profile.xp ?? 0) + xpBonus;
      await updateDoc(ref, { achievements: newAchievements, xp: currentXp, level: levelFromXp(currentXp), updatedAt: new Date() });
    }
  }

  async updateCharacterClass(uid: string, characterClass: string): Promise<void> {
    await updateDoc(doc(this.db, 'users', uid), { characterClass, updatedAt: new Date() });
  }
}
