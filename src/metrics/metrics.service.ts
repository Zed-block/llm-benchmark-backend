import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Metrics, MetricsDocument } from './metrics.schema';
import { AiServiceService } from 'src/ai-service/ai-service.service';
import { metricsRun } from './dto/ask';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { metricChat, metricChatRes } from 'src/ai-service/dto/metricChat';
import { UserFiles, UserFilesDocument } from 'src/user-files/user-files.schema';
import { StorageService } from 'src/storage/storage.service';
import { TopicService } from 'src/topic/topic.service';

@Injectable()
export class MetricsService {
  constructor(
    @InjectModel(Metrics.name) private MetricsModel: Model<MetricsDocument>,
    private readonly aiService: AiServiceService,
    @InjectModel(UserFiles.name)
    private userFilesModel: Model<UserFilesDocument>,
    private readonly storageService: StorageService,
    private readonly topicService: TopicService,
  ) {}

  async ask(messageData: metricsRun, user: CuurentUser) {
    try {
      if (!messageData?.topicId) {
        let topicBody = {
          title:
            messageData?.evaluation_metrice +
            '-' +
            messageData?.evaluation_type,
          type: 'metrics',
          userId: user?._id,
        };
        let topic = await this.topicService.createTopic(topicBody);
        messageData.topicId = String(topic._id);
      }

      if (messageData?.fileId) {
        let file = await this.userFilesModel.findById(
          new mongoose.Types.ObjectId(messageData?.fileId),
        );

        messageData = {
          evaluation_metrice: messageData?.evaluation_metrice,
          evaluation_type: messageData?.evaluation_type,
          dataset_path: file.path,
          topicId: messageData?.topicId,
        };
      }

      let res: metricChatRes = await this.aiService.getResponseForMetrics(
        messageData,
        user,
      );

      let inputToken = 0;
      let outputToken = 0;
      let totalToken = 0;

      let inputCost = 0;
      let outputCost = 0;
      let totalCost = 0;

      // Check if metadata exists
      if (res.metadata && res.metadata.length > 0) {
        // Loop through metadata array and calculate totals
        for (let metadata of res.metadata) {
          inputToken += metadata.tokens.input_tokens;
          outputToken += metadata.tokens.output_tokens;
          totalToken += metadata.tokens.total_tokens;

          inputCost += metadata.cost.input_cost;
          outputCost += metadata.cost.output_cost;
          totalCost += metadata.cost.total_cost;
        }
      }

      await this.MetricsModel.create({
        ...messageData,
        response: JSON.stringify(res.response),
        topicId: new mongoose.Types.ObjectId(messageData?.topicId),
        metadata: res?.metadata || null,
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
}
