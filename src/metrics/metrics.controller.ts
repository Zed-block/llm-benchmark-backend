import {
  BadGatewayException,
  Body,
  Controller,
  Get,
  Post,
  Query,
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
  @UseGuards(AuthGuard('jwt'))
  @Post('ask')
  async ask(@Body() chatData: metricsRun, @CurrentUser() user: CuurentUser) {
    return await this.metricsService.ask(chatData, user);
  }

  // ask a new metrics
  @UseGuards(AuthGuard('jwt'))
  @Get('getdbMetricsRes')
  async getdbMetricsRes(
    @Query('runId') runId: string,
    @CurrentUser() user: CuurentUser,
  ) {
    return await this.metricsService.getdbMetricsRes(runId, user);
  }

  // ask a new metrics
  @UseGuards(AuthGuard('jwt'))
  @Get('getMetricsRes')
  async getMetricsRes(
    @Query('runId') metricTopic: string,
    @CurrentUser() user: CuurentUser,
  ) {
    return await this.metricsService.getMetricsRes(
      metricTopic,
      user,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getdbMetricsResHistory')
  async getdbMetricsResHistory(
    @Query('metric') metric: string,
    @Query('type') type: string,
    @Query('dbId') dbId: string,
    @CurrentUser() user: CuurentUser,
  ) {
    return await this.metricsService.getdbMetricsResHistory(
      metric,
      type,
      dbId,
      user,
    );
  }
}
