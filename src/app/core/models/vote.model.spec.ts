import { describe, it, expect } from 'vitest';
import { getVoteWeight, calculateVoteResult } from './vote.model';
import type { Vote } from './vote.model';

// ─── helpers ───────────────────────────────────────────────────────────────

function makeVote(overrides: Partial<Vote> & { value: number | string; characterClass: string }): Vote {
  return {
    id: 'v1', sessionId: 's1', storyId: 'st1',
    userId: 'u1', userName: 'Test', createdAt: new Date(),
    ...overrides,
  };
}

// ─── getVoteWeight ──────────────────────────────────────────────────────────

describe('getVoteWeight', () => {
  it('peasant sempre 0.8 independente da categoria', () => {
    expect(getVoteWeight('peasant')).toBe(0.8);
    expect(getVoteWeight('peasant', 'back')).toBe(0.8);
    expect(getVoteWeight('peasant', 'front')).toBe(0.8);
  });

  it('paladin sempre 1.2', () => {
    expect(getVoteWeight('paladin')).toBe(1.2);
    expect(getVoteWeight('paladin', 'back')).toBe(1.2);
    expect(getVoteWeight('paladin', 'front')).toBe(1.2);
  });

  it('archer sempre 1.2', () => {
    expect(getVoteWeight('archer')).toBe(1.2);
    expect(getVoteWeight('archer', 'back')).toBe(1.2);
    expect(getVoteWeight('archer', 'front')).toBe(1.2);
  });

  it('warrior: front 1.2, back 0.8, neutro 1.0', () => {
    expect(getVoteWeight('warrior', 'front')).toBe(1.2);
    expect(getVoteWeight('warrior', 'back')).toBe(0.8);
    expect(getVoteWeight('warrior')).toBe(1.0);
  });

  it('mage: back 1.2, front 0.8, neutro 1.0', () => {
    expect(getVoteWeight('mage', 'back')).toBe(1.2);
    expect(getVoteWeight('mage', 'front')).toBe(0.8);
    expect(getVoteWeight('mage')).toBe(1.0);
  });

  it('classe desconhecida → 1.0', () => {
    expect(getVoteWeight('unknown')).toBe(1.0);
    expect(getVoteWeight('unknown', 'back')).toBe(1.0);
  });
});

// ─── calculateVoteResult ────────────────────────────────────────────────────

describe('calculateVoteResult', () => {
  it('sem votos numéricos retorna zeros e marcadores de interrogação', () => {
    const votes = [makeVote({ value: '?', characterClass: 'warrior' })];
    const result = calculateVoteResult(votes);
    expect(result.average).toBe(0);
    expect(result.min).toBe('?');
    expect(result.max).toBe('?');
    expect(result.consensus).toBe(false);
    expect(result.isWeighted).toBe(false);
  });

  it('voto único: min = max = average', () => {
    const votes = [makeVote({ value: 5, characterClass: 'warrior' })];
    const result = calculateVoteResult(votes);
    expect(result.min).toBe(5);
    expect(result.max).toBe(5);
    expect(result.average).toBe(5);
  });

  it('todos iguais → consensus = true', () => {
    const votes = [
      makeVote({ value: 3, characterClass: 'warrior', id: 'v1', userId: 'u1' }),
      makeVote({ value: 3, characterClass: 'mage',    id: 'v2', userId: 'u2' }),
    ];
    expect(calculateVoteResult(votes).consensus).toBe(true);
  });

  it('valores diferentes → consensus = false', () => {
    const votes = [
      makeVote({ value: 3, characterClass: 'warrior', id: 'v1', userId: 'u1' }),
      makeVote({ value: 5, characterClass: 'mage',    id: 'v2', userId: 'u2' }),
    ];
    expect(calculateVoteResult(votes).consensus).toBe(false);
  });

  it('sem categoria → média simples, isWeighted = false', () => {
    const votes = [
      makeVote({ value: 2, characterClass: 'warrior', id: 'v1', userId: 'u1' }),
      makeVote({ value: 4, characterClass: 'mage',    id: 'v2', userId: 'u2' }),
    ];
    const result = calculateVoteResult(votes);
    expect(result.average).toBe(3);
    expect(result.isWeighted).toBe(false);
  });

  it('com categoria back → média ponderada, isWeighted = true', () => {
    // warrior back: peso 0.8 | mage back: peso 1.2
    const votes = [
      makeVote({ value: 4, characterClass: 'warrior', id: 'v1', userId: 'u1' }),
      makeVote({ value: 4, characterClass: 'mage',    id: 'v2', userId: 'u2' }),
    ];
    const result = calculateVoteResult(votes, 'back');
    expect(result.isWeighted).toBe(true);
    // weightedSum = 4*0.8 + 4*1.2 = 3.2 + 4.8 = 8.0 | totalWeight = 0.8+1.2 = 2.0
    expect(result.average).toBeCloseTo(4.0);
  });

  it('com categoria back → mage recebe mais peso que warrior', () => {
    const votes = [
      makeVote({ value: 2, characterClass: 'warrior', id: 'v1', userId: 'u1' }),
      makeVote({ value: 8, characterClass: 'mage',    id: 'v2', userId: 'u2' }),
    ];
    const simple   = calculateVoteResult(votes);
    const weighted = calculateVoteResult(votes, 'back');
    // média simples = 5; média ponderada deve ser > 5 (mage tem mais peso no back)
    expect(weighted.average).toBeGreaterThan(simple.average);
  });

  it('distribuição conta corretamente', () => {
    const votes = [
      makeVote({ value: 3, characterClass: 'warrior', id: 'v1', userId: 'u1' }),
      makeVote({ value: 3, characterClass: 'mage',    id: 'v2', userId: 'u2' }),
      makeVote({ value: 5, characterClass: 'archer',  id: 'v3', userId: 'u3' }),
    ];
    const { distribution } = calculateVoteResult(votes);
    expect(distribution[3]).toBe(2);
    expect(distribution[5]).toBe(1);
  });

  it('votos especiais (? e ☕) são ignorados no cálculo mas contam na distribuição', () => {
    const votes = [
      makeVote({ value: 5,   characterClass: 'warrior', id: 'v1', userId: 'u1' }),
      makeVote({ value: '?', characterClass: 'mage',    id: 'v2', userId: 'u2' }),
      makeVote({ value: '☕', characterClass: 'archer', id: 'v3', userId: 'u3' }),
    ];
    const result = calculateVoteResult(votes);
    expect(result.average).toBe(5);
    expect(result.min).toBe(5);
    expect(result.max).toBe(5);
    expect(result.distribution['?']).toBe(1);
    expect(result.distribution['☕']).toBe(1);
  });
});
