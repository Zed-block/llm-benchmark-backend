import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TopicService } from './topic.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';

@Controller('topic')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}
  // ask a new chat message
  @UseGuards(AuthGuard('jwt'))
  @Get('getHistory')
  async getHistory(
    @Query('page') page: number,
    @Query('type') type: string,
    @Query('topicId') topicId: string,
    @CurrentUser() user: CuurentUser,
  ) {
    return await this.topicService.getHistory(type, page, topicId, user);
  }
}
