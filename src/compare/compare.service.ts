import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { AiServiceService } from 'src/ai-service/ai-service.service';
import { Message, MessageDocument } from 'src/chat/schema/message.schema';
import { TopicService } from 'src/topic/topic.service';
import { compareAsk, compareRes } from './dto/askLlmRouterQuestion';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';

@Injectable()
export class CompareService {
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

  async ask(messageData: compareAsk, user: CuurentUser) {
    try {
      if (!messageData?.message1?.topicId) {
        let topic = await this.topicService.createTopic({
          type: messageData?.message1?.type,
          userId: user?._id,
        });
        messageData.message1.topicId = String(topic._id);
        messageData.message2.topicId = String(topic._id);
      }
      // Step 1: Save the message to the database
      let message1 = await this.createChat({
        ...messageData?.message1,
        userId: user._id,
        topicId: new mongoose.Types.ObjectId(messageData?.message1?.topicId),
      });
      let message2 = await this.createChat({
        ...messageData?.message2,
        userId: user._id,
        topicId: new mongoose.Types.ObjectId(messageData?.message2?.topicId),
      });

      // Step 2: Call the AI service for a delayed response
      const aiResponse1 = await this.aiService.getResponseForCompare(
        message1,
        user,
        1,
      );
      const aiResponse2 = await this.aiService.getResponseForCompare(
        message2,
        user,
        2,
      );

      return { message1: aiResponse1, message2: aiResponse2 };
    } catch (err) {
      console.log('ere', err.message);
    }
  }
}
