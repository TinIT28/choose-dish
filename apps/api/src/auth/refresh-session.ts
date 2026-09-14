import { Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AppConfig } from '../config/app-config';
import type { PublicUser, TokenPair } from './auth.types';

export const REFRESH_COOKIE_NAME = 'choose_dish_refresh';

/** How long a refresh session lives. The only place this duration is written. */
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface PublicTokenResponse {
  user: PublicUser;
  accessToken: string;
}

/**
 * Owns how a refresh session travels: the cookie name, its attributes, its
 * lifetime, and the fact that the refresh token itself never reaches the
 * response body. Callers hand over a TokenPair and get back what the client
 * may see.
 */
@Injectable()
export class RefreshSession {
  constructor(private readonly config: AppConfig) {}

  read(request: Request): string | undefined {
    return request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  }

  open(response: Response, tokens: TokenPair): PublicTokenResponse {
    response.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, { ...this.cookieOptions(), maxAge: REFRESH_TOKEN_TTL_MS });
    return { user: tokens.user, accessToken: tokens.accessToken };
  }

  close(response: Response) {
    response.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.isProductionLike,
      // Only a production deployment serves the web app from another origin.
      sameSite: this.config.isProduction ? 'none' : 'lax',
      path: `/${this.config.apiPrefix}/auth`,
    };
  }
}
