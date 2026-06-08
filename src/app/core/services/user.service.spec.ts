import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...parts: unknown[]) => parts),
  setDoc: vi.fn(async () => undefined),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  deleteDoc: vi.fn(async () => undefined),
}));

import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { UserService } from './user.service';
import type { UserProfile } from '../models/user.model';

describe('UserService account deletion helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('remove dados privados e perfil do usuário', async () => {
    const fakeDb = {};
    const serviceLike = { db: fakeDb } as UserService;

    await UserService.prototype.deleteUserData.call(serviceLike, 'uid-123');

    expect(doc).toHaveBeenNthCalledWith(1, fakeDb, 'users', 'uid-123', 'private', 'azure');
    expect(doc).toHaveBeenNthCalledWith(2, fakeDb, 'users', 'uid-123');
    expect(deleteDoc).toHaveBeenCalledTimes(2);
  });

  it('restaura perfil e configuração do Azure após falha na exclusão da conta', async () => {
    const fakeDb = {};
    const serviceLike = { db: fakeDb } as UserService;
    const profile: UserProfile = {
      uid: 'uid-123',
      displayName: 'Lucas',
      email: 'lucas@email.com',
      characterClass: 'warrior',
      xp: 10,
      level: 1,
      totalVotes: 2,
      totalSessions: 1,
      perfectConsensus: 0,
      achievements: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const azure = { pat: 'pat', organization: 'org', project: 'proj' };

    await UserService.prototype.restoreDeletedUserData.call(serviceLike, 'uid-123', profile, azure);

    expect(setDoc).toHaveBeenNthCalledWith(1, [fakeDb, 'users', 'uid-123'], profile);
    expect(setDoc).toHaveBeenNthCalledWith(2, [fakeDb, 'users', 'uid-123', 'private', 'azure'], {
      ...azure,
      updatedAt: expect.any(Date),
    });
  });
});
