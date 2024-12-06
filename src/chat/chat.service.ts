import { Injectable } from '@nestjs/common';
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

  async ask(messageData: askQuestion, user: CuurentUser): Promise<askQuestionRes> {
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
    const aiResponse = await this.aiService.getResponse(messageData, user);

    return aiResponse;
  }

  // Delete a chat message by ID
  async deleteChatById(chatId: string): Promise<{ deleted: boolean }> {
    const result = await this.messageModel.deleteOne({ _id: chatId });
    return { deleted: result.deletedCount > 0 };
  }
}
