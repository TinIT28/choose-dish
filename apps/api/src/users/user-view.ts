import type { PublicUser } from '@choose-dish/contract';
import type { User } from '@prisma/client';

/** The only account fields a client ever sees. Keeps `passwordHash` off the wire. */
export function toPublicUser(user: Pick<User, 'id' | 'email' | 'role' | 'timezone' | 'historyRetentionDays'>): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    timezone: user.timezone,
    historyRetentionDays: user.historyRetentionDays,
  };
}
