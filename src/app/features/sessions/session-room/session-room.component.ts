import { Component, OnInit, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subscription, take } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { SessionService } from '../../../core/services/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserProfile, CHARACTER_CLASSES } from '../../../core/models/user.model';
import { Session } from '../../../core/models/session.model';
import { Story, StoryCategory, STORY_CATEGORIES, PLANNING_CARDS, CARD_RARITY, CARD_SUIT } from '../../../core/models/story.model';
import { Vote, calculateVoteResult, VoteResult, getVoteWeight } from '../../../core/models/vote.model';

@Component({
  selector: 'app-session-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './session-room.component.html',
  styleUrl: './session-room.component.scss',
})
export class SessionRoomComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly sessionService = inject(SessionService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly currentUser = signal<UserProfile | null>(null);
  readonly session = signal<Session | null>(null);
  readonly stories = signal<Story[]>([]);
  readonly votes = signal<Vote[]>([]);
  readonly voteResult = signal<Omit<VoteResult, 'storyId'> | null>(null);

  readonly loading = signal(true);
  readonly submittingVote = signal(false);
  readonly selectedCard = signal<number | string | null>(null);
  readonly showAddStory = signal(false);
  readonly revealAnimation = signal(false);

  readonly isHost = computed(() => this.session()?.hostId === this.currentUser()?.uid);
  readonly currentStory = computed(() => this.stories().find(s => s.id === this.session()?.currentStoryId));
  readonly pendingStories = computed(() => this.stories().filter(s => s.status === 'pending'));
  readonly completedStories = computed(() => this.stories().filter(s => s.status === 'completed'));
  readonly myVote = computed(() => this.votes().find(v => v.userId === this.currentUser()?.uid));
  readonly hasVoted = computed(() => !!this.myVote());
  readonly votedCount = computed(() => this.votes().length);
  readonly participantCount = computed(() => this.session()?.participants.length ?? 0);

  constructor() {
    effect(() => {
      const story   = this.currentStory();
      const votes   = this.votes();
      const count   = this.participantCount();

      if (story?.status === 'revealed' && votes.length > 0) {
        this.voteResult.set(calculateVoteResult(votes, story.category));
        return;
      }

      if (story?.status === 'voting' && count > 0 && votes.length >= count && this.isHost()) {
        void this.revealVotes();
      }
    });
  }

  storyForm = this.fb.group({ title: [''], description: [''] });
  readonly storyCategory = signal<StoryCategory>('front');

  readonly cards = PLANNING_CARDS;
  readonly cardRarity = CARD_RARITY;
  readonly getVoteWeight = getVoteWeight;

  getCardSuit(card: number | string): string {
    return CARD_SUIT[this.cardRarity[card]] ?? '♦';
  }
  readonly storyCategories = STORY_CATEGORIES;
  readonly storyCategoryEntries = Object.entries(STORY_CATEGORIES) as [StoryCategory, typeof STORY_CATEGORIES[StoryCategory]][];

  private subs = new Subscription();
  private voteSub?: Subscription;
  private currentWatchedStoryId: string | null = null;

  getClassInfo(cls: string) { return (CHARACTER_CLASSES as Record<string, (typeof CHARACTER_CLASSES)[keyof typeof CHARACTER_CLASSES] | undefined>)[cls]; }
  getParticipantVote(uid: string): Vote | undefined { return this.votes().find(v => v.userId === uid); }

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('id')!;

    this.authService.currentUser$().pipe(take(1)).subscribe(authUser => {
      if (!authUser) return;
      this.userService.getProfile(authUser.uid).pipe(take(1)).subscribe(profile => {
        this.currentUser.set(profile ?? null);
      });
    });

    this.subs.add(
      this.sessionService.getSession(sessionId).subscribe(session => {
        this.session.set(session ?? null);
        this.loading.set(false);

        const storyId = session?.currentStoryId ?? null;
        if (storyId && storyId !== this.currentWatchedStoryId) {
          this.watchVotes(storyId);
        } else if (!storyId && this.currentWatchedStoryId) {
          this.currentWatchedStoryId = null;
          this.voteSub?.unsubscribe();
          this.votes.set([]);
          this.voteResult.set(null);
          this.selectedCard.set(null);
        }
      })
    );

    this.subs.add(
      this.sessionService.getStories(sessionId).subscribe(stories => {
        this.stories.set(stories);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.voteSub?.unsubscribe();
  }

  watchVotes(storyId: string): void {
    this.currentWatchedStoryId = storyId;
    this.voteSub?.unsubscribe();
    this.selectedCard.set(null);
    this.voteResult.set(null);
    this.voteSub = this.sessionService.getVotes(this.session()!.id, storyId).subscribe(votes => {
      this.votes.set(votes);
    });
  }

  async startVoting(storyId: string): Promise<void> {
    if (!this.isHost()) return;
    await this.sessionService.startVoting(this.session()!.id, storyId);
    this.notify.info('Votação iniciada!', 'Os participantes podem votar agora.');
  }

  async castVote(value: number | string): Promise<void> {
    const user = this.currentUser();
    const story = this.currentStory();
    if (!user || !story || this.submittingVote()) return;
    this.submittingVote.set(true);
    this.selectedCard.set(value);
    try {
      await this.sessionService.castVote(this.session()!.id, story.id, user, value);
      await this.userService.incrementStats(user.uid, { totalVotes: 1 });
      await this.userService.addXp(user.uid, 10);
    } finally {
      this.submittingVote.set(false);
    }
  }

  async revealVotes(): Promise<void> {
    const story = this.currentStory();
    if (!this.isHost() || !story) return;
    await this.sessionService.revealVotes(this.session()!.id, story.id);
    this.revealAnimation.set(true);
    setTimeout(() => this.revealAnimation.set(false), 1500);
    const result = calculateVoteResult(this.votes(), this.currentStory()?.category);
    this.voteResult.set(result);
    const user = this.currentUser();
    if (result.consensus && user) {
      await this.userService.incrementStats(user.uid, { perfectConsensus: 1 });
      await this.userService.addXp(user.uid, 50);
      this.notify.achievement('Consenso Perfeito!', '🎯', 50);
    }
  }

  async finalizeStory(estimate: number | string): Promise<void> {
    const story = this.currentStory();
    if (!this.isHost() || !story) return;
    await this.sessionService.finalizeStory(this.session()!.id, story.id, estimate);
    this.voteResult.set(null);
    this.votes.set([]);
    this.selectedCard.set(null);
    this.voteSub?.unsubscribe();
  }

  async addStory(): Promise<void> {
    const { title, description } = this.storyForm.value;
    const session = this.session();
    if (!title?.trim() || !session) return;
    await this.sessionService.addStory(session.id, title, description || undefined, this.storyCategory());
    this.storyForm.reset();
    this.showAddStory.set(false);
  }

  async completeSession(): Promise<void> {
    const session = this.session();
    if (!this.isHost() || !session) return;
    await this.sessionService.completeSession(session.id);
    this.notify.success('Sessão concluída!', 'Parabéns pela aventura!');
    this.router.navigate(['/dashboard']);
  }

  getDistributionEntries(): { value: string | number; count: number; percentage: number }[] {
    const result = this.voteResult();
    if (!result) return [];
    const total = this.votes().length;
    return Object.entries(result.distribution)
      .map(([v, c]) => ({ value: isNaN(Number(v)) ? v : Number(v), count: c, percentage: Math.round((c / total) * 100) }))
      .sort((a, b) => (typeof a.value === 'number' ? a.value : 999) - (typeof b.value === 'number' ? b.value : 999));
  }
}
