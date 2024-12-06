import { Injectable } from '@nestjs/common';
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
        let topic = await this.topicService.createTopic({
          type: messageData?.type,
          userId: user?._id,
        });
        messageData.topicId = String(topic._id);
      }
      // Step 1: Save the message to the database
      await this.createChat({
        ...messageData,
        userId: user._id,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
      });

      // Step 2: Call the AI service for a delayed response
      const aiResponse = await this.aiService.getResponseForLlmRouter(
        {
          ...messageData,
          userId: user?._id,
          topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        },
        user,
      );

      return aiResponse;
    } catch (err: any) {
      console.log('err', err.message);
    }
  }
}
