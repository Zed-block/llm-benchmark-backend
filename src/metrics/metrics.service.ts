import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Metrics, MetricsDocument } from './metrics.schema';
import { AiServiceService } from 'src/ai-service/ai-service.service';
import { metricsRun, metricsRunInput, metricsRunInputForDb } from './dto/ask';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { metricChat, metricChatRes } from 'src/ai-service/dto/metricChat';
import { UserFiles, UserFilesDocument } from 'src/user-files/user-files.schema';
import { StorageService } from 'src/storage/storage.service';
import { TopicService } from 'src/topic/topic.service';
import { v4 as uuidv4 } from 'uuid';
import { EvaluationStatus } from './schema/evaluationStatus.schema';
import { EvaluationData } from './schema/evaluationData.schema';

@Injectable()
export class MetricsService {
  constructor(
    @InjectModel(Metrics.name) private MetricsModel: Model<MetricsDocument>,
    @InjectModel(EvaluationStatus.name)
    private evaluationStatusModel: Model<EvaluationStatus>,
    @InjectModel(EvaluationData.name)
    private evaluationDataModel: Model<EvaluationData>,
    private readonly aiService: AiServiceService,
    @InjectModel(UserFiles.name)
    private userFilesModel: Model<UserFilesDocument>,
    private readonly storageService: StorageService,
    private readonly topicService: TopicService,
  ) {}

  async metricCallWithoutDb(messageData: metricsRunInput, user: CuurentUser) {
    try {
      let topicBody = {
        title:
          messageData?.evaluation_metrice +
            '-' +
            messageData?.evaluation_type || 'noType',
        type: 'metrics',
        userId: user?._id,
      };
      let topic = await this.topicService.createTopic(topicBody);
      messageData.topicId = String(topic._id);

      let res: metricChatRes = await this.aiService.getResponseForMetrics(
        messageData,
        user,
      );

      console.log('res: ', res);

      let inputToken = 0;
      let outputToken = 0;
      let totalToken = 0;

      let inputCost = 0;
      let outputCost = 0;
      let totalCost = 0;

      // Check if metadata exists
      if (res.metadata) {
        // Case 1: Metadata is an array
        if (Array.isArray(res.metadata)) {
          for (let metadata of res.metadata) {
            inputToken += metadata.tokens.input_tokens;
            outputToken += metadata.tokens.output_tokens;
            totalToken += metadata.tokens.total_tokens;

            inputCost += metadata.cost.input_cost;
            outputCost += metadata.cost.output_cost;
            totalCost += metadata.cost.total_cost;
          }
        }
        // Case 2: Metadata is a single object
        else if (typeof res.metadata === 'object') {
          inputToken += res.metadata.tokens.input_tokens;
          outputToken += res.metadata.tokens.output_tokens;
          totalToken += res.metadata.tokens.total_tokens;

          inputCost += res.metadata.cost.input_cost;
          outputCost += res.metadata.cost.output_cost;
          totalCost += res.metadata.cost.total_cost;
        }
      }

      // Case 3: Metadata is null or undefined - no action needed

      console.log('Input Tokens: ', inputToken);
      console.log('Output Tokens: ', outputToken);
      console.log('Total Tokens: ', totalToken);

      console.log('Input Cost: ', inputCost);
      console.log('Output Cost: ', outputCost);
      console.log('Total Cost: ', totalCost);

      await this.MetricsModel.create({
        ...messageData,
        response: JSON.stringify(res.response),
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        metadata: res?.metadata || null,
        ...(messageData?.messageTopic && {
          messageTopic: new mongoose.Types.ObjectId(messageData?.messageTopic),
        }),
        userId: user._id,
        inputToken,
        outputToken,
        totalToken,
        inputCost,
        outputCost,
        totalCost,
        timeTaken: res?.total_time || 0,
      });
      return {
        response: res?.response,
        topic: messageData.topicId,
      };
    } catch (err) {
      console.log(err.message);
      throw new BadGatewayException(err?.message);
    }
  }

