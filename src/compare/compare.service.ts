import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { AiServiceService } from 'src/ai-service/ai-service.service';
import { Message, MessageDocument } from 'src/chat/schema/message.schema';
import { TopicService } from 'src/topic/topic.service';
import {
  compareAsk,
  compareAskFromData,
  compareRes,
  compareRunMetrics,
  singleCompare,
} from './dto/askLlmRouterQuestion';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { Compare, CompareDocument } from './compare.schema';
import { UserFiles, UserFilesDocument } from 'src/user-files/user-files.schema';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class CompareService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Compare.name) private compareModel: Model<CompareDocument>,
    @InjectModel(UserFiles.name) private userFiles: Model<UserFilesDocument>,
    private readonly aiService: AiServiceService,
    private readonly topicService: TopicService,
    private readonly storageService: StorageService,
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
    try {
      const promises = metrics.map(async (element) => {
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
          let messages = await this.messageModel.find({
            topicId: new mongoose.Types.ObjectId(data?.topicId),
          });

          // Find the index of the current message
          const currentIndex = messages.findIndex(
            (item) => item?.messageId == data?.messageId,
          );

          // Get the previous 5 messages, if they exist
          const previousMessages =
            currentIndex !== undefined && currentIndex > 0
              ? messages.slice(Math.max(currentIndex - 5, 0), currentIndex + 1)
              : [];

          const mergedMessages = [
            previousMessages.map((item) => item.content),
          ].join(', ');
          aiData.custom_metrice_data.history = mergedMessages;
        }
        if (['multi_query_accuracy'].includes(element)) {
          aiData.custom_metrice_data.response = [
            aiRes2?.content,
            aiRes?.content,
          ];
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
          return this.aiService.getResponseForMetrics(aiData, user, true);
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

  async uploadFiles(file, user, path) {
    try {
      const newFile = {
        userId: user._id,
        fileName: file.originalname,
        path: path,
        type: file.mimetype,
        fileFrom: 'chat',
      };

      this.storageService.save(path, file?.buffer);
      return await this.userFiles.create(newFile);
    } catch (err) {
      throw new BadGatewayException(err.message);
    }
  }

  async addNewMsg(
    messageData: singleCompare,
    user: CuurentUser,
    evaluateStatus: string,
    paths?: any,
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

      console.log('messageData 2: ', messageData);

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
        paths,
      );

      return aiResponse;
    } catch (err) {
      console.log('ere', err.message);
      throw new BadGatewayException(err);
    }
  }

  async addFile(files, user) {
    try {
      const paths: string[] = [];
      const fileIds: mongoose.Types.ObjectId[] = [];

      if (files) {
        const uploadPromises = files.map(async (file) => {
          const path = `${user._id}/${new Date().toISOString()}/${file?.originalname}`;

          const res: any = await this.uploadFiles(file, user, path); // Ensure the upload completes before proceeding

          fileIds.push(res._id);

          let url = await this.storageService.getTemporaryUrl(res?.path);
          paths.push(url); // Store the URL if needed
        });

        await Promise.all(uploadPromises);
      }

      return {
        fileIds,
        paths,
      };
    } catch (err) {
      console.log('ere', err.message);
      throw new BadGatewayException(err);
    }
  }

  async ask(messageData: compareAskFromData, user: CuurentUser, files?: any) {
    try {
      let msg1 = JSON.parse(messageData?.message1);
      let msg2 = JSON.parse(messageData?.message2);
      if (!JSON.parse(messageData?.message1)?.compareId) {
        let createCompare = await this.compareModel.create({
          model1: JSON.parse(messageData?.message1).model,
          model2: JSON.parse(messageData?.message2).model,
          provider1: JSON.parse(messageData?.message1).provider,
          provider2: JSON.parse(messageData?.message2).provider,
          title: JSON.parse(messageData?.message1)?.content,
          userId: user._id,
        });
        msg1.compareId = String(createCompare._id);
        msg2.compareId = String(createCompare._id);
      }

      let paths: string[] = [];

      if (files && files?.length > 0) {
        let fileUpload = await this.addFile(files, user);
        msg1.images = fileUpload.fileIds;
        msg2.images = fileUpload.fileIds;
        paths = fileUpload.paths;
      }

      let aiResponse1 = this.addNewMsg(
        msg1 as singleCompare,
        user,
        messageData?.submitType == 'evaluate' ? 'started' : 'notStarted',
        paths,
      );
      let aiResponse2 = this.addNewMsg(
        msg2 as singleCompare,
        user,
        messageData?.submitType == 'evaluate' ? 'started' : 'notStarted',
        paths,
      );

      let newData = await Promise.all([aiResponse1, aiResponse2]);

      if (messageData?.submitType == 'evaluate') {
        this.runEvaluvation(
          msg1 as singleCompare,
          user,
          newData[0],
          newData[1],
          JSON.parse(messageData?.selectedMetrics),
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

        for (let i = 0; i < message1.length; i++) {
          const item = message1[i];
          if (item?.images && item?.images.length > 0) {
            const updatedImages = await Promise.all(
              item.images.map(async (singleImg) => {
                let file = await this.userFiles.findById(singleImg);
                let url = await this.storageService.getTemporaryUrl(file?.path);
                return url;
              }),
            );

            item.images = updatedImages;
          }
        }
        for (let i = 0; i < message2.length; i++) {
          const item = message2[i];
          if (item?.images && item?.images.length > 0) {
            const updatedImages = await Promise.all(
              item.images.map(async (singleImg) => {
                let file = await this.userFiles.findById(singleImg);
                let url = await this.storageService.getTemporaryUrl(file?.path);
                return url;
              }),
            );

            item.images = updatedImages;
          }
        }

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
