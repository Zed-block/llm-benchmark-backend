import { BadGatewayException, Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { askQuestion, askQuestionForCompare } from 'src/chat/dto/addNewMessage';
import { Message, MessageDocument } from 'src/chat/schema/message.schema';
import { v4 as uuidv4 } from 'uuid';
import { chatReply, chatReplyForCompare } from './dto/addNewMessage';
import {
  askNewQuestionForCompare,
  askNewQuestionForLlmRouter,
  responseForCompare,
} from './dto/addNewMessageForLlmRouter';
import { chatReplyForLlmRouter } from './dto/replyForLlmRouter';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { metricsRun } from 'src/metrics/dto/ask';
import { singleAiChat, singleAiChatRes } from './dto/singleChat';
import { aiRouterChat } from './dto/router';

@Injectable()
export class AiServiceService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  // Create a new chat message
  async createChat(chatData: Partial<Message>): Promise<Message> {
    const newChat = new this.messageModel(chatData);
    return newChat.save();
  }

  async getResponse(
    messageData: askQuestion,
    user: CuurentUser,
  ): Promise<chatReply> {
    try {
      let body = {
        system_prompt: messageData?.instruction,
        user_query: messageData?.content,
        model_name: messageData?.model,
        user_id: String(user?._id),
      };

      let response: singleAiChatRes = await this.getAiRes(body);

      const message = await this.createChat({
        content: response?.response,
        messageId: uuidv4(),
        instruction: messageData?.instruction,
        model: messageData.model,
        role: 'assistant',
        provider: messageData?.provider,
        userId: user?._id,
        type: messageData?.type,
        contentType: 'answer',
        queryId: messageData?.messageId,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        totalToken: response?.metadata
          ? response.metadata?.tokens.total_tokens
          : 0,
        inputToken: response?.metadata
          ? response.metadata?.tokens.input_tokens
          : 0,
        outputToken: response?.metadata
          ? response.metadata?.tokens.output_tokens
          : 0,
        totalCost: response?.metadata ? response.metadata?.cost.total_cost : 0,
        inputCost: response?.metadata ? response.metadata?.cost.input_cost : 0,
        outputCost: response?.metadata
          ? response.metadata?.cost.output_cost
          : 0,
        timeTaken: response?.total_time ? response.total_time : 0,
      });

      return message;
    } catch (error) {
      console.log('error at get res', error);
      throw new BadGatewayException(error?.message);
    }
  }

  async getResponseForComape(
    messageData: askQuestionForCompare,
    user: CuurentUser,
  ): Promise<chatReplyForCompare> {
    try {
      let body = {
        system_prompt: messageData?.instruction,
        user_query: messageData?.content,
        model_name: messageData?.model,
        user_id: String(user?._id),
      };

      let response: singleAiChatRes = await this.getAiRes(body);

      const message = await this.createChat({
        content: response?.response,
        messageId: uuidv4(),
        instruction: messageData?.instruction,
        model: messageData.model,
        role: 'assistant',
        provider: messageData?.provider,
        userId: user?._id,
        type: messageData?.type,
        contentType: 'answer',
        queryId: messageData?.messageId,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        compareId: new mongoose.Types.ObjectId(messageData?.compareId),
        totalToken: response?.metadata
          ? response.metadata?.tokens.total_tokens
          : 0,
        inputToken: response?.metadata
          ? response.metadata?.tokens.input_tokens
          : 0,
        outputToken: response?.metadata
          ? response.metadata?.tokens.output_tokens
          : 0,
        totalCost: response?.metadata ? response.metadata?.cost.total_cost : 0,
        inputCost: response?.metadata ? response.metadata?.cost.input_cost : 0,
        outputCost: response?.metadata
          ? response.metadata?.cost.output_cost
          : 0,
        timeTaken: response?.total_time ? response.total_time : 0,
      });

      return message;
    } catch (error) {
      console.log('error at get res', error);
      throw new BadGatewayException(error?.message);
    }
  }

  async getAiRes(body: singleAiChat): Promise<singleAiChatRes> {
    try {
      return await axios
        .post(
          `${process.env.AGENT_BASE_URL}/${process.env.CHAT_END_POINT}`,
          body, // Pass the body object here
          {
            headers: {
              'Content-Type': 'application/json', // Add headers if needed
            },
          },
        )
        .then((res) => {
          return res?.data;
        })
        .catch((err) => {
          console.log('error at agent', err?.response?.data?.detail);

          throw new BadGatewayException(err?.response?.data?.detail);
        });
    } catch (err) {
      console.log('error at wrapper', err);
      throw new BadGatewayException(err);
    }
  }

  async getResponseForLlmRouter(
    messageData: askNewQuestionForLlmRouter,
    user: CuurentUser,
  ): Promise<chatReplyForLlmRouter> {
    try {
      let body = {
        user_query: messageData?.content,
        strong_model: messageData?.model1,
        weak_model: messageData?.model2,
        user_id: String(user._id),
        routing_threshold: messageData?.routing_threshold,
      };

      console.log('body: ', body);
      let response: singleAiChatRes = await this.getAiResRouter(body);

      const message = await this.createChat({
        content: response?.response,
        messageId: uuidv4(),
        model: response.model_used,
        role: 'assistant',
        userId: user?._id,
        type: messageData?.type,
        contentType: 'answer',
        queryId: messageData?.messageId,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        totalToken: response?.metadata
          ? response.metadata?.tokens.total_tokens
          : 0,
        inputToken: response?.metadata
          ? response.metadata?.tokens.input_tokens
          : 0,
        outputToken: response?.metadata
          ? response.metadata?.tokens.output_tokens
          : 0,
        totalCost: response?.metadata ? response.metadata?.cost.total_cost : 0,
        inputCost: response?.metadata ? response.metadata?.cost.input_cost : 0,
        outputCost: response?.metadata
          ? response.metadata?.cost.output_cost
          : 0,
        timeTaken: response?.total_time ? response.total_time : 0,
      });

      return message;
    } catch (error) {
      console.log('error at get res', error);
      throw new BadGatewayException(error?.message);
    }
  }

  async getAiResRouter(body: aiRouterChat): Promise<singleAiChatRes> {
    try {
      return await axios
        .post(
          `${process.env.AGENT_BASE_URL}/${process.env.ROUTER_END_POINT}`,
          body, // Pass the body object here
          {
            headers: {
              'Content-Type': 'application/json', // Add headers if needed
            },
          },
        )
        .then((res) => {
          return res?.data;
        })
        .catch((err) => {
          throw new BadGatewayException(err?.response?.data?.detail);
        });
    } catch (err) {
      console.log('error at wrapper', err);
      throw new BadGatewayException(err);
    }
  }

  async getResponseForMetrics(
    messageData: metricsRun,
    user: CuurentUser,
  ): Promise<any> {
    try {
      let body = {
        ...messageData,
        user_id: String(user?._id),
      };
      console.log('body: ', body);
      return await axios
        .post(
          `${process.env.AGENT_BASE_URL}/${process.env.CUSTOM_METRICE_END_POINT}`,
          body, // Pass the body object here
          {
            headers: {
              'Content-Type': 'application/json', // Add headers if needed
            },
          },
        )
        .then((res) => {
          return res?.data;
        })
        .catch((err) => {
          throw new BadGatewayException(err?.response?.data?.detail);
        });
    } catch (err) {
      throw new BadGatewayException(err?.response?.data?.detail);
    }
  }
}
