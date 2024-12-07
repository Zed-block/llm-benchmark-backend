import { Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { askQuestion } from 'src/chat/dto/addNewMessage';
import { Message, MessageDocument } from 'src/chat/schema/message.schema';
import { v4 as uuidv4 } from 'uuid';
import { chatReply } from './dto/addNewMessage';
import {
  askNewQuestionForCompare,
  askNewQuestionForLlmRouter,
  responseForCompare,
} from './dto/addNewMessageForLlmRouter';
import { chatReplyForLlmRouter } from './dto/replyForLlmRouter';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AiServiceService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  // Create a new chat message
  async createChat(chatData: Partial<Message>): Promise<Message> {
    const newChat = new this.messageModel(chatData);
    return newChat.save();
  }

  async getResponse(
    messageData: askQuestion,
    user: CuurentUser,
  ): Promise<chatReply> {
    return new Promise(async (resolve) => {
      const message = await this.createChat({
        content: 'hi its res',
        messageId: uuidv4(),
        instruction: messageData?.instruction,
        model: messageData.selectedModel,
        role: 'assistant',
        selectedModel: messageData?.selectedModel,
        temperature: messageData?.temperature,
        userId: user?._id,
        type: messageData?.type,
        contentType: 'answer',
        queryId: messageData?.messageId,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
      });
      setTimeout(() => {
        resolve(message); // Delay for 2 seconds
      }, 2000);
    });
  }

  async getResponseForLlmRouter(
    messageData: askNewQuestionForLlmRouter,
    user: CuurentUser,
  ): Promise<chatReplyForLlmRouter> {
    return new Promise(async (resolve) => {
      const message = await this.createChat({
        content: 'hi its res',
        messageId: uuidv4(),
        model: messageData.model1,
        role: 'assistant',
        userId: user?._id,
        type: messageData?.type,
        contentType: 'answer',
        queryId: messageData?.messageId,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
      });
      setTimeout(() => {
        resolve(message); // Delay for 2 seconds
      }, 2000);
    });
  }

  async getResponseForCompare(
    messageData: askNewQuestionForCompare,
    user: CuurentUser,
    i: number,
  ): Promise<responseForCompare> {
    return new Promise(async (resolve) => {
      const message = await this.createChat({
        content: `hi its res ${i}`,
        messageId: uuidv4(),
        model: messageData.selectedModel,
        role: 'assistant',
        userId: user?._id,
        type: messageData?.type,
        contentType: 'answer',
        queryId: messageData?.messageId,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        instruction: messageData?.instruction,
      });
      setTimeout(() => {
        resolve(message); // Delay for 2 seconds
      }, 2000);
    });
  }
}
