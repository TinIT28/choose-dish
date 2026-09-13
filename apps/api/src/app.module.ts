import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { DishesModule } from './dishes/dishes.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { SelectionsModule } from './selections/selections.module';
import { HistoryModule } from './history/history.module';
import { RetentionModule } from './internal/retention.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, DishesModule, AdminModule, SelectionsModule, HistoryModule, RetentionModule, HealthModule],
})
export class AppModule {}
