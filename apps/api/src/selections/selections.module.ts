import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DishCatalogModule } from '../dishes/dish-catalog.module';
import { SelectionCalendarModule } from './selection-calendar.module';
import { SelectionsController } from './selections.controller';
import { SelectionsService } from './selections.service';

@Module({
  imports: [AuthModule, DishCatalogModule, SelectionCalendarModule],
  controllers: [SelectionsController],
  providers: [SelectionsService],
  exports: [SelectionsService],
})
export class SelectionsModule {}
