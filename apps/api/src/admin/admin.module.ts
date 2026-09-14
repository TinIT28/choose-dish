import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DishCatalogModule } from '../dishes/dish-catalog.module';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, DishCatalogModule],
  controllers: [AdminController],
  providers: [AdminGuard, AdminService],
  exports: [AdminService],
})
export class AdminModule {}
