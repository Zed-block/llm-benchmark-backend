import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { AiServiceService } from 'src/ai-service/ai-service.service';
import { Message, MessageDocument } from 'src/chat/schema/message.schema';
import { TopicService } from 'src/topic/topic.service';
import { askLlmRouterQuestion } from './dto/askLlmRouterQuestion';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';

@Injectable()
export class LlmRouterService {
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

  // Add a message
  async addMessage(messageData: askLlmRouterQuestion, user: CuurentUser) {
    try {
      if (!messageData?.topicId) {
        let topic = await this.topicService.createTopicFromLlmRouter({
          type: messageData?.type,
          userId: user?._id,
          strongModels: messageData?.strongModels,
          weakModels: messageData?.weakModels,
          title: messageData?.content,
        });
        messageData.topicId = String(topic._id);
      }

      // Step 1: Save the message to the database
      await this.createChat({
        ...messageData,
        userId: user._id,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        routing_threshold: messageData?.routing_threshold || 0.1,
      });


      // Step 2: Call the AI service for a delayed response
      const aiResponse = await this.aiService.getResponseForLlmRouter(
        {
          ...messageData,
          userId: user?._id,
          topicId: new mongoose.Types.ObjectId(messageData?.topicId),
          routing_threshold: messageData?.routing_threshold || 0.1,
        },
        user,
      );

      return aiResponse;
    } catch (err: any) {
      console.log('err', err.message);
      throw new BadGatewayException(err);
    }
  }

  async getMessage(page: number, topicId: string, lastMessageId?: string) {
    try {
      let topic = new mongoose.Types.ObjectId(topicId);
      let limit = 10;
      let lastMessageIndex = 0;

      const topicData = await this.topicService.getTopic(
        new mongoose.Types.ObjectId(String(topicId)),
      );

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
        messages: messages,
        next,
        page,
        topic: topicData,
      };
    } catch (err) {
      console.log('ERR', err.Message);
    }
  }
}
