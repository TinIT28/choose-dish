export const queryKeys = {
  dishes: {
    private: (userId: string) => ['dishes', 'private', userId] as const,
    shared: (userId: string) => ['dishes', 'shared', userId] as const,
  },
  selections: {
    today: (userId: string) => ['selections', 'today', userId] as const,
  },
  history: (userId: string) => ['history', userId] as const,
  sessions: (userId: string) => ['sessions', userId] as const,
  adminUsers: (adminId: string) => ['admin', 'users', adminId] as const,
} as const;
