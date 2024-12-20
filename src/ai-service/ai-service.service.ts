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
import {
  jailBreakDataType,
  llmContextDataType,
  metricsRun,
  metricsRunForDb,
  multiqueryaccuracyDataType,
  pairWiseData,
  pointWiseData,
} from 'src/metrics/dto/ask';
import { singleAiChat, singleAiChatRes } from './dto/singleChat';
import { aiRouterChat } from './dto/router';
import {
  jailBreakCustomMetriceDataType,
  llmCustomMetriceDataType,
  multiqueryaccuracyCustomMetriceDataType,
  PairWiseMetrice,
  PointWiseMetrice,
} from 'src/metrics/metrics.schema';

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
        compareQuestionId: messageData?.compareQuestionId,
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
        strong_model: messageData?.strongModels,
        weak_model: messageData?.weakModels,
        // user_id: String(user._id),
        user_id: "674b0e9a79225f671d038826",
        topic_id: String(messageData?.topicId),
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
      throw new BadGatewayException(error);
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
          console.log(
            'err?.response?.data?.detail: ',
            err?.response?.data?.detail,
          );
          throw new BadGatewayException(err?.response?.data?.detail);
        });
    } catch (err) {
      console.log('error at wrapper', err);
      throw new BadGatewayException(err);
    }
  }

  async getEndPoint(data: metricsRun): Promise<string> {
    if (
      data?.evaluation_metrice === 'jailbreak' ||
      data?.evaluation_metrice === 'multi_query_accuracy'
    ) {
      return process.env.JAILBREAK_AND_MULTIQUERY_END_POINT;
    }
    if (data?.evaluation_metrice === 'LLMContexRecall') {
      return process.env.LLMContexRecall_END_POINT;
    }
    return process.env.CUSTOM_METRICE_END_POINT;
  }

  async validateMetricsData(data: metricsRun): Promise<metricsRun> {
    try {
      if (
        data?.evaluation_metrice != 'jailbreak' &&
        data?.evaluation_metrice != 'multi_query_accuracy' &&
        data?.evaluation_metrice != 'LLMContexRecall'
      ) {
        if (data?.evaluation_type === 'pointwise') {
          const { evaluation_metrice, evaluation_type, custom_metrice_data } =
            data;
          const newMsgData: pointWiseData = {
            evaluation_metrice,
            evaluation_type,
          };

          // Initialize custom_metrice_data if applicable
          if (custom_metrice_data) {
            const customData: Partial<PointWiseMetrice> = {};

            if ('prompt' in custom_metrice_data && custom_metrice_data.prompt) {
              customData.prompt = custom_metrice_data.prompt;
            }

            if (
              'response' in custom_metrice_data &&
              custom_metrice_data.response &&
              custom_metrice_data.response?.length > 0
            ) {
              customData.response = custom_metrice_data.response as string;
            }

            if (
              'history' in custom_metrice_data &&
              custom_metrice_data.history &&
              (data?.evaluation_metrice == 'multi_turn_chat_safety' ||
                data?.evaluation_metrice == 'multi_turn_chat_quality')
            ) {
              customData.history = custom_metrice_data.history as string;
            }

            //@ts-ignore
            newMsgData.custom_metrice_data =
              Object.keys(customData).length > 0 ? customData : undefined;
          }

          // Add response_model_name if response is missing
          if (
            !custom_metrice_data?.response ||
            custom_metrice_data.response?.length == 0
          ) {
            newMsgData.response_model_name = data.response_model_name;
          }

          // Add response_model_name if response is missing

          return newMsgData;
        } else {
          const {
            evaluation_metrice,
            evaluation_type,
            custom_metrice_data,
            response_model_name,
            baseline_model_name,
          } = data;
          const newMsgData: pairWiseData = {
            evaluation_metrice,
            evaluation_type,
          };

          // Initialize custom_metrice_data if applicable
          if (custom_metrice_data) {
            const customData: Partial<PairWiseMetrice> = {};

            if ('prompt' in custom_metrice_data && custom_metrice_data.prompt) {
              customData.prompt = custom_metrice_data.prompt;
            }

            if (
              'response' in custom_metrice_data &&
              custom_metrice_data.response &&
              custom_metrice_data.response?.length > 0
            ) {
              customData.response = custom_metrice_data.response as string;
            }
            if (
              'baseline_model_response' in custom_metrice_data &&
              custom_metrice_data.baseline_model_response &&
              custom_metrice_data.baseline_model_response?.length > 0
            ) {
              customData.baseline_model_response =
                custom_metrice_data.baseline_model_response as string;
            }

            if (
              'history' in custom_metrice_data &&
              custom_metrice_data.history &&
              (data?.evaluation_metrice == 'multi_turn_chat_safety' ||
                data?.evaluation_metrice == 'multi_turn_chat_quality')
            ) {
              customData.history = custom_metrice_data.history as string;
            }

            //@ts-ignore
            newMsgData.custom_metrice_data =
              Object.keys(customData).length > 0 ? customData : undefined;
          }

          // Add response_model_name if response is missing
          if (
            !custom_metrice_data?.response ||
            custom_metrice_data.response?.length == 0
          ) {
            newMsgData.response_model_name = response_model_name;
          }

          if (
            //@ts-ignore
            !custom_metrice_data?.baseline_model_response ||
            //@ts-ignore
            custom_metrice_data?.baseline_model_response?.length == 0
          ) {
            newMsgData.baseline_model_name = baseline_model_name;
          }
          return newMsgData;
        }
      } else {
        if (data?.evaluation_metrice == 'jailbreak') {
          const {
            evaluation_metrice,
            response_model_name,
            custom_metrice_data,
          } = data;
          const newMsgData: jailBreakDataType = {
            evaluation_metrice,
            response_model_name,
          };

          if (custom_metrice_data) {
            const customData: Partial<jailBreakCustomMetriceDataType> = {};

            if (
              'question' in custom_metrice_data &&
              custom_metrice_data.question
            ) {
              customData.question = custom_metrice_data.question;
            }

            if (
              'response' in custom_metrice_data &&
              custom_metrice_data.response &&
              custom_metrice_data.response?.length > 0
            ) {
              customData.response = custom_metrice_data.response as string;
            }

            //@ts-ignore
            newMsgData.custom_metrice_data =
              Object.keys(customData).length > 0 ? customData : undefined;
          }
          return newMsgData;
        }
        if (data?.evaluation_metrice == 'multi_query_accuracy') {
          const {
            evaluation_metrice,
            response_model_name,
            custom_metrice_data,
          } = data;
          const newMsgData: multiqueryaccuracyDataType = {
            evaluation_metrice,
            response_model_name,
          };

          if (custom_metrice_data) {
            const customData: Partial<multiqueryaccuracyCustomMetriceDataType> =
              {};

            if (
              'question' in custom_metrice_data &&
              custom_metrice_data.question
            ) {
              customData.question = custom_metrice_data.question;
            }

            if (
              'response' in custom_metrice_data &&
              custom_metrice_data.response &&
              custom_metrice_data.response?.length > 0
            ) {
              let arr = [];
              if (
                custom_metrice_data.response[0] &&
                custom_metrice_data.response[0]?.length > 0
              ) {
                arr.push(custom_metrice_data.response[0]);
              }
              if (
                custom_metrice_data.response[1] &&
                custom_metrice_data.response[1]?.length > 0
              ) {
                arr.push(custom_metrice_data.response[1]);
              }

              if (arr?.length > 0) {
                customData.response = arr;
              }
            }

            //@ts-ignore
            newMsgData.custom_metrice_data =
              Object.keys(customData).length > 0 ? customData : undefined;
          }
          return newMsgData;
        }
        if (data?.evaluation_metrice == 'LLMContexRecall') {
          const {
            evaluation_metrice,
            response_model_name,
            custom_metrice_data,
          } = data;
          const newMsgData: llmContextDataType = {
            evaluation_metrice,
            response_model_name,
          };

          if (custom_metrice_data) {
            const customData: Partial<llmCustomMetriceDataType> = {};

            if (
              'question' in custom_metrice_data &&
              custom_metrice_data.question
            ) {
              customData.question = custom_metrice_data.question;
            }

            if (
              'response' in custom_metrice_data &&
              custom_metrice_data.response &&
              custom_metrice_data.response?.length > 0
            ) {
              customData.response = custom_metrice_data.response as string;
            }

            if (
              'context' in custom_metrice_data &&
              custom_metrice_data.context &&
              custom_metrice_data.context?.length > 0
            ) {
              let newContext = [];
              //@ts-ignore
              data?.custom_metrice_data.context?.forEach((item) => {
                if (item?.trim()?.length > 0) {
                  newContext = [...newContext, item];
                }
              });
              customData.context = newContext;
            }

            //@ts-ignore
            newMsgData.custom_metrice_data =
              Object.keys(customData).length > 0 ? customData : undefined;
          }
          return newMsgData;
        }
        return data;
      }
    } catch (err) {
      console.log('err', err.message);
    }
  }

  async getResponseForMetrics(
    messageData: metricsRun,
    user: CuurentUser,
  ): Promise<any> {
    try {
      let validateData = await this.validateMetricsData(messageData);
      let body = {
        ...validateData,
        user_id: String(user?._id),
      };
      let endPoint = await this.getEndPoint(body);

      if (
        body?.evaluation_metrice === 'jailbreak' ||
        body?.evaluation_metrice === 'LLMContexRecall' ||
        body?.evaluation_metrice === 'multi_query_accuracy'
      ) {
        if (body?.response_model_name) {
          let { response_model_name, ...rest } = body;
          body = {
            ...rest,
            model_name: body?.response_model_name,
          };
        }
      }
      console.log('data,', body);
      return await axios
        .post(
          `${process.env.AGENT_BASE_URL}/${endPoint}`,
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
          console.log('err?.response', err?.response?.data);
          throw new BadGatewayException(err?.response?.data?.detail);
        });
    } catch (err) {
      throw new BadGatewayException(err);
    }
  }

  async getResponseForDatabaseMetrics(
    messageData: metricsRunForDb,
    user: CuurentUser,
  ): Promise<any> {
    try {
      let body = {
        ...messageData,
        user_id: String(user?._id),
      };

      console.log('data,', JSON.stringify(body));
      return await axios
        .post(
          `${process.env.AGENT_BASE_URL}/${process.env.DATASET_METRICE_EVALUATION_END_POINT}`,
          body, // Pass the body object here
          {
            headers: {
              'Content-Type': 'application/json', // Add headers if needed
            },
          },
        )
        .then((res) => {
          return {
            resType: 'STARTED',
            message: res?.data?.response,
          };
        })
        .catch((err) => {
          console.log('err?.response', err?.response?.data);
          return {
            resType: 'ERROR',
            message: err?.response?.data?.detail,
          };
        });
    } catch (err) {
      return {
        resType: 'ERROR',
        message: err,
      };
    }
  }

  async validateApiKey(data: {
    api_key: string;
    provider: string;
  }): Promise<any> {
    try {
      return await axios
        .post(
          `${process.env.AGENT_BASE_URL}/${process.env.API_KEY_VALIDATION_END_POINT}`,
          data,
          // Pass the body object here
          {
            headers: {
              'Content-Type': 'application/json', // Add headers if needed
            },
          },
        )
        .then((res) => {
          return res?.data?.validate;
        })
        .catch((err) => {
          throw new BadGatewayException(err.response.data.detail);
        });
    } catch (err) {
      throw new BadGatewayException(err);
    }
  }
}
