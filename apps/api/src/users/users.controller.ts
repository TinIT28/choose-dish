import { Body, Controller, Delete, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard';
import { UpdateSettingsDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('users/me')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('settings')
  updateSettings(@Req() request: AuthenticatedRequest, @Body() body: UpdateSettingsDto) {
    return this.usersService.updateSettings(request.user.id, body);
  }

  @Get('sessions')
  sessions(@Req() request: AuthenticatedRequest) {
    return this.usersService.listSessions(request.user.id);
  }

  @Delete('sessions/:id')
  revokeSession(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.revokeSession(request.user.id, id);
  }

  @Delete()
  async deleteAccount(@Req() request: AuthenticatedRequest) {
    await this.usersService.deleteAccount(request.user.id);
    return { ok: true };
  }
}
