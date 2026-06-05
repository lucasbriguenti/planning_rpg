import { describe, it, expect } from 'vitest';
import { xpForLevel, levelFromXp, xpProgressInLevel, getLevelTitle } from './user.model';

describe('xpForLevel', () => {
  it('nível 1 requer 100 XP', () => expect(xpForLevel(1)).toBe(100));
  it('nível 2 requer 150 XP', () => expect(xpForLevel(2)).toBe(150));
  it('nível 3 requer 225 XP', () => expect(xpForLevel(3)).toBe(225));
  it('cresce exponencialmente a cada nível', () => {
    expect(xpForLevel(4)).toBeGreaterThan(xpForLevel(3));
    expect(xpForLevel(5)).toBeGreaterThan(xpForLevel(4));
  });
});

describe('levelFromXp', () => {
  it('0 XP → nível 1', () => expect(levelFromXp(0)).toBe(1));
  it('99 XP → nível 1 (abaixo do limiar)', () => expect(levelFromXp(99)).toBe(1));
  it('100 XP → nível 2 (exatamente no limiar)', () => expect(levelFromXp(100)).toBe(2));
  it('249 XP → nível 2', () => expect(levelFromXp(249)).toBe(2));
  it('250 XP → nível 3', () => expect(levelFromXp(250)).toBe(3));
  it('XP muito alto → nível 10+', () => expect(levelFromXp(999999)).toBeGreaterThanOrEqual(10));
  it('é inverso de xpForLevel: acumular XP de cada nível sobe o nível correto', () => {
    const xpToLevel3 = xpForLevel(1) + xpForLevel(2); // 100 + 150 = 250
    expect(levelFromXp(xpToLevel3)).toBe(3);
  });
});

describe('xpProgressInLevel', () => {
  it('0 XP: sem progresso no nível 1', () => {
    const p = xpProgressInLevel(0);
    expect(p.current).toBe(0);
    expect(p.required).toBe(100);
    expect(p.percentage).toBe(0);
  });

  it('50 XP: 50% do nível 1', () => {
    const p = xpProgressInLevel(50);
    expect(p.current).toBe(50);
    expect(p.required).toBe(100);
    expect(p.percentage).toBe(50);
  });

  it('100 XP: início do nível 2 (0% de progresso)', () => {
    const p = xpProgressInLevel(100);
    expect(p.current).toBe(0);
    expect(p.required).toBe(150);
    expect(p.percentage).toBe(0);
  });

  it('175 XP: 50% do nível 2', () => {
    const p = xpProgressInLevel(175);
    expect(p.current).toBe(75);
    expect(p.required).toBe(150);
    expect(p.percentage).toBe(50);
  });

  it('percentage nunca excede 100', () => {
    const p = xpProgressInLevel(xpForLevel(1) - 1);
    expect(p.percentage).toBeLessThanOrEqual(100);
  });
});

describe('getLevelTitle', () => {
  it('nível 1 → Iniciante', () => expect(getLevelTitle(1)).toBe('Iniciante'));
  it('nível 5 → Especialista', () => expect(getLevelTitle(5)).toBe('Especialista'));
  it('nível 10 → Imortal', () => expect(getLevelTitle(10)).toBe('Imortal'));
  it('nível acima de 10 → Imortal (capped)', () => expect(getLevelTitle(99)).toBe('Imortal'));
});
