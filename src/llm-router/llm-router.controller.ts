import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LlmRouterService } from './llm-router.service';
import { askLlmRouterQuestion } from './dto/askLlmRouterQuestion';
import { AuthGuard } from '@nestjs/passport';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { CurrentUser } from 'src/auth/current-user.decorator';

@Controller('llm-router')
export class LlmRouterController {
  constructor(private readonly llmRouterService: LlmRouterService) {}

  // API to add a message

  @UseGuards(AuthGuard('jwt'))
  @Post('add-message')
  async addMessage(
    @Body() data: askLlmRouterQuestion,
    @CurrentUser() user: CuurentUser,
  ) {
    return await this.llmRouterService.addMessage(data, user);
  }
}