  async metricCallWithDb(messageData: metricsRunInputForDb, user: CuurentUser) {
    try {
      let topicBody = {
        title:
          messageData?.evaluation_metrice +
            '-' +
            messageData?.evaluation_type || 'noType',
        type: 'metrics-database',
        userId: user?._id,
        fileId: messageData?.fileId,
      };
      let topic = await this.topicService.createTopic(topicBody);
      messageData.topicId = String(topic._id);

      let file = await this.userFilesModel.findById(
        new mongoose.Types.ObjectId(messageData?.fileId),
      );

      let updatedData = {
        judge_model: messageData?.judge_model,
        evaluation_metrice: messageData?.evaluation_metrice,
        evaluation_type: messageData?.evaluation_type,
        dataset_path: file.path,
        topic_id: messageData?.topicId,
        file_id: messageData?.fileId,
      };

      let res: metricChatRes =
        await this.aiService.getResponseForDatabaseMetrics(updatedData, user);

      await this.MetricsModel.create({
        ...messageData,
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        userId: user._id,
      });
      return {
        response: res,
        topic: messageData.topicId,
      };
    } catch (err) {
      console.log(err.message);
      throw new BadGatewayException(err?.message);
    }
  }

  async ask(
    messageData: metricsRunInput | metricsRunInputForDb,
    user: CuurentUser,
  ) {
    try {
      if (messageData?.fileId) {
        //@ts-ignore
        return await this.metricCallWithDb(messageData, user);
      } else {
        return await this.metricCallWithoutDb(messageData, user);
      }
    } catch (err) {
      console.log(err.message);
      throw new BadGatewayException(err?.message);
    }
  }

  async getdbMetricsResHistory(
    metric: string,
    type: string,
    dbId: string,
    user: CuurentUser,
  ) {
    try {
      const dataExist = await this.evaluationStatusModel.findOne({
        evaluation_metrice: metric,
        evaluation_type: type,
        file_id: dbId,
        userId: user._id,
      });

      return dataExist;
    } catch (err) {
      console.log(err.message);
      throw new BadGatewayException(err?.message);
    }
  }

  async getMetricsRes(metricTopic: string, user: CuurentUser) {
    try {
      let data = await this.MetricsModel.findOne({
        topicId: new mongoose.Types.ObjectId(metricTopic),
      });

      return data;
    } catch (err) {
      console.log(err.message);
      throw new BadGatewayException(err?.message);
    }
  }

  async getdbMetricsRes(runId: string, user: CuurentUser) {
    try {
      const status = await this.evaluationStatusModel.findOne({
        topic_id: runId,
      });
      if (status?.status === 'COMPLETED') {
        let data = await this.evaluationDataModel.find({ topic_id: runId });
        let metricRes = await this.MetricsModel.findOne({
          topicId: new mongoose.Types.ObjectId(String(runId)),
        });

        if (!metricRes?.response) {
          let res = [];

          data?.map((item) => {
            if (item.response && item.response?.length > 0) {
              if (Array.isArray(item?.response)) {
                res = [...res, ...item.response];
              } else {
                res = [...res, item.response];
              }
            }
          });

          await this.MetricsModel.findOneAndUpdate(
            {
              topicId: new mongoose.Types.ObjectId(String(runId)),
            },
            {
              $set: {
                response: JSON.stringify(res),
              },
            },
          );
        }

        return {
          response: data,
          resType: 'COMPLETED',
          message: null,
        };
      }
      if (status?.status === 'PROCESSING') {
        return {
          resType: 'PROCESSING',
          message: 'Your request is processing',
        };
      }
      if (status?.status === 'STARTED') {
        return {
          resType: 'STARTED',
          message:
            'Dataset evaluation started. You will be notified upon completion.',
        };
      }
      if (status?.status === 'ERROR') {
        return {
          resType: 'ERROR',
          message: status?.error_details?.type || 'Error',
        };
      }
      return {
        resType: 'ERROR',
        message: 'Error at status',
      };
    } catch (err) {
      console.log(err.message);
      throw new BadGatewayException(err?.message);
    }
  }
}
