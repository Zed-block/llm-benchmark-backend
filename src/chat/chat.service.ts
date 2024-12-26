import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Message, MessageDocument } from './schema/message.schema';
import { AiServiceService } from 'src/ai-service/ai-service.service';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { TopicService } from 'src/topic/topic.service';
import { askQuestion, askQuestionRes } from './dto/addNewMessage';
import { RoutingModels } from './schema/routing_models.schema';
import { EvalutionRun } from './dto/evaluation';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(RoutingModels.name) private routerModule: Model<RoutingModels>,
    private readonly aiService: AiServiceService,
    private readonly topicService: TopicService,
  ) {}

  async createChat(chatData: Partial<Message>): Promise<Message> {
    const newChat = new this.messageModel(chatData);
    return newChat.save();
  }

  async runEvaluvation(data: askQuestion, user, aiRes: any, metrics: string[]) {
    let messages = await this.messageModel.find({
      topicId: new mongoose.Types.ObjectId(data?.topicId),
    });

    // Find the index of the current message
    const currentIndex = messages.findIndex(
      (item) => item?.messageId == data?.messageId,
    );

    // Get the previous 5 messages, if they exist
    const previousMessages =
      currentIndex > 0
        ? messages.slice(Math.max(currentIndex - 5, 0), currentIndex)
        : [];

    const mergedMessages = previousMessages
      .map((item) => item.content)
      .join(', ');

    try {
      const promises = metrics.map((element) => {
        const aiData: any = {
          evaluation_metrice: element,
          evaluation_type: 'pointwise',
          custom_metrice_data: {
            prompt: data?.content,
            response: aiRes?.content,
          },
          response_model_name: data?.model,
        };

        if (
          ['multi_turn_chat_quality', 'multi_turn_chat_safety'].includes(
            element,
          )
        ) {
          aiData.custom_metrice_data.history = mergedMessages;
        }

        if (['jailbreak'].includes(element)) {
          aiData.custom_metrice_data.question = data?.content;
        }
        if (['LLMContexRecall'].includes(element)) {
          aiData.custom_metrice_data.context = data?.context;
          aiData.custom_metrice_data.question = data?.content;
        }

        try {
          return this.aiService.getResponseForMetrics(aiData, user);
        } catch (err) {
          console.error('Error at metrics:', err);
          // Handle the error as needed, maybe return a default response
          return null;
        }
      });

      // Wait for all promises to resolve
      const results = await Promise.all(promises);

      console.log('results; ', results);

      // Prepare evaluation response
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

      console.log('evaluateRes; ', evaluateRes);
      // Update message with evaluation results
      return await this.messageModel.findOneAndUpdate(
        { messageId: aiRes?.messageId },
        {
          $set: {
            evaluateStatus: evaluateRes ? 'completed' : 'error',
            evaluateRes: evaluateRes,
          },
        },
      );
    } catch (err) {
      console.error('Evaluation Error:', err);
      throw new BadGatewayException(err.message);
    }
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
          model: messageData?.model,
          provider: messageData?.provider,
          title: messageData?.content,
          temperature: messageData?.temperature,
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

      console.log('messageData?.submitType: ', messageData?.submitType);

      // Step 2: Call the AI service for a delayed response
      const aiResponse = await this.aiService.getResponse(
        messageData,
        user,
        messageData?.submitType == 'evaluate' ? 'started' : 'notStarted',
      );

      if (messageData?.submitType == 'evaluate') {
        this.runEvaluvation(
          messageData,
          user,
          aiResponse,
          messageData?.selectedMetrics,
        );
      }

      return aiResponse;
    } catch (err) {
      console.group('error at ask', err);
      throw new BadGatewayException(err.message);
    }
  }

  async action(
    data: { model: string; action: string; messageId: string },
    user: CuurentUser,
  ) {
    try {
      let message = await this.messageModel.findOne({
        messageId: data.messageId,
      });

      let model = await this.routerModule.findOne({
        strong_model: data?.model,
      });

      if (!model) {
        model = await this.routerModule.findOne({
          weak_model: data?.model,
        });
      }

      if (data?.action == 'like') {
        await this.messageModel.findOneAndUpdate(
          {
            messageId: data?.messageId,
          },
          {
            $set: {
              action: 'like',
            },
          },
        );

        let negative = 0;

        if (message?.action == 'dislike') {
          negative = 1;
        }

        return await this.routerModule.findByIdAndUpdate(model._id, {
          $set: {
            positive_feedback: model?.positive_feedback + 1,
            negative_feedback: model?.negative_feedback - negative,
          },
        });
      } else if (data?.action == 'dislike') {
        await this.messageModel.findOneAndUpdate(
          {
            messageId: data?.messageId,
          },
          {
            $set: {
              action: 'dislike',
            },
          },
        );

        let positive = 0;

        if (message?.action == 'like') {
          positive = 1;
        }

        return await this.routerModule.findByIdAndUpdate(model._id, {
          $set: {
            positive_feedback: model?.positive_feedback - positive,
            negative_feedback: model?.negative_feedback + 1,
          },
        });
      } else {
        await this.messageModel.findOneAndUpdate(
          {
            messageId: data?.messageId,
          },
          {
            $set: {
              action: 'none',
            },
          },
        );

        let positive = 0;
        let negative = 0;

        if (message?.action == 'dislike') {
          negative = 1;
        }

        if (message?.action == 'like') {
          positive = 1;
        }

        return await this.routerModule.findByIdAndUpdate(model._id, {
          $set: {
            positive_feedback: model?.positive_feedback - positive,
            negative_feedback: model?.negative_feedback - negative,
          },
        });
      }
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

  async getEvalutionData(data: EvalutionRun, user, metrics: string[], message) {
    try {
      console.log('data: ', data);

      console.log('metrics; ', metrics);
      const promises = metrics.map((element) => {
        let aiData: any = {
          evaluation_metrice: element,
          evaluation_type: 'pointwise',
          custom_metrice_data: {
            prompt: data?.question,
            response: data?.response,
          },
          response_model_name: data?.model,
        };

        if (data?.response2) {
          aiData.evaluation_type = 'pairwise';
          aiData.custom_metrice_data.baseline_model_response = data.response2;
        }

        if (
          ['multi_turn_chat_quality', 'multi_turn_chat_safety'].includes(
            element,
          )
        ) {
          aiData.custom_metrice_data.history = data?.history;
        }
        if (['multi_query_accuracy'].includes(element)) {
          aiData.custom_metrice_data.response = [
            data?.response,
            data.response2,
          ];
          aiData.custom_metrice_data.question = data?.question;
        }
        if (['jailbreak'].includes(element)) {
          aiData.custom_metrice_data.question = data?.question;
        }
        if (['LLMContexRecall'].includes(element)) {
          aiData.custom_metrice_data.question = data?.question;
          aiData.custom_metrice_data.context = data?.context;
        }
        try {
          console.log('aiData: ', aiData);

          return this.aiService.getResponseForMetrics(aiData, user);
        } catch (err) {
          console.error('Error at metrics:', err);
          // Handle the error as needed, maybe return a default response
          return null;
        }
      });

      // Wait for all promises to resolve and store the results
      const results = await Promise.all(promises);

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

      console.log('evaluateRes; ', evaluateRes);

      if (data?.response2) {
        let update = await this.messageModel.updateMany(
          { compareId: message?.compareId, role: 'assistant' },
          {
            $set: {
              evaluateStatus: 'completed',
              evaluateRes: evaluateRes,
            },
          },
        );
        console.log('update; ', update);
        return update;
      } else {
        let update = await this.messageModel.findOneAndUpdate(
          { messageId: data?.messageId },
          {
            $set: {
              evaluateStatus: evaluateRes ? 'completed' : 'error',
              evaluateRes: evaluateRes,
            },
          },
          {
            upsert: true,
            new: true,
          },
        );
        console.log('update 2; ', update);
        return update;
      }
    } catch (err) {
      throw new BadGatewayException(err.message);
    }
  }

  async startEvaluation(data: EvalutionRun, user: CuurentUser) {
    try {
      let message = await this.messageModel.findOneAndUpdate(
        { messageId: data?.messageId },
        {
          $set: {
            evaluateStatus: 'started',
          },
        },
      );

      return await this.getEvalutionData(data, user, data?.metrics, message);
    } catch (err) {
      console.log('ERR', err.Message);
    }
  }

  async getMessageEvalutionStatus(messageId: string, user: CuurentUser) {
    try {
      return await this.messageModel.findOne({ messageId: messageId });
    } catch (err) {
      console.log('ERR', err.Message);
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

  // Delete a chat message by ID
  async deleteChatById(chatId: string): Promise<{ deleted: boolean }> {
    const result = await this.messageModel.deleteOne({ _id: chatId });
    return { deleted: result.deletedCount > 0 };
  }
}
