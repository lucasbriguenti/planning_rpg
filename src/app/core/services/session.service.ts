import { Injectable, NgZone, inject } from '@angular/core';
import {
  doc, setDoc, updateDoc, getDoc,
  collection, query, where, orderBy,
  onSnapshot, deleteDoc, getDocs,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { Session, Participant } from '../models/session.model';
import { Story, StoryCategory } from '../models/story.model';
import { Vote } from '../models/vote.model';
import { UserProfile, CHARACTER_CLASSES } from '../models/user.model';

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly db = inject(FirebaseService).db;
  private readonly ngZone = inject(NgZone);

  async createSession(host: UserProfile, name: string, description?: string): Promise<string> {
    const id = doc(collection(this.db, 'sessions')).id;
    const classInfo = CHARACTER_CLASSES[host.characterClass] ?? CHARACTER_CLASSES['warrior'];
    const session: Session = {
      id, name,
      ...(description ? { description } : {}),
      hostId: host.uid, hostName: host.displayName,
      participants: [{
        uid: host.uid, displayName: host.displayName,
        characterClass: host.characterClass, characterIcon: classInfo.icon,
        isHost: true, joinedAt: new Date(), online: true,
      }],
      status: 'waiting', totalStories: 0, completedStories: 0,
      createdAt: new Date(), updatedAt: new Date(),
      inviteCode: generateInviteCode(),
    };
    await setDoc(doc(this.db, 'sessions', id), session);
    return id;
  }

  getSession(id: string): Observable<Session | undefined> {
    return new Observable(observer => {
      const unsub = onSnapshot(
        doc(this.db, 'sessions', id),
        snap => this.ngZone.run(() => observer.next(snap.exists() ? { id: snap.id, ...snap.data() } as Session : undefined)),
        err  => this.ngZone.run(() => observer.error(err))
      );
      return () => unsub();
    });
  }

  getUserSessions(uid: string): Observable<Session[]> {
    const q = query(collection(this.db, 'sessions'), where('hostId', '==', uid));
    return new Observable(observer => {
      const unsub = onSnapshot(q,
        snap => this.ngZone.run(() => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() } as Session)))),
        err  => this.ngZone.run(() => observer.error(err))
      );
      return () => unsub();
    });
  }

  async joinSession(sessionId: string, user: UserProfile): Promise<void> {
    const ref = doc(this.db, 'sessions', sessionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Sessão não encontrada');
    const session = snap.data() as Session;
    if (session.participants.find(p => p.uid === user.uid)) return;
    const classInfo = CHARACTER_CLASSES[user.characterClass] ?? CHARACTER_CLASSES['warrior'];
    const participant: Participant = {
      uid: user.uid, displayName: user.displayName,
      characterClass: user.characterClass, characterIcon: classInfo.icon,
      isHost: false, joinedAt: new Date(), online: true,
    };
    await updateDoc(ref, { participants: [...session.participants, participant], updatedAt: new Date() });
  }

  async findSessionByCode(code: string): Promise<Session | null> {
    const q = query(collection(this.db, 'sessions'), where('inviteCode', '==', code.toUpperCase()));
    const snaps = await getDocs(q);
    if (snaps.empty) return null;
    return { id: snaps.docs[0].id, ...snaps.docs[0].data() } as Session;
  }

  async startSession(sessionId: string): Promise<void> {
    await updateDoc(doc(this.db, 'sessions', sessionId), { status: 'active', updatedAt: new Date() });
  }

  async addStory(sessionId: string, title: string, description?: string, category?: StoryCategory): Promise<string> {
    const sessRef = doc(this.db, 'sessions', sessionId);
    const snap = await getDoc(sessRef);
    const session = snap.data() as Session;
    const storyId = doc(collection(this.db, 'sessions', sessionId, 'stories')).id;
    const story: Story = {
      id: storyId, sessionId, title, status: 'pending',
      ...(description ? { description } : {}),
      ...(category    ? { category }    : {}),
      order: (session.totalStories ?? 0) + 1, createdAt: new Date(),
    };
    await setDoc(doc(this.db, 'sessions', sessionId, 'stories', storyId), story);
    await updateDoc(sessRef, { totalStories: (session.totalStories ?? 0) + 1, updatedAt: new Date() });
    return storyId;
  }

  getStories(sessionId: string): Observable<Story[]> {
    const q = query(collection(this.db, 'sessions', sessionId, 'stories'), orderBy('order', 'asc'));
    return new Observable(observer => {
      const unsub = onSnapshot(q,
        snap => this.ngZone.run(() => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() } as Story)))),
        err  => this.ngZone.run(() => observer.error(err))
      );
      return () => unsub();
    });
  }

  async updateStory(sessionId: string, storyId: string, updates: { title?: string; category?: StoryCategory | null }): Promise<void> {
    await updateDoc(doc(this.db, 'sessions', sessionId, 'stories', storyId), { ...updates, updatedAt: new Date() });
  }

  async startVoting(sessionId: string, storyId: string): Promise<void> {
    await updateDoc(doc(this.db, 'sessions', sessionId, 'stories', storyId), { status: 'voting', votingStartedAt: new Date() });
    await updateDoc(doc(this.db, 'sessions', sessionId), { status: 'active', currentStoryId: storyId, updatedAt: new Date() });
    const existing = await getDocs(collection(this.db, 'sessions', sessionId, 'stories', storyId, 'votes'));
    await Promise.all(existing.docs.map(d => deleteDoc(d.ref)));
  }

  async castVote(sessionId: string, storyId: string, user: UserProfile, value: number | string): Promise<void> {
    const vote: Vote = {
      id: user.uid, sessionId, storyId,
      userId: user.uid, userName: user.displayName,
      characterClass: user.characterClass, value, createdAt: new Date(),
    };
    await setDoc(doc(this.db, 'sessions', sessionId, 'stories', storyId, 'votes', user.uid), vote);
  }

  getVotes(sessionId: string, storyId: string): Observable<Vote[]> {
    return new Observable(observer => {
      const unsub = onSnapshot(
        collection(this.db, 'sessions', sessionId, 'stories', storyId, 'votes'),
        snap => this.ngZone.run(() => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() } as Vote)))),
        err  => this.ngZone.run(() => observer.error(err))
      );
      return () => unsub();
    });
  }

  async revealVotes(sessionId: string, storyId: string): Promise<void> {
    await updateDoc(doc(this.db, 'sessions', sessionId, 'stories', storyId), { status: 'revealed' });
  }

  async finalizeStory(sessionId: string, storyId: string, estimate: number | string): Promise<void> {
    const sessRef = doc(this.db, 'sessions', sessionId);
    const snap = await getDoc(sessRef);
    const session = snap.data() as Session;
    await updateDoc(doc(this.db, 'sessions', sessionId, 'stories', storyId), { status: 'completed', finalEstimate: estimate, completedAt: new Date() });
    await updateDoc(sessRef, { completedStories: (session.completedStories ?? 0) + 1, currentStoryId: null, updatedAt: new Date() });

    const storiesSnap = await getDocs(collection(this.db, 'sessions', sessionId, 'stories'));
    const allDone = storiesSnap.docs.length > 0 &&
      storiesSnap.docs.every(d => {
        const s = d.data() as Story;
        return d.id === storyId ? true : s.status === 'completed';
      });
    if (allDone) {
      await updateDoc(sessRef, { status: 'completed', updatedAt: new Date() });
    }
  }

  async deleteAllStories(sessionId: string): Promise<void> {
    const storiesRef = collection(this.db, 'sessions', sessionId, 'stories');
    const stories = await getDocs(storiesRef);
    await Promise.all(
      stories.docs.map(async storyDoc => {
        const votesRef = collection(this.db, 'sessions', sessionId, 'stories', storyDoc.id, 'votes');
        const votes = await getDocs(votesRef);
        await Promise.all(votes.docs.map(v => deleteDoc(v.ref)));
        await deleteDoc(storyDoc.ref);
      })
    );
    await updateDoc(doc(this.db, 'sessions', sessionId), {
      currentStoryId: null,
      totalStories: 0,
      completedStories: 0,
      updatedAt: new Date(),
    });
  }

  async deleteStory(sessionId: string, storyId: string): Promise<void> {
    const storyRef = doc(this.db, 'sessions', sessionId, 'stories', storyId);
    const votesRef = collection(this.db, 'sessions', sessionId, 'stories', storyId, 'votes');
    const votes = await getDocs(votesRef);
    await Promise.all(votes.docs.map(v => deleteDoc(v.ref)));
    await deleteDoc(storyRef);
  }

  async completeSession(sessionId: string): Promise<void> {
    await updateDoc(doc(this.db, 'sessions', sessionId), { status: 'completed', updatedAt: new Date() });
  }
}
