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
      console.log('messageData: ', messageData);
      if (!messageData?.topicId) {
        let topic = await this.topicService.createTopicForCompare({
          type: messageData?.type,
          userId: user?._id,
          title: messageData?.content,
          compareId: new mongoose.Types.ObjectId(messageData?.compareId),
          compareSide: messageData?.compareSide,
          model: messageData?.model,
          provider: messageData?.provider,
        });
        messageData.topicId = String(topic._id);
      }

      await this.createChat({
        ...messageData,
        userId: user._id,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        compareId: new mongoose.Types.ObjectId(messageData?.compareId),
        compareQuestionId: messageData?.compareQuestionId,
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
          },
        },
        {
          $sort: { 'messages.createdAt': -1 },
        },
      ];

      const results = await this.messageModel.aggregate(pipeline).exec();

      if (results?.length > 0) {
        let topics = await this.topicService.getTopicsByComapareId(compare);

        // If no model is specified or model doesn't exist, return grouped messages
        const nextPageAvailable = results[0]?.messages.length > limit;

        let leftSide =
          topics?.find((item: any) => item?.compareSide === 'left') ||
          results[0];

        let rightSide =
          topics?.find((item: any) => item?.compareSide === 'right') ||
          results[1];

        let message1 = results.find(
          (item) => String(item._id) == String(leftSide._id),
        ).messages;

        let message2 = results.find(
          (item) => String(item._id) == String(rightSide._id),
        ).messages;

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
