import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS } from './achievement.model';
import type { AchievementStats } from './achievement.model';

function stats(overrides: Partial<AchievementStats> = {}): AchievementStats {
  return { totalVotes: 0, totalSessions: 0, perfectConsensus: 0, consecutiveSessions: 0, firstVote: false, ...overrides };
}

function find(id: string) {
  const a = ACHIEVEMENTS.find(a => a.id === id);
  if (!a) throw new Error(`Achievement "${id}" não encontrado`);
  return a;
}

describe('conquistas de votos', () => {
  it('first_vote: desbloqueia com 1 voto', () => {
    const a = find('first_vote');
    expect(a.condition(stats({ totalVotes: 0 }))).toBe(false);
    expect(a.condition(stats({ totalVotes: 1 }))).toBe(true);
  });

  it('ten_votes: desbloqueia com 10 votos', () => {
    const a = find('ten_votes');
    expect(a.condition(stats({ totalVotes: 9 }))).toBe(false);
    expect(a.condition(stats({ totalVotes: 10 }))).toBe(true);
  });

  it('fifty_votes: desbloqueia com 50 votos', () => {
    const a = find('fifty_votes');
    expect(a.condition(stats({ totalVotes: 49 }))).toBe(false);
    expect(a.condition(stats({ totalVotes: 50 }))).toBe(true);
  });

  it('hundred_votes: desbloqueia com 100 votos', () => {
    const a = find('hundred_votes');
    expect(a.condition(stats({ totalVotes: 99 }))).toBe(false);
    expect(a.condition(stats({ totalVotes: 100 }))).toBe(true);
  });

  it('twofifty_votes: desbloqueia com 250 votos', () => {
    const a = find('twofifty_votes');
    expect(a.condition(stats({ totalVotes: 249 }))).toBe(false);
    expect(a.condition(stats({ totalVotes: 250 }))).toBe(true);
  });

  it('fivehundred_votes: desbloqueia com 500 votos', () => {
    const a = find('fivehundred_votes');
    expect(a.condition(stats({ totalVotes: 499 }))).toBe(false);
    expect(a.condition(stats({ totalVotes: 500 }))).toBe(true);
  });
});

describe('conquistas de sessões', () => {
  it('first_session: desbloqueia com 1 sessão', () => {
    const a = find('first_session');
    expect(a.condition(stats({ totalSessions: 0 }))).toBe(false);
    expect(a.condition(stats({ totalSessions: 1 }))).toBe(true);
  });

  it('ten_sessions: desbloqueia com 10 sessões', () => {
    const a = find('ten_sessions');
    expect(a.condition(stats({ totalSessions: 9 }))).toBe(false);
    expect(a.condition(stats({ totalSessions: 10 }))).toBe(true);
  });

  it('twentyfive_sessions: desbloqueia com 25 sessões', () => {
    const a = find('twentyfive_sessions');
    expect(a.condition(stats({ totalSessions: 24 }))).toBe(false);
    expect(a.condition(stats({ totalSessions: 25 }))).toBe(true);
  });

  it('fifty_sessions: desbloqueia com 50 sessões', () => {
    const a = find('fifty_sessions');
    expect(a.condition(stats({ totalSessions: 49 }))).toBe(false);
    expect(a.condition(stats({ totalSessions: 50 }))).toBe(true);
  });

  it('hundred_sessions: desbloqueia com 100 sessões', () => {
    const a = find('hundred_sessions');
    expect(a.condition(stats({ totalSessions: 99 }))).toBe(false);
    expect(a.condition(stats({ totalSessions: 100 }))).toBe(true);
  });
});

describe('conquistas de consenso', () => {
  it('first_consensus: desbloqueia com 1 consenso', () => {
    const a = find('first_consensus');
    expect(a.condition(stats({ perfectConsensus: 0 }))).toBe(false);
    expect(a.condition(stats({ perfectConsensus: 1 }))).toBe(true);
  });

  it('five_consensus: desbloqueia com 5 consensos', () => {
    const a = find('five_consensus');
    expect(a.condition(stats({ perfectConsensus: 4 }))).toBe(false);
    expect(a.condition(stats({ perfectConsensus: 5 }))).toBe(true);
  });

  it('ten_consensus: desbloqueia com 10 consensos', () => {
    const a = find('ten_consensus');
    expect(a.condition(stats({ perfectConsensus: 9 }))).toBe(false);
    expect(a.condition(stats({ perfectConsensus: 10 }))).toBe(true);
  });

  it('twenty_consensus: desbloqueia com 20 consensos', () => {
    const a = find('twenty_consensus');
    expect(a.condition(stats({ perfectConsensus: 19 }))).toBe(false);
    expect(a.condition(stats({ perfectConsensus: 20 }))).toBe(true);
  });

  it('fifty_consensus: desbloqueia com 50 consensos', () => {
    const a = find('fifty_consensus');
    expect(a.condition(stats({ perfectConsensus: 49 }))).toBe(false);
    expect(a.condition(stats({ perfectConsensus: 50 }))).toBe(true);
  });

  it('hundred_consensus: desbloqueia com 100 consensos', () => {
    const a = find('hundred_consensus');
    expect(a.condition(stats({ perfectConsensus: 99 }))).toBe(false);
    expect(a.condition(stats({ perfectConsensus: 100 }))).toBe(true);
  });
});

describe('raridade e XP das conquistas', () => {
  it('todas as conquistas têm id, nome, ícone e xpReward > 0', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.icon).toBeTruthy();
      expect(a.xpReward).toBeGreaterThan(0);
    }
  });

  it('conquistas legendary têm xpReward >= 1000', () => {
    const legendaries = ACHIEVEMENTS.filter(a => a.rarity === 'legendary');
    expect(legendaries.length).toBeGreaterThan(0);
    for (const a of legendaries) {
      expect(a.xpReward).toBeGreaterThanOrEqual(1000);
    }
  });

  it('conquistas mais difíceis têm mais XP que as mais fáceis do mesmo eixo', () => {
    const first = find('first_vote').xpReward;
    const mid   = find('fifty_votes').xpReward;
    const hard  = find('fivehundred_votes').xpReward;
    expect(mid).toBeGreaterThan(first);
    expect(hard).toBeGreaterThan(mid);
  });

  it('não há ids duplicados', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
