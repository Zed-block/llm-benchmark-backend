import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { AiServiceService } from 'src/ai-service/ai-service.service';
import { Message, MessageDocument } from 'src/chat/schema/message.schema';
import { TopicService } from 'src/topic/topic.service';
import {
  compareAsk,
  compareRes,
  compareRunMetrics,
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

  async runEvaluvation(
    data: compareRunMetrics,
    user,
    aiRes: any,
    aiRes2: any,
    metrics: string[],
  ) {
    let messages = await this.messageModel.find({
      messageId: aiRes?.messageId,
    });

    let answer = aiRes;

    // Find the index of the current message
    const currentIndex = messages?.findIndex(
      (item) => item?.messageId == aiRes.queryId,
    );

    // Get the previous 5 messages, if they exist
    const previousMessages =
      currentIndex !== undefined && currentIndex > 0
        ? messages.slice(Math.max(currentIndex - 5, 0), currentIndex + 1)
        : [];

    const mergedMessages = [previousMessages.map((item) => item.content)].join(
      ', ',
    );

    //@ts-ignore
    let msg = answer ? answer?.content : '';
    try {
      const promises = metrics.map((element) => {
        let aiData: any = {
          evaluation_metrice: element,
          evaluation_type: 'pairwise',
          custom_metrice_data: {
            prompt: data?.content,
            response: aiRes?.content,
            baseline_model_response: aiRes2?.content,
          },
          response_model_name: data?.model,
          baseline_model_name: aiRes2?.model,
        };

        if (
          ['multi_turn_chat_quality', 'multi_turn_chat_safety'].includes(
            element,
          )
        ) {
          aiData.custom_metrice_data.history = mergedMessages;
        }
        if (['multi_query_accuracy'].includes(element)) {
          aiData.custom_metrice_data.response[0] = aiRes2?.content;
          aiData.custom_metrice_data.response[1] = msg;
          aiData.custom_metrice_data.question = data?.content;
        }
        if (['jailbreak'].includes(element)) {
          aiData.custom_metrice_data.question = data?.content;
        }
        if (['LLMContexRecall'].includes(element)) {
          aiData.custom_metrice_data.question = data?.content;
          aiData.custom_metrice_data.context = data?.context;
        }
        try {
          return this.aiService.getResponseForMetrics(aiData, user);
        } catch (err) {
          console.error('Error at metrics:', err);
          // Handle the error as needed, maybe return a default response
          return null;
        }
      });

      // Wait for all promises to resolve and store the results
      const results = await Promise.all(promises);

      console.log('results: ', results);

      let evaluateRes: Record<string, any> = {};

      results.map((result) => {
        console.log('resu: ', result);

        // Check if the response is either an array or an object
        if (result?.response) {
          if (Array.isArray(result.response)) {
            // If response is an array, loop through each item
            result.response.forEach((item) => {
              if (item && typeof item === 'object') {
                // If item is an object, extract key-value pairs
                const keys = Object.keys(item);
                keys.forEach((key) => {
                  if (key) {
                    evaluateRes = { [key]: item[key], ...evaluateRes };
                  }
                });
              }
            });
          } else if (typeof result.response === 'object') {
            // If response is a single object, extract key-value pairs directly
            const keys = Object.keys(result.response);
            keys.forEach((key) => {
              if (key) {
                evaluateRes = { [key]: result.response[key], ...evaluateRes };
              }
            });
          }
        }
      });

      let msges = await this.messageModel.updateMany(
        { role: 'assistant', compareId: aiRes.compareId },
        {
          $set: {
            evaluateStatus: evaluateRes ? 'completed' : 'error',
            evaluateRes: evaluateRes,
          },
        },
      );
      console.log('msges; ', msges);
      return msges;
    } catch (err) {
      throw new BadGatewayException(err.message);
    }
  }

  async addNewMsg(
    messageData: singleCompare,
    user: CuurentUser,
    evaluateStatus: string,
  ) {
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
          temperature: messageData?.temperature,
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
        evaluateStatus,
      );

      return aiResponse;
    } catch (err) {
      console.log('ere', err.message);
      throw new BadGatewayException(err);
    }
  }

  async ask(messageData: compareAsk, user: CuurentUser) {
    try {
      let msg1: singleCompare;
      let msg2: singleCompare;
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

        msg1 = {
          ...messageData?.message1,
          compareId: String(createCompare._id),
        };

        msg2 = {
          ...messageData?.message2,
          compareId: String(createCompare._id),
        };
      }

      let aiResponse1 = this.addNewMsg(
        msg1,
        user,
        messageData?.submitType == 'evaluate' ? 'started' : 'notStarted',
      );
      let aiResponse2 = this.addNewMsg(
        msg2,
        user,
        messageData?.submitType == 'evaluate' ? 'started' : 'notStarted',
      );

      let newData = await Promise.all([aiResponse1, aiResponse2]);

      if (messageData?.submitType == 'evaluate') {
        this.runEvaluvation(
          msg1,
          user,
          newData[0],
          newData[1],
          messageData?.selectedMetrics,
        );
      }

      return { message1: newData[0], message2: newData[1] };
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
