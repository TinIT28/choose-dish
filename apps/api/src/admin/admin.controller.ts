import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard';
import { AdminGuard } from './admin.guard';
import { CreateSharedDishDto, ResetPasswordDto } from './admin.dto';
import { AdminService } from './admin.service';
import { UpdateDishDto } from '../dishes/dishes.dto';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('shared-dishes')
  listShared() {
    return this.adminService.listShared();
  }

  @Post('shared-dishes')
  createShared(@Body() body: CreateSharedDishDto) {
    return this.adminService.createShared(body);
  }

  @Patch('shared-dishes/:id')
  updateShared(@Param('id') id: string, @Body() body: UpdateDishDto) {
    return this.adminService.updateShared(id, body);
  }

  @Delete('shared-dishes/:id')
  deleteShared(@Param('id') id: string) {
    return this.adminService.deleteShared(id);
  }

  @Post('users/:id/reset-password')
  resetPassword(@Param('id') id: string, @Body() body: ResetPasswordDto) {
    return this.adminService.resetPassword(id, body.password).then(() => ({ ok: true }));
  }

  @Post('shared-dishes/:id/copy')
  copyShared(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.copySharedDish(request.user.id, id);
  }
}
