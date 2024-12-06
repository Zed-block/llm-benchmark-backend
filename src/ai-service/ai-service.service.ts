import { Injectable } from '@nestjs/common';
import mongoose from 'mongoose';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { askQuestion } from 'src/chat/dto/addNewMessage';
import { Message } from 'src/chat/schema/message.schema';
import { v4 as uuidv4 } from 'uuid';
import { chatReply } from './dto/addNewMessage';
import { askNewQuestionForLlmRouter } from './dto/addNewMessageForLlmRouter';
import { chatReplyForLlmRouter } from './dto/replyForLlmRouter';

@Injectable()
export class AiServiceService {
  async getResponse(
    messageData: askQuestion,
    user: CuurentUser,
  ): Promise<chatReply> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          content: 'hi its res',
          messageId: uuidv4(),
          instruction: messageData?.instruction,
          model: messageData.selectedModel,
          role: 'assistant',
          selectedModel: messageData?.selectedModel,
          temperature: messageData?.temperature,
          userId: user?._id,
          type: messageData?.type,
          contentType: messageData?.contentType,
          queryId: messageData?.messageId,
          topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        });
      }, 2000); // Delay for 2 seconds
    });
  }
  async getResponseForLlmRouter(
    messageData: askNewQuestionForLlmRouter,
    user: CuurentUser,
  ): Promise<chatReplyForLlmRouter> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          content: 'hi its res',
          messageId: uuidv4(),
          model: messageData.model1,
          role: 'assistant',
          userId: user?._id,
          type: messageData?.type,
          contentType: messageData?.contentType,
          queryId: messageData?.messageId,
          topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        });
      }, 2000); // Delay for 2 seconds
    });
  }
}
