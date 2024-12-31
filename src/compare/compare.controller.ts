import {
  BadGatewayException,
  Body,
  Controller,
  Get,
  ParseFilePipeBuilder,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CompareService } from './compare.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import {
  compareAsk,
  compareAskFromData,
  compareRes,
} from './dto/askLlmRouterQuestion';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

  // ask a new chat message
  @UseGuards(AuthGuard())
  @Post('askNewQuestion')
  @UseInterceptors(
    FilesInterceptor('files', 6, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
    }),
  )
  async ask(
    @Body() chatData: compareAskFromData,
    @CurrentUser() user: CuurentUser,
    @UploadedFiles(new ParseFilePipeBuilder().build({ fileIsRequired: false }))
    files: any[],
  ) {
    try {
      return await this.compareService.ask(chatData, user, files);
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
