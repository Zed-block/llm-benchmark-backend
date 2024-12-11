import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Message, MessageDocument } from './schema/message.schema';
import { AiServiceService } from 'src/ai-service/ai-service.service';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { TopicService } from 'src/topic/topic.service';
import { askQuestion, askQuestionRes } from './dto/addNewMessage';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly aiService: AiServiceService,
    private readonly topicService: TopicService,
  ) {}

  // Create a new chat message
  async createChat(chatData: Partial<Message>): Promise<Message> {
    const newChat = new this.messageModel(chatData);
    return newChat.save();
  }

  async ask(
    messageData: askQuestion,
    user: CuurentUser,
  ): Promise<askQuestionRes> {
    try {
      if (!messageData?.topicId) {
        let topicBody = {
          type: messageData?.type,
          userId: user?._id,
          model1: messageData?.model,
          provider1: messageData?.provider,
        };
        let topic = await this.topicService.createTopic(topicBody);
        messageData.topicId = String(topic._id);
      }
      // Step 1: Save the message to the database
      await this.createChat({
        ...messageData,
        userId: user._id,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
      });

      // Step 2: Call the AI service for a delayed response
      const aiResponse = await this.aiService.getResponse(messageData, user);

      return aiResponse;
    } catch (err) {
      console.group('error at ask', err);
      throw new BadGatewayException(err.message);
    }
  }

  async getSingleMsg(topicId: string, page: number, lastMessageId?: string) {
    try {
      let topic = new mongoose.Types.ObjectId(topicId);
      let limit = 30;
      let lastMessageIndex = 0;
      const topicData = await this.topicService.getTopic(topic);

      const messages = await this.messageModel.aggregate([
        {
          $match: {
            topicId: topic,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);

      if (lastMessageId) {
        let index = messages.findIndex(
          (message) => String(message.messageId) === String(lastMessageId),
        );
        lastMessageIndex = index > 0 ? index + 1 : 0;
      }

      const paginatedMessages = messages.slice(
        lastMessageIndex,
        lastMessageIndex + limit,
      );

      const next = lastMessageIndex + limit < messages.length;

      return {
        messages: messages.reverse(),
        next,
        page,
        topic: topicData,
      };
    } catch (err) {
      console.log('ERR', err.Message);
      throw new BadGatewayException(err.message);
    }
  }
  async getMessage(
    type: string,
    page: number,
    topicId: string,
    lastMessageId?: string,
  ) {
    try {
      return await this.getSingleMsg(topicId, page, lastMessageId);
    } catch (err) {
      console.log('ERR', err.Message);
    }
  }

  async getHistory(
    type: string,
    page: number,
    topicId: string,
    user: CuurentUser,
  ) {
    try {
      let data = await this.messageModel.aggregate([
        {
          $match: {
            userId: user._id,
          },
        },
        {
          $group: {
            _id: '$topicId', // Group by selectedModel
            messages: { $push: '$$ROOT' },
          },
        },
        {
          $sort: { 'messages.createdAt': -1 }, // Sort messages by createdAt in descending order
        },
      ]);
      // return await this.getSingleMsg(topicId, page, lastMessageId);
    } catch (err) {
      console.log('ERR', err.Message);
    }
  }

  // Delete a chat message by ID
  async deleteChatById(chatId: string): Promise<{ deleted: boolean }> {
    const result = await this.messageModel.deleteOne({ _id: chatId });
    return { deleted: result.deletedCount > 0 };
  }
}
