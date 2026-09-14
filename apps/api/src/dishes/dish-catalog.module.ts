import { Module } from '@nestjs/common';
import { CloudinaryService } from '../storage/cloudinary.service';
import { DishCatalog } from './dish-catalog';

@Module({
  providers: [DishCatalog, CloudinaryService],
  exports: [DishCatalog, CloudinaryService],
})
export class DishCatalogModule {}
