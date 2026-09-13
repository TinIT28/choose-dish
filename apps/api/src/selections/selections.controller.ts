import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard';
import { RandomSelectionDto } from './selections.dto';
import { SelectionsService } from './selections.service';

@Controller('selections')
@UseGuards(AuthGuard)
export class SelectionsController {
  constructor(private readonly selectionsService: SelectionsService) {}

  @Post('random')
  random(@Req() request: AuthenticatedRequest, @Body() body: RandomSelectionDto) {
    return this.selectionsService.selectRandom(request.user.id, body.mealPeriod);
  }

  @Get('today')
  today(@Req() request: AuthenticatedRequest) {
    return this.selectionsService.listToday(request.user.id);
  }
}
