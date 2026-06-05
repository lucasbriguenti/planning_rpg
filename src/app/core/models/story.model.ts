export type StoryStatus = 'pending' | 'voting' | 'revealed' | 'completed';
export type StoryCategory = 'back' | 'front';

export const STORY_CATEGORIES: Record<StoryCategory, { label: string; icon: string; color: string }> = {
  back:  { label: 'Back-end',  icon: '⚙️',  color: '#9b59b6' },
  front: { label: 'Front-end', icon: '🎨',  color: '#3498db' },
};

export interface Story {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  category?: StoryCategory;
  status: StoryStatus;
  finalEstimate?: number | string;
  averageEstimate?: number;
  order: number;
  azureWorkItemId?: number;
  votingStartedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export const PLANNING_CARDS: (number | string)[] = [
  0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6,
  6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12,
  '?', '☕',
];

export const CARD_RARITY: Record<string | number, string> = {
  0.5: 'common',   1: 'common',   1.5: 'common',   2: 'common',   2.5: 'common',   3: 'common',
  3.5: 'uncommon', 4: 'uncommon', 4.5: 'uncommon', 5: 'uncommon', 5.5: 'uncommon', 6: 'uncommon',
  6.5: 'rare',     7: 'rare',     7.5: 'rare',     8: 'rare',     8.5: 'rare',     9: 'rare',
  9.5: 'epic',    10: 'epic',    10.5: 'epic',    11: 'epic',
  11.5: 'legendary', 12: 'legendary',
  '?': 'special', '☕': 'special',
};

export const CARD_SUIT: Record<string, string> = {
  common: '♣', uncommon: '♦', rare: '♥', epic: '♠', legendary: '★', special: '✦',
};
