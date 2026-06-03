export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  condition: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalVotes: number;
  totalSessions: number;
  perfectConsensus: number;
  consecutiveSessions: number;
  firstVote: boolean;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_vote',
    name: 'Primeira Pedra',
    description: 'Realizou sua primeira votação',
    icon: '🗳️',
    xpReward: 50,
    rarity: 'common',
    condition: s => s.totalVotes >= 1,
  },
  {
    id: 'ten_votes',
    name: 'Estimador Veterano',
    description: 'Realizou 10 votações',
    icon: '🏆',
    xpReward: 100,
    rarity: 'uncommon',
    condition: s => s.totalVotes >= 10,
  },
  {
    id: 'fifty_votes',
    name: 'Mestre das Cartas',
    description: 'Realizou 50 votações',
    icon: '🃏',
    xpReward: 250,
    rarity: 'rare',
    condition: s => s.totalVotes >= 50,
  },
  {
    id: 'first_session',
    name: 'Aventureiro',
    description: 'Participou de sua primeira sessão',
    icon: '⚔️',
    xpReward: 75,
    rarity: 'common',
    condition: s => s.totalSessions >= 1,
  },
  {
    id: 'ten_sessions',
    name: 'Companheiro de Guilda',
    description: 'Participou de 10 sessões',
    icon: '🛡️',
    xpReward: 200,
    rarity: 'uncommon',
    condition: s => s.totalSessions >= 10,
  },
  {
    id: 'first_consensus',
    name: 'Mente Coletiva',
    description: 'Alcançou consenso perfeito em uma votação',
    icon: '🔮',
    xpReward: 150,
    rarity: 'rare',
    condition: s => s.perfectConsensus >= 1,
  },
  {
    id: 'five_consensus',
    name: 'Oráculo da Equipe',
    description: 'Alcançou 5 consensos perfeitos',
    icon: '✨',
    xpReward: 400,
    rarity: 'epic',
    condition: s => s.perfectConsensus >= 5,
  },
  {
    id: 'twenty_consensus',
    name: 'Lenda Viva',
    description: 'Alcançou 20 consensos perfeitos',
    icon: '🌟',
    xpReward: 1000,
    rarity: 'legendary',
    condition: s => s.perfectConsensus >= 20,
  },
];
