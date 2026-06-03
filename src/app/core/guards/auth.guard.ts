import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';
import { Observable } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(FirebaseService).auth;
  const router = inject(Router);
  return new Observable(observer => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      if (user) { observer.next(true); }
      else { router.navigate(['/auth/login']); observer.next(false); }
      observer.complete();
    });
  });
};

export const publicGuard: CanActivateFn = () => {
  const auth = inject(FirebaseService).auth;
  const router = inject(Router);
  return new Observable(observer => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      if (user) { router.navigate(['/dashboard']); observer.next(false); }
      else { observer.next(true); }
      observer.complete();
    });
  });
};
