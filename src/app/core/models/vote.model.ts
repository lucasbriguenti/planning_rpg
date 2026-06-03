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
}

export function calculateVoteResult(votes: Vote[]): Omit<VoteResult, 'storyId'> {
  const numericVotes = votes.filter(v => typeof v.value === 'number').map(v => v.value as number);

  const distribution: Record<string | number, number> = {};
  for (const vote of votes) {
    distribution[vote.value] = (distribution[vote.value] ?? 0) + 1;
  }

  if (numericVotes.length === 0) {
    return { votes, average: 0, min: '?', max: '?', consensus: false, distribution };
  }

  const average = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
  const min = Math.min(...numericVotes);
  const max = Math.max(...numericVotes);
  const consensus = numericVotes.every(v => v === numericVotes[0]);

  return { votes, average, min, max, consensus, distribution };
}
