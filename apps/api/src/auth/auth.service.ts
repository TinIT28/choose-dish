import { createHash, randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role, type User } from '@prisma/client';
import * as argon2 from 'argon2';
import { AppConfig } from '../config/app-config';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from '../users/user-view';
import { REFRESH_TOKEN_TTL_MS } from './refresh-session';
import {
  type AccessTokenPayload,
  type PublicUser,
  type RefreshTokenPayload,
  type SessionMetadata,
  type TokenPair,
} from './auth.types';

const ACCESS_TOKEN_TTL = '15m';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashRefreshToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
  ) {}

  async register(email: string, password: string, metadata: SessionMetadata = {}): Promise<TokenPair> {
    const normalizedEmail = normalizeEmail(email);
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    let user: User | undefined;
    for (let attempt = 0; attempt < 3 && !user; attempt += 1) {
      try {
        user = await this.prisma.$transaction(
          async (transaction) => {
            const userCount = await transaction.user.count();
            return transaction.user.create({
              data: {
                email: normalizedEmail,
                passwordHash,
                role: userCount === 0 ? Role.ADMIN : Role.USER,
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if ((error as { code?: string }).code !== 'P2034' || attempt === 2) throw error;
      }
    }

    return this.createSession(user!, metadata);
  }

  async login(email: string, password: string, metadata: SessionMetadata = {}): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return this.createSession(user, metadata);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const now = new Date();
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= now) {
      throw new UnauthorizedException('Refresh token không còn hiệu lực');
    }

    const tokens = await this.signTokens(session.user, session.id);
    const rotation = await this.prisma.session.updateMany({
      where: { id: session.id, refreshTokenHash: hashRefreshToken(refreshToken), revokedAt: null, expiresAt: { gt: now } },
      data: { refreshTokenHash: hashRefreshToken(tokens.refreshToken), lastUsedAt: now, expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS) },
    });
    if (rotation.count !== 1) {
      await this.prisma.session.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: now } });
      throw new UnauthorizedException('Refresh token đã bị sử dụng lại');
    }

    return { user: toPublicUser(session.user), ...tokens };
  }

  async revokeRefreshToken(refreshToken: string) {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.prisma.session.updateMany({
        where: { id: payload.sid, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Logout is intentionally idempotent when the cookie is expired or malformed.
    }
  }

  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async verifyAccessToken(token: string): Promise<PublicUser> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, { secret: this.accessSecret });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('Tài khoản không tồn tại');
      }
      return toPublicUser(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Access token không hợp lệ');
    }
  }

  private get accessSecret() {
    return this.config.jwtAccessSecret;
  }

  private get refreshSecret() {
    return this.config.jwtRefreshSecret;
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  private async createSession(user: User, metadata: SessionMetadata): Promise<TokenPair> {
    const sessionId = randomUUID();
    const tokens = await this.signTokens(user, sessionId);
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: hashRefreshToken(tokens.refreshToken),
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
    return { user: toPublicUser(user), ...tokens };
  }

  private async signTokens(user: User, sessionId: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, sid: sessionId, role: user.role } satisfies AccessTokenPayload,
      { secret: this.accessSecret, expiresIn: ACCESS_TOKEN_TTL },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, sid: sessionId, jti: randomUUID() } satisfies RefreshTokenPayload,
      { secret: this.refreshSecret, expiresIn: REFRESH_TOKEN_TTL_MS / 1000 },
    );
    return { accessToken, refreshToken };
  }
}
