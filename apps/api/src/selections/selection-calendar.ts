import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { recentLocalDates, shiftLocalDate, toLocalDate, type LocalDate } from './local-date';

/** The no-repeat window: dishes chosen inside it are skipped when picking again. */
export const NO_REPEAT_WINDOW_DAYS = 7;

export interface UserCalendar {
  userId: string;
  timezone: string;
  /** The calendar date the user is currently in. */
  today: LocalDate;
  /** The dates the no-repeat window covers, newest first, including today. */
  noRepeatWindow: LocalDate[];
  /** The oldest local date still inside the user's history retention. */
  retentionCutoff: LocalDate;
}

interface CalendarSource {
  id: string;
  timezone: string;
  historyRetentionDays: number;
}

function calendarFor(user: CalendarSource, now: Date): UserCalendar {
  const today = toLocalDate(now, user.timezone);
  return {
    userId: user.id,
    timezone: user.timezone,
    today,
    noRepeatWindow: recentLocalDates(today, NO_REPEAT_WINDOW_DAYS),
    // "Records older than the configured period are removed" — a selection exactly
    // `historyRetentionDays` local days old is not older than the period, so it stays.
    retentionCutoff: shiftLocalDate(today, -user.historyRetentionDays),
  };
}

/**
 * Resolves every date decision from the timezone of the account it belongs to.
 *
 * History and retention used to compute a cutoff as `now - days` in
 * milliseconds and filter on `selectedAt`, while grouping and ordering by
 * `localDate`. Mixing an instant filter with a local-date grouping moved the
 * boundary by up to a day for anyone away from UTC.
 */
@Injectable()
export class SelectionCalendar {
  constructor(private readonly prisma: PrismaService) {}

  async forUser(userId: string, now = new Date()): Promise<UserCalendar> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, timezone: true, historyRetentionDays: true },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }
    return calendarFor(user, now);
  }

  /** One pass over every account, for scheduled work that touches all of them. */
  async forEveryUser(now = new Date()): Promise<UserCalendar[]> {
    const users = await this.prisma.user.findMany({ select: { id: true, timezone: true, historyRetentionDays: true } });
    return users.map((user) => calendarFor(user, now));
  }
}
