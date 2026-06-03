import { Injectable, NgZone, inject } from '@angular/core';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, GoogleAuthProvider, signInWithPopup, updateProfile,
  onAuthStateChanged, User,
} from 'firebase/auth';
import { Observable, from, switchMap, of } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { UserService } from './user.service';
import { CharacterClass } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private fb = inject(FirebaseService);
  private userService = inject(UserService);
  private readonly ngZone = inject(NgZone);

  get currentUser(): User | null {
    return this.fb.auth.currentUser;
  }

  currentUser$(): Observable<User | null> {
    return new Observable(observer => {
      const unsub = onAuthStateChanged(
        this.fb.auth,
        u   => this.ngZone.run(() => observer.next(u)),
        err => this.ngZone.run(() => observer.error(err))
      );
      return () => unsub();
    });
  }

  register(email: string, password: string, displayName: string, characterClass: CharacterClass): Observable<void> {
    return from(createUserWithEmailAndPassword(this.fb.auth, email, password)).pipe(
      switchMap(async cred => {
        await updateProfile(cred.user, { displayName });
        await this.userService.createProfile(cred.user.uid, {
          uid: cred.user.uid, displayName, email, characterClass,
          xp: 0, level: 1, totalVotes: 0, totalSessions: 0, perfectConsensus: 0,
          achievements: [], createdAt: new Date(), updatedAt: new Date(),
        });
      })
    );
  }

  login(email: string, password: string): Observable<void> {
    return from(signInWithEmailAndPassword(this.fb.auth, email, password)).pipe(
      switchMap(() => of(undefined))
    );
  }

  loginWithGoogle(): Observable<void> {
    return from(signInWithPopup(this.fb.auth, new GoogleAuthProvider())).pipe(
      switchMap(async cred => {
        const exists = await this.userService.profileExists(cred.user.uid);
        if (!exists) {
          await this.userService.createProfile(cred.user.uid, {
            uid: cred.user.uid,
            displayName: cred.user.displayName ?? 'Aventureiro',
            email: cred.user.email ?? '',
            photoURL: cred.user.photoURL ?? undefined,
            characterClass: 'warrior',
            xp: 0, level: 1, totalVotes: 0, totalSessions: 0, perfectConsensus: 0,
            achievements: [], createdAt: new Date(), updatedAt: new Date(),
          });
        }
      })
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.fb.auth));
  }
}
