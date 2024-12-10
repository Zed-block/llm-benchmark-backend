import {
  Body,
  Controller,
  Delete,
  HttpException,
  HttpStatus,
  Post,
  Param,
  BadGatewayException,
  UseGuards,
  Query,
  Get,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { Message } from './schema/message.schema';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { askQuestion, askQuestionRes } from './dto/addNewMessage';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Create a new chat message
  @Post('create')
  async createChat(@Body() chatData: Partial<Message>): Promise<Message> {
    try {
      return await this.chatService.createChat(chatData);
    } catch (error) {
      throw new BadGatewayException(error?.message);
    }
  }

  // ask a new chat message
  @UseGuards(AuthGuard())
  @Post('askNewQuestion')
  async ask(
    @Body() chatData: askQuestion,
    @CurrentUser() user: CuurentUser,
  ): Promise<askQuestionRes> {
    return await this.chatService.ask(chatData, user);

  }

  // ask a new chat message
  @UseGuards(AuthGuard())
  @Get('getMessages')
  async getMessages(
    @Query('page') page: number,
    @Query('type') type: string,
    @Query('topicId') topicId: string,
    @Query('lastMessageId') lastMessageId: string,
    @CurrentUser() user: CuurentUser,
  ) {
    try {
      return await this.chatService.getMessage(
        type,
        page,
        topicId,
        lastMessageId,
      );
    } catch (error) {
      throw new BadGatewayException(error?.message);
    }
  }

  // Delete a chat message by ID
  @Delete('delete/:id')
  async deleteChat(@Param('id') id: string): Promise<{ deleted: boolean }> {
    try {
      const result = await this.chatService.deleteChatById(id);
      if (!result.deleted) {
        throw new HttpException('Chat message not found', HttpStatus.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw new BadGatewayException(error?.message);
    }
  }
}
