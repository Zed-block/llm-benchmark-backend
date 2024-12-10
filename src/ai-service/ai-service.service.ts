import { Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { askQuestion } from 'src/chat/dto/addNewMessage';
import { Message, MessageDocument } from 'src/chat/schema/message.schema';
import { v4 as uuidv4 } from 'uuid';
import { chatReply } from './dto/addNewMessage';
import {
  askNewQuestionForCompare,
  askNewQuestionForLlmRouter,
  responseForCompare,
} from './dto/addNewMessageForLlmRouter';
import { chatReplyForLlmRouter } from './dto/replyForLlmRouter';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { metricsRun } from 'src/metrics/dto/ask';

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
    return new Promise(async (resolve) => {
      let body = {
        system_prompt: messageData?.instruction,
        user_query: messageData?.content,
        model_name: messageData?.model,
        model_provider: messageData?.provider,
        user_id: String(user?._id),
        // user_id: '674b0e9a79225f671d038826',
      };

      let response = 'hi its res';
      try {
        await axios
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
            let apiRes = res?.data;
            if (apiRes) {
              response = apiRes;
            }
          })
          .catch((err) => {
            // console.log('err at agent', err);
          });
      } catch (err) {
        console.log('err at agent', err.message);
      }

      const message = await this.createChat({
        content: response,
        messageId: uuidv4(),
        instruction: messageData?.instruction,
        model: messageData.model,
        role: 'assistant',
        provider: messageData?.provider,
        temperature: messageData?.temperature,
        userId: user?._id,
        type: messageData?.type,
        contentType: 'answer',
        queryId: messageData?.messageId,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
      });
      resolve(message);
    });
  }

  async getResponseForLlmRouter(
    messageData: askNewQuestionForLlmRouter,
    user: CuurentUser,
  ): Promise<chatReplyForLlmRouter> {
    return new Promise(async (resolve) => {
      const message = await this.createChat({
        content: 'hi its res',
        messageId: uuidv4(),
        model: messageData.model1,
        role: 'assistant',
        userId: user?._id,
        type: messageData?.type,
        contentType: 'answer',
        queryId: messageData?.messageId,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
      });
      setTimeout(() => {
        resolve(message); // Delay for 2 seconds
      }, 2000);
    });
  }

  async getResponseForCompare(
    messageData: askNewQuestionForCompare,
    user: CuurentUser,
    i: number,
  ): Promise<responseForCompare> {
    return new Promise(async (resolve) => {
      const message = await this.createChat({
        content: `hi its res ${i}`,
        messageId: uuidv4(),
        model: messageData.model,
        role: 'assistant',
        userId: user?._id,
        type: messageData?.type,
        contentType: 'answer',
        queryId: messageData?.messageId,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        instruction: messageData?.instruction,
        compareId:messageData?.compareId
      });

      setTimeout(() => {
        resolve(message); // Delay for 2 seconds
      }, 2000);
    });
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
          return;
        });
    } catch (err) {
      return;
    }
  }
}
