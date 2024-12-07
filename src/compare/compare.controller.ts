import {
  BadGatewayException,
  Body,
  Controller,
  Post,
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
  async ask(
    @Body() chatData: compareAsk,
    @CurrentUser() user: CuurentUser,
  ){
    try {
      return await this.compareService.ask(chatData, user);
    } catch (error) {
      throw new BadGatewayException(error?.message);
    }
  }
}
