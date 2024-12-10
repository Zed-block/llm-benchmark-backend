import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { AiServiceService } from 'src/ai-service/ai-service.service';
import { Message, MessageDocument } from 'src/chat/schema/message.schema';
import { TopicService } from 'src/topic/topic.service';
import {
  compareAsk,
  compareRes,
  singleCompare,
} from './dto/askLlmRouterQuestion';
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

  async addNewMsg(messageData: singleCompare, user: CuurentUser) {
    try {
      if (!messageData?.topicId) {
        let topic = await this.topicService.createTopic({
          type: messageData?.type,
          userId: user?._id,
        });
        messageData.topicId = String(topic._id);
      }

      console.log('messageData: ', messageData);
      await this.createChat({
        ...messageData,
        userId: user._id,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        compareId: new mongoose.Types.ObjectId(messageData?.compareId),
      });

      const aiResponse = await this.aiService.getResponseForComape(
        messageData,
        user,
      );

      return aiResponse;
    } catch (err) {
      console.log('ere', err.message);
      throw new BadGatewayException(err);
    }
  }

  async ask(messageData: compareAsk, user: CuurentUser) {
    try {
      if (!messageData?.message1?.compareId) {
        let createCompare = await this.compareModel.create({
          model1: messageData?.message1.model,
          model2: messageData?.message2.model,
          provider1: messageData?.message1.provider,
          provider2: messageData?.message2.provider,
          title: messageData?.message1?.content,
          userId: user._id,
        });
        messageData.message1.compareId = String(createCompare._id);
        messageData.message2.compareId = String(createCompare._id);
      }

      //@ts-ignore
      let aiResponse1 = await this.addNewMsg(messageData?.message1, user);
      //@ts-ignore
      let aiResponse2 = await this.addNewMsg(messageData?.message2, user);

      console.log('aiResponse1: ', aiResponse1);
      console.log('aiResponse2: ', aiResponse2);

      return { message1: aiResponse1, message2: aiResponse2 };
    } catch (err) {
      console.log('ere', err.message);
      throw new BadGatewayException(err);
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

      const compareData = await this.compareModel.findById(compare);
      let limit = 10;

      // Initialize the aggregation pipeline
      const pipeline: any[] = [
        {
          $match: {
            compareId: compare,
          },
        },
        {
          $group: {
            _id: '$topicId', // Group by selectedModel
            messages: { $push: '$$ROOT' },
            lastIndex: { $last: '$createdAt' }, // Capture the last index based on createdAt
          },
        },
        {
          $sort: { 'messages.createdAt': -1 }, // Sort messages by createdAt in descending order
        },
      ];

      // Add limit to get only the specified number of messages
      // pipeline.push({ $limit: limit + 1 }); // Fetch one extra to check for next page

      // Execute the aggregation
      const results = await this.messageModel.aggregate(pipeline).exec();

      // Check if there are any results for the selected model
      // if (lastMessageId) {
      //   let messages = results.find(
      //     (item) => String(item?._id) === String(topicId),
      //   );
      //   const lastMessageIndex = messages?.messages.findIndex(
      //     (msg) => msg.messageId === lastMessageId,
      //   );
      //   const nextPageAvailable =
      //     messages.length > lastMessageIndex + 1 + limit;

      //   // Return the messages and last index for the selected model
      //   return {
      //     page,
      //     messages: messages?.messages
      //       .slice(lastMessageIndex + 1, lastMessageIndex + 1 + limit)
      //     ,
      //     nextPageAvailable,
      //   };
      // }

      if (results?.length > 0) {
        // If no model is specified or model doesn't exist, return grouped messages
        const nextPageAvailable = results[0]?.messages.length > limit;

        let message1 = results[0]?.messages.reverse();
        let message2 = results[1]?.messages.reverse();

        return {
          page,
          messages: {
            message1: message1,
            message2: message2,
          },
          compare: compareData,
          nextPageAvailable,
        };
      }
    } catch (err) {
      throw new BadGatewayException(err);
    }
  }
}
