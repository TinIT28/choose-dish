import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryService } from '../storage/cloudinary.service';
import { DishesController } from './dishes.controller';
import { DishesService } from './dishes.service';

@Module({
  imports: [AuthModule],
  controllers: [DishesController],
  providers: [DishesService, CloudinaryService],
  exports: [DishesService],
})
export class DishesModule {}
