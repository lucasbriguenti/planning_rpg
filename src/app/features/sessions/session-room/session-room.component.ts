import { Component, OnInit, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subscription, take } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { SessionService } from '../../../core/services/session.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AzureService } from '../../../core/services/azure.service';
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
  private readonly azureService = inject(AzureService);
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

  readonly azureConfig = signal<{ pat: string; organization: string; project: string } | null>(null);
  readonly showAzureModal  = signal(false);
  readonly syncingAzure    = signal(false);
  readonly azureUsNumber = signal('');
  readonly loadingUs = signal(false);

  readonly viewingCompletedStory = signal<Story | null>(null);
  readonly viewingVotes = signal<Vote[]>([]);
  readonly viewingVoteResult = signal<Omit<VoteResult, 'storyId'> | null>(null);

  readonly editingStoryId = signal<string | null>(null);
  readonly editTitle = signal('');
  readonly editCategory = signal<StoryCategory | undefined>(undefined);
  readonly openMenuStoryId = signal<string | null>(null);

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
  private viewingSub?: Subscription;
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
      this.userService.getAzureConfig(authUser.uid).then(cfg => this.azureConfig.set(cfg));
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
    this.viewingSub?.unsubscribe();
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

  selectStory(story: Story): void {
    if (story.id === this.session()?.currentStoryId) return;

    if (this.isHost() && story.status !== 'completed') {
      void this.startVoting(story.id);
      return;
    }

    // host ou participante: toggle view dos votos de histórias concluídas
    if (this.viewingCompletedStory()?.id === story.id) {
      this.closeCompletedView();
      return;
    }

    this.viewingCompletedStory.set(story);
    this.viewingSub?.unsubscribe();
    this.viewingSub = this.sessionService
      .getVotes(this.session()!.id, story.id)
      .subscribe(votes => {
        this.viewingVotes.set(votes);
        if (votes.length > 0) {
          this.viewingVoteResult.set(calculateVoteResult(votes, story.category));
        }
      });
  }

  closeCompletedView(): void {
    this.viewingCompletedStory.set(null);
    this.viewingVotes.set([]);
    this.viewingVoteResult.set(null);
    this.viewingSub?.unsubscribe();
  }

  async startVoting(storyId: string): Promise<void> {
    if (!this.isHost()) return;
    this.closeCompletedView();
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

    const completedStory = { ...story, status: 'completed' as const, finalEstimate: estimate };
    this.viewingCompletedStory.set(completedStory);
    this.viewingVotes.set(this.votes());
    this.viewingVoteResult.set(this.voteResult());

    this.voteResult.set(null);
    this.votes.set([]);
    this.selectedCard.set(null);
    this.voteSub?.unsubscribe();
  }

  async importFromAzure(): Promise<void> {
    const cfg     = this.azureConfig();
    const session = this.session();
    const idStr   = this.azureUsNumber().trim();
    const id      = parseInt(idStr, 10);
    if (!cfg || !session || !idStr || isNaN(id) || this.loadingUs()) return;

    this.loadingUs.set(true);
    try {
      const tasks = await this.azureService.getChildTasks(cfg.organization, cfg.project, cfg.pat, id);

      if (tasks.length === 0) {
        this.notify.info('Nenhuma task encontrada', `US #${id} não possui atividades filhas.`);
        return;
      }

      await Promise.all(
        tasks.map(task => {
          const title = `${task.id} - ${task.title}`;
          const category = this.detectCategory(task.title);
          return this.sessionService.addStory(session.id, title, undefined, category, task.id);
        })
      );

      this.notify.success('Tasks importadas!', `${tasks.length} atividade(s) da US #${id} adicionadas.`);
      this.showAzureModal.set(false);
      this.azureUsNumber.set('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível buscar a US.';
      this.notify.error('Erro ao buscar US', msg);
    } finally {
      this.loadingUs.set(false);
    }
  }

  async addStory(): Promise<void> {
    const { title, description } = this.storyForm.value;
    const session = this.session();
    if (!title?.trim() || !session) return;
    await this.sessionService.addStory(session.id, title, description || undefined, this.storyCategory());
    this.storyForm.reset();
    this.showAddStory.set(false);
  }

  toggleStoryMenu(storyId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuStoryId.set(this.openMenuStoryId() === storyId ? null : storyId);
  }

  startEditStory(story: Story, event: Event): void {
    event.stopPropagation();
    this.openMenuStoryId.set(null);
    this.editingStoryId.set(story.id);
    this.editTitle.set(story.title);
    this.editCategory.set(story.category);
  }

  cancelEditStory(event: Event): void {
    event.stopPropagation();
    this.editingStoryId.set(null);
  }

  async saveEditStory(storyId: string, event: Event): Promise<void> {
    event.stopPropagation();
    const title = this.editTitle().trim();
    if (!title || !this.session()) return;
    await this.sessionService.updateStory(this.session()!.id, storyId, {
      title,
      category: this.editCategory() ?? null,
    });
    this.editingStoryId.set(null);
  }

  async deleteAllStories(): Promise<void> {
    const session = this.session();
    if (!this.isHost() || !session || this.stories().length === 0) return;
    await this.sessionService.deleteAllStories(session.id);
    this.closeCompletedView();
    this.votes.set([]);
    this.voteResult.set(null);
    this.selectedCard.set(null);
  }

  async deleteStory(story: Story, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    const session = this.session();
    if (!this.isHost() || !session) return;
    if (story.id === session.currentStoryId) return;
    await this.sessionService.deleteStory(session.id, story.id);
    if (this.viewingCompletedStory()?.id === story.id) this.closeCompletedView();
  }

  async completeSession(): Promise<void> {
    const session = this.session();
    if (!this.isHost() || !session) return;
    await this.sessionService.completeSession(session.id);
    this.notify.success('Sessão concluída!', 'Parabéns pela aventura!');
    this.router.navigate(['/dashboard']);
  }

  async syncToAzure(): Promise<void> {
    const story = this.viewingCompletedStory();
    const cfg   = this.azureConfig();
    if (!story?.azureWorkItemId || !cfg || this.syncingAzure()) return;

    const estimate = Number(story.finalEstimate);
    if (isNaN(estimate)) {
      this.notify.error('Sincronização inválida', 'A estimativa final não é um número válido para o Azure.');
      return;
    }

    this.syncingAzure.set(true);
    try {
      await this.azureService.updateWorkItemEstimate(cfg.organization, cfg.project, cfg.pat, story.azureWorkItemId, estimate);
      this.notify.success('Azure sincronizado!', `Work item #${story.azureWorkItemId} atualizado com ${estimate}h.`);
    } catch (err) {
      this.notify.error('Erro ao sincronizar', err instanceof Error ? err.message : 'Falha na requisição.');
    } finally {
      this.syncingAzure.set(false);
    }
  }

  private detectCategory(title: string): StoryCategory | undefined {
    const lower = title.toLowerCase();
    const backIdx = lower.search(/\bback\b/);
    const frontIdx = lower.search(/\bfront\b/);
    if (backIdx === -1 && frontIdx === -1) return undefined;
    if (backIdx === -1) return 'front';
    if (frontIdx === -1) return 'back';
    return backIdx < frontIdx ? 'back' : 'front';
  }

  getDistributionEntries(): { value: string | number; count: number; percentage: number }[] {
    return this.buildDistribution(this.voteResult(), this.votes().length);
  }

  getViewingDistributionEntries(): { value: string | number; count: number; percentage: number }[] {
    return this.buildDistribution(this.viewingVoteResult(), this.viewingVotes().length);
  }

  private buildDistribution(
    result: Omit<VoteResult, 'storyId'> | null,
    total: number,
  ): { value: string | number; count: number; percentage: number }[] {
    if (!result) return [];
    return Object.entries(result.distribution)
      .map(([v, c]) => ({ value: isNaN(Number(v)) ? v : Number(v), count: c, percentage: Math.round((c / total) * 100) }))
      .sort((a, b) => (typeof a.value === 'number' ? a.value : 999) - (typeof b.value === 'number' ? b.value : 999));
  }
}
