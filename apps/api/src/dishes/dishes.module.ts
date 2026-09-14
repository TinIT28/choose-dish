import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DishCatalogModule } from './dish-catalog.module';
import { DishesController } from './dishes.controller';
import { DishesService } from './dishes.service';

@Module({
  imports: [AuthModule, DishCatalogModule],
  controllers: [DishesController],
  providers: [DishesService],
  exports: [DishesService],
})
export class DishesModule {}
