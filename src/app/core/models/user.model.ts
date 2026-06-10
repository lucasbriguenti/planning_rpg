export type CharacterClass = 'warrior' | 'mage' | 'archer' | 'paladin' | 'peasant';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  characterClass: CharacterClass;
  xp: number;
  level: number;
  totalVotes: number;
  totalSessions: number;
  perfectConsensus: number;
  achievements: Achievement[];
  profileSetupCompleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const CHARACTER_CLASSES: Record<CharacterClass, { name: string; icon: string; description: string; color: string }> = {
  warrior: { name: 'Guerreiro da Luz',      icon: '⚡', description: 'Domina telas e reatividade',    color: '#dd1b16' },
  mage:    { name: 'Mago das Sombras',     icon: '🔷', description: 'Conjura APIs e regras de negócio',    color: '#9b59b6' },
  archer:  { name: 'Arqueiro FullStack',   icon: '🎯', description: 'Atinge front e back com precisão',    color: '#27ae60' },
  paladin: { name: 'Mestre Tech Lead',     icon: '👑', description: 'Guia a equipe com visão técnica',     color: '#f39c12' },
  peasant: { name: 'Pequeno Camponês',     icon: '🌾', description: 'Iniciante em sua jornada de dev',     color: '#95a5a6' },
};

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function levelFromXp(xp: number): number {
  let level = 1;
  let required = 0;
  while (required + xpForLevel(level) <= xp) {
    required += xpForLevel(level);
    level++;
  }
  return level;
}

export function xpProgressInLevel(xp: number): { current: number; required: number; percentage: number } {
  let level = 1;
  let consumed = 0;
  while (consumed + xpForLevel(level) <= xp) {
    consumed += xpForLevel(level);
    level++;
  }
  const current = xp - consumed;
  const required = xpForLevel(level);
  return { current, required, percentage: Math.floor((current / required) * 100) };
}

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Iniciante',
  2: 'Aprendiz',
  3: 'Aventureiro',
  4: 'Veterano',
  5: 'Especialista',
  6: 'Mestre',
  7: 'Gran Mestre',
  8: 'Lendário',
  9: 'Mítico',
  10: 'Imortal',
};

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, 10)] ?? 'Imortal';
}
