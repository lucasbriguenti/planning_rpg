export type SessionStatus = 'waiting' | 'active' | 'completed';

export interface Session {
  id: string;
  name: string;
  description?: string;
  hostId: string;
  hostName: string;
  participants: Participant[];
  status: SessionStatus;
  currentStoryId?: string;
  totalStories: number;
  completedStories: number;
  createdAt: Date;
  updatedAt: Date;
  inviteCode: string;
}

export interface Participant {
  uid: string;
  displayName: string;
  characterClass: string;
  characterIcon: string;
  isHost: boolean;
  joinedAt: Date;
  online: boolean;
}
