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
      return res?.response;
    } catch (err) {
      console.log(err.message);
      throw new BadGatewayException(err?.message);
    }
  }
}
