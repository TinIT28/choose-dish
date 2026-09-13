import type { Role } from '@prisma/client';

export interface PublicUser {
  id: string;
  email: string;
  role: Role | string;
  timezone: string;
  historyRetentionDays: number;
}

export type AuthUser = PublicUser;

export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export interface TokenPair {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  role: Role | string;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  jti: string;
}
