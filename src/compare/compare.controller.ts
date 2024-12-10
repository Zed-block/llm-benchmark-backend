import {
  BadGatewayException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CompareService } from './compare.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { compareAsk, compareRes } from './dto/askLlmRouterQuestion';

@Controller('compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

  // ask a new chat message
  @UseGuards(AuthGuard())
  @Post('askNewQuestion')
  async ask(@Body() chatData: compareAsk, @CurrentUser() user: CuurentUser) {
    try {
      return await this.compareService.ask(chatData, user);
    } catch (error) {
      throw new BadGatewayException(error?.message);
    }
  }

  @UseGuards(AuthGuard())
  @Get('getMessages')
  async getMessages(
    @Query('page') page: number,
    @Query('compare') compareId: string,
    @Query('topicId') topicId: string,
    @Query('lastMessageId') lastMessageId: string,
    @CurrentUser() user: CuurentUser,
  ) {
    return await this.compareService.getCompare(
      page,
      compareId,
      topicId,
      lastMessageId,
    );
  }
}
