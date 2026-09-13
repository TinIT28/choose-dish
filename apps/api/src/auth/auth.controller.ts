import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CredentialsDto } from './auth.dto';
import { AuthGuard, type AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import type { TokenPair } from './auth.types';

const REFRESH_COOKIE_NAME = 'choose_dish_refresh';
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function sessionMetadata(request: Request) {
  return {
    userAgent: request.get('user-agent'),
    ipAddress: request.ip,
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: CredentialsDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const tokens = await this.authService.register(body.email, body.password, sessionMetadata(request));
    this.setRefreshCookie(response, tokens.refreshToken);
    return this.publicTokenResponse(tokens);
  }

  @Post('login')
  async login(@Body() body: CredentialsDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const tokens = await this.authService.login(body.email, body.password, sessionMetadata(request));
    this.setRefreshCookie(response, tokens.refreshToken);
    return this.publicTokenResponse(tokens);
  }

  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('Yêu cầu đăng nhập');
    }
    const tokens = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(response, tokens.refreshToken);
    return this.publicTokenResponse(tokens);
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }
    response.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Post('logout-all')
  async logoutAll(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    await this.authService.logoutAll(request.user.id);
    response.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return { user: request.user };
  }

  private publicTokenResponse(tokens: TokenPair) {
    return { user: tokens.user, accessToken: tokens.accessToken };
  }

  private setRefreshCookie(response: Response, token: string) {
    response.cookie(REFRESH_COOKIE_NAME, token, { ...this.cookieOptions(), maxAge: REFRESH_COOKIE_MAX_AGE });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
      path: '/api/v1/auth',
    };
  }
}
