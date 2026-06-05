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

  // Votos — tier difícil
  {
    id: 'hundred_votes',
    name: 'Centurião das Cartas',
    description: 'Realizou 100 votações',
    icon: '🎴',
    xpReward: 500,
    rarity: 'epic',
    condition: s => s.totalVotes >= 100,
  },
  {
    id: 'twofifty_votes',
    name: 'Lenda das Estimativas',
    description: 'Realizou 250 votações',
    icon: '🧙',
    xpReward: 1500,
    rarity: 'legendary',
    condition: s => s.totalVotes >= 250,
  },
  {
    id: 'fivehundred_votes',
    name: 'Imortal das Cartas',
    description: 'Realizou 500 votações',
    icon: '👑',
    xpReward: 3000,
    rarity: 'legendary',
    condition: s => s.totalVotes >= 500,
  },

  // Sessões — tier difícil
  {
    id: 'twentyfive_sessions',
    name: 'Veterano da Mesa',
    description: 'Participou de 25 sessões',
    icon: '🗡️',
    xpReward: 350,
    rarity: 'rare',
    condition: s => s.totalSessions >= 25,
  },
  {
    id: 'fifty_sessions',
    name: 'Senhor da Guilda',
    description: 'Participou de 50 sessões',
    icon: '🏰',
    xpReward: 750,
    rarity: 'epic',
    condition: s => s.totalSessions >= 50,
  },
  {
    id: 'hundred_sessions',
    name: 'Soberano das Plannings',
    description: 'Participou de 100 sessões',
    icon: '🐉',
    xpReward: 2000,
    rarity: 'legendary',
    condition: s => s.totalSessions >= 100,
  },

  // Consenso — tier difícil
  {
    id: 'ten_consensus',
    name: 'Mente Suprema',
    description: 'Alcançou 10 consensos perfeitos',
    icon: '💎',
    xpReward: 600,
    rarity: 'epic',
    condition: s => s.perfectConsensus >= 10,
  },
  {
    id: 'fifty_consensus',
    name: 'Profeta Eterno',
    description: 'Alcançou 50 consensos perfeitos',
    icon: '⚡',
    xpReward: 2500,
    rarity: 'legendary',
    condition: s => s.perfectConsensus >= 50,
  },
  {
    id: 'hundred_consensus',
    name: 'Divindade do Consenso',
    description: 'Alcançou 100 consensos perfeitos',
    icon: '🌠',
    xpReward: 5000,
    rarity: 'legendary',
    condition: s => s.perfectConsensus >= 100,
  },
];
