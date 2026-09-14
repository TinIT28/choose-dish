import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { PublicUser, UserSessionView, UserSettingsInput } from '@choose-dish/contract';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isValidTimezone } from '../selections/local-date';
import { toPublicUser } from './user-view';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? toPublicUser(user) : null;
  }

  async updateSettings(userId: string, settings: UserSettingsInput): Promise<PublicUser> {
    if (!isValidTimezone(settings.timezone)) {
      throw new BadRequestException('Múi giờ IANA không hợp lệ');
    }
    if (![7, 30, 90, 365].includes(settings.historyRetentionDays)) {
      throw new BadRequestException('Thời gian lưu lịch sử phải là 7, 30, 90 hoặc 365 ngày');
    }
    const updated = await this.prisma.user.update({ where: { id: userId }, data: settings });
    return toPublicUser(updated);
  }

  async listSessions(userId: string): Promise<UserSessionView[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      select: { id: true, userAgent: true, ipAddress: true, lastUsedAt: true, expiresAt: true, createdAt: true },
      orderBy: { lastUsedAt: 'desc' },
    });
    return sessions.map((session) => ({
      ...session,
      lastUsedAt: session.lastUsedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
    }));
  }

  revokeSession(userId: string, sessionId: string) {
    return this.prisma.session.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }
    if (user.role === Role.ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) {
        throw new ConflictException('Admin cuối cùng không thể xóa tài khoản');
      }
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.selection.deleteMany({ where: { userId } });
      await transaction.personalExclusion.deleteMany({ where: { userId } });
      await transaction.dish.deleteMany({ where: { ownerId: userId, scope: 'PRIVATE' } });
      await transaction.session.deleteMany({ where: { userId } });
      return transaction.user.delete({ where: { id: userId } });
    });
  }
}
