import type { PublicUser, Role } from '@choose-dish/contract';

export type { PublicUser } from '@choose-dish/contract';

export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
}

/** Carries the refresh token; only RefreshSession is allowed to decide where it goes. */
export interface TokenPair {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  role: Role;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  jti: string;
}
