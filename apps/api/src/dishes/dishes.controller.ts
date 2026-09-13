import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard';
import { CreateDishDto, UpdateDishDto } from './dishes.dto';
import { DishesService } from './dishes.service';

@Controller('dishes')
@UseGuards(AuthGuard)
export class DishesController {
  constructor(private readonly dishesService: DishesService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.dishesService.listPrivate(request.user.id);
  }

  @Get('shared')
  listShared(@Req() request: AuthenticatedRequest) {
    return this.dishesService.listSharedForUser(request.user.id);
  }

  @Post('upload-signature')
  uploadSignature() {
    return this.dishesService.uploadSignature();
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: CreateDishDto) {
    return this.dishesService.createPrivate(request.user.id, body);
  }

  @Patch(':id')
  update(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdateDishDto) {
    return this.dishesService.updatePrivate(request.user.id, id, body);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.dishesService.deletePrivate(request.user.id, id);
  }

  @Post(':id/copy')
  copy(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.dishesService.copyShared(request.user.id, id);
  }

  @Post(':id/exclusion')
  exclude(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.dishesService.excludeShared(request.user.id, id);
  }

  @Delete(':id/exclusion')
  include(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.dishesService.unexcludeShared(request.user.id, id);
  }
}
