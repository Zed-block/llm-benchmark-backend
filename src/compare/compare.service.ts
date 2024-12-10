import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { AiServiceService } from 'src/ai-service/ai-service.service';
import { Message, MessageDocument } from 'src/chat/schema/message.schema';
import { TopicService } from 'src/topic/topic.service';
import { compareAsk, compareRes } from './dto/askLlmRouterQuestion';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { Compare, CompareDocument } from './compare.schema';

@Injectable()
export class CompareService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Compare.name) private compareModel: Model<CompareDocument>,
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
      if (!messageData?.message1?.compareId) {
        let createCompare = await this.compareModel.create({
          title: messageData?.message1?.content,
          userId: user._id,
        });

        let topic1 = await this.topicService.createTopic({
          type: messageData?.message1?.type,
          userId: user?._id,
        });

        let topic2 = await this.topicService.createTopic({
          type: messageData?.message1?.type,
          userId: user?._id,
        });
        messageData.message1.topicId = String(topic1._id);
        messageData.message2.topicId = String(topic2._id);
        messageData.message1.compareId = String(createCompare._id);
        messageData.message2.compareId = String(createCompare._id);
      }
      // Step 1: Save the message to the database
      let message1 = await this.createChat({
        ...messageData?.message1,
        userId: user._id,
        topicId: new mongoose.Types.ObjectId(messageData?.message1?.topicId),
        compareId: new mongoose.Types.ObjectId(
          messageData?.message1?.compareId,
        ),
      });
      let message2 = await this.createChat({
        ...messageData?.message2,
        userId: user._id,
        topicId: new mongoose.Types.ObjectId(messageData?.message2?.topicId),
        compareId: new mongoose.Types.ObjectId(
          messageData?.message2?.compareId,
        ),
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

  async getCompare(
    page: number,
    compareId: string,
    lastMessageId?: string,
    topicId?: string,
  ) {
    try {
      let compare = new mongoose.Types.ObjectId(compareId);
      let limit = 10;

      // Initialize the aggregation pipeline
      const pipeline: any[] = [
        {
          $match: {
            compareId: compare,
          },
        },
        {
          $sort: { createdAt: -1 }, // Sort messages by createdAt in descending order
        },
        {
          $group: {
            _id: '$topicId', // Group by selectedModel
            messages: { $push: '$$ROOT' },
            lastIndex: { $last: '$createdAt' }, // Capture the last index based on createdAt
          },
        },
      ];

      // Add limit to get only the specified number of messages
      // pipeline.push({ $limit: limit + 1 }); // Fetch one extra to check for next page

      // Execute the aggregation
      const results = await this.messageModel.aggregate(pipeline).exec();

      // Check if there are any results for the selected model
      if (lastMessageId) {
        let messages = results.find(
          (item) => String(item?._id) === String(topicId),
        );
        const lastMessageIndex = messages?.messages.findIndex(
          (msg) => msg.messageId === lastMessageId,
        );
        const nextPageAvailable =
          messages.length > lastMessageIndex + 1 + limit;

        // Return the messages and last index for the selected model
        return {
          page,
          messages: messages?.messages
            .slice(lastMessageIndex + 1, lastMessageIndex + 1 + limit)
          ,
          nextPageAvailable,
        };
      }

      if (results?.length > 0) {
        // If no model is specified or model doesn't exist, return grouped messages
        const nextPageAvailable = results[0]?.messages.length > limit;

        let message1 = results[0]?.messages.slice(0, limit);
        let message2 = results[1]?.messages.slice(0, limit);

        return {
          page,
          messages: {
            message1: message1,
            message2: message2,
          },
          nextPageAvailable,
        };
      }
    } catch (err) {
      console.log('ERR', err.message);
      throw new Error('Error while fetching messages');
    }
  }
}
