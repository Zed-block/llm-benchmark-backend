import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Metrics, MetricsDocument } from './metrics.schema';
import { AiServiceService } from 'src/ai-service/ai-service.service';
import { metricsRun } from './dto/ask';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { metricChat, metricChatRes } from 'src/ai-service/dto/metricChat';

@Injectable()
export class MetricsService {
  constructor(
    @InjectModel(Metrics.name) private MetricsModel: Model<MetricsDocument>,
    private readonly aiService: AiServiceService,
  ) {}

  async ask(messageData: metricsRun, user: CuurentUser) {
    try {
      let res: metricChatRes = await this.aiService.getResponseForMetrics(
        messageData,
        user,
      );

      console.log('res: ', res);

      if (res?.metadata) {
        await this.MetricsModel.create({
          ...messageData,
          response: JSON.stringify(res.response),
          metadata: res?.metadata || null,
          userId: user._id,
        });
      } else {
        await this.MetricsModel.create({
          ...messageData,
          response: JSON.stringify(res.response),
          userId: user._id,
        });
      }

      return res?.response;
    } catch (err) {
      console.log(err.message);
      throw new BadGatewayException(err?.message);
    }
  }
}
