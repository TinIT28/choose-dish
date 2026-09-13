import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SelectionsController } from './selections.controller';
import { SelectionsService } from './selections.service';

@Module({
  imports: [AuthModule],
  controllers: [SelectionsController],
  providers: [SelectionsService],
  exports: [SelectionsService],
})
export class SelectionsModule {}
