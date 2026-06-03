import { StoryCategory } from './story.model';

export interface Vote {
  id: string;
  sessionId: string;
  storyId: string;
  userId: string;
  userName: string;
  characterClass: string;
  value: number | string;
  createdAt: Date;
}

export interface VoteResult {
  storyId: string;
  votes: Vote[];
  average: number;
  min: number | string;
  max: number | string;
  consensus: boolean;
  distribution: Record<string | number, number>;
  isWeighted: boolean;
}

export function getVoteWeight(characterClass: string, category?: StoryCategory): number {
  if (characterClass === 'peasant')                               return 0.8;
  if (characterClass === 'paladin' || characterClass === 'archer') return 1.2;
  if (characterClass === 'warrior') return category === 'front' ? 1.2 : category === 'back' ? 0.8 : 1.0;
  if (characterClass === 'mage')    return category === 'back'  ? 1.2 : category === 'front' ? 0.8 : 1.0;
  return 1.0;
}

export function calculateVoteResult(votes: Vote[], category?: StoryCategory): Omit<VoteResult, 'storyId'> {
  const numericVotes = votes.filter(v => typeof v.value === 'number');
  const rawValues = numericVotes.map(v => v.value as number);

  const distribution: Record<string | number, number> = {};
  for (const vote of votes) {
    distribution[vote.value] = (distribution[vote.value] ?? 0) + 1;
  }

  if (rawValues.length === 0) {
    return { votes, average: 0, min: '?', max: '?', consensus: false, distribution, isWeighted: false };
  }

  const min = Math.min(...rawValues);
  const max = Math.max(...rawValues);
  const consensus = rawValues.every(v => v === rawValues[0]);
  const isWeighted = !!category;

  let average: number;
  if (isWeighted) {
    const weightedSum  = numericVotes.reduce((s, v) => s + (v.value as number) * getVoteWeight(v.characterClass, category), 0);
    const totalWeight  = numericVotes.reduce((s, v) => s + getVoteWeight(v.characterClass, category), 0);
    average = totalWeight > 0 ? weightedSum / totalWeight : 0;
  } else {
    average = rawValues.reduce((a, b) => a + b, 0) / rawValues.length;
  }

  return { votes, average, min, max, consensus, distribution, isWeighted };
}
