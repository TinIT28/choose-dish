import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CredentialsDto } from './auth.dto';
import { AuthGuard, SIGN_IN_REQUIRED, type AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { RefreshSession } from './refresh-session';

function sessionMetadata(request: Request) {
  return {
    userAgent: request.get('user-agent'),
    ipAddress: request.ip,
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshSession: RefreshSession,
  ) {}

  @Post('register')
  async register(@Body() body: CredentialsDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const tokens = await this.authService.register(body.email, body.password, sessionMetadata(request));
    return this.refreshSession.open(response, tokens);
  }

  @Post('login')
  async login(@Body() body: CredentialsDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const tokens = await this.authService.login(body.email, body.password, sessionMetadata(request));
    return this.refreshSession.open(response, tokens);
  }

  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = this.refreshSession.read(request);
    if (!refreshToken) {
      throw new UnauthorizedException(SIGN_IN_REQUIRED);
    }
    const tokens = await this.authService.refresh(refreshToken);
    return this.refreshSession.open(response, tokens);
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = this.refreshSession.read(request);
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }
    this.refreshSession.close(response);
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Post('logout-all')
  async logoutAll(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    await this.authService.logoutAll(request.user.id);
    this.refreshSession.close(response);
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return { user: request.user };
  }
}
