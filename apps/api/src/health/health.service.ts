import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type HealthStatus = {
  status: 'ok';
  database: 'up';
};

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'up' };
  }
}
