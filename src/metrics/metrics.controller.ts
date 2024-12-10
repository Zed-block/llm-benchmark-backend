import {
  BadGatewayException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MetricsService } from './metrics.service';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { metricsRun } from './dto/ask';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  // ask a new metrics
  @UseGuards(AuthGuard("jwt"))
  @Post('ask')
  async ask(@Body() chatData: metricsRun, @CurrentUser() user: CuurentUser) {
    return await this.metricsService.ask(chatData, user);
  }
}
