import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { RefreshSession } from './refresh-session';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthGuard, AuthService, RefreshSession],
  exports: [AuthGuard, AuthService],
})
export class AuthModule {}
