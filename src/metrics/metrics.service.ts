import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Metrics, MetricsDocument } from './metrics.schema';
import { AiServiceService } from 'src/ai-service/ai-service.service';
import { metricsRun } from './dto/ask';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';

@Injectable()
export class MetricsService {
  constructor(
    @InjectModel(Metrics.name) private MetricsModel: Model<MetricsDocument>,
    private readonly aiService: AiServiceService,
  ) {}

  async ask(messageData: metricsRun, user: CuurentUser) {
    try {
      let res = await this.aiService.getResponseForMetrics(messageData, user);

      if (!res) {
        res = [
          {
            prompt:
              'He is approaching the end of his 10th year in charge and thinks it is the right time to seek a fresh challenge.\nCricket Scotland chairman Keith Oliver said: "There is no doubt that the governing body of cricket in Scotland is unrecognisable from where we were in 2004.\n"And the credit for this must go to Roddy and his staff."\nDuring Smith\'s time as chief executive, his management team have increased from eight to 25 and turnover has quadrupled.\nI am delighted that I leave an organisation in good health with a growing game and after a year of exceptional on-field performances by national teams at all levels\nCricket Scotland reported a rise in participation figures for players, coaches and umpires during those 10 years.\nAnd the national side have secured a place at next year\'s World Cup finals in Australia and New Zealand by beating Kenya in a qualifying event.\nOliver, who has worked with Smith during that whole period, said: "Back then, we could not have imagined we would have won global qualifying events, played in world cups at youth and senior level, played One Day International games in front of thousands, run a fully professional national team as well as winning numerous development awards at a European and Global level.\n"I and all at Cricket Scotland wish Roddy every success in his next role."\nCricket Scotland will start the recruitment process to find Smith\'s successor with the aim of having a replacement in place early in the new year.\nSmith said: "I have thoroughly enjoyed my time with Cricket Scotland and it\'s hard to believe it has been nearly a decade.\n"I am delighted that I leave an organisation in good health with a growing game and after a year of exceptional on-field performances by national teams at all levels.\n"Ten years is a long time for a chief executive of a national governing body and now feels exactly the right time to move on to my next challenge.\n"With a Cricket World Cup to look forward to early next year and a number of newly-appointed quality staff to work with,\nI am looking forward to handing over to my successor an organisation that is very well placed to succeed in the future."\nnew pavilion at the home of Stirling County Cricket Club designed to host international matches.',
            response:
              'Cricket Scotland chief executive Roddy Smith has announced that he will leave the role at the end of December.',
            [`${messageData?.evaluation_metrice}/explanation`]:
              'The response is fully grounded. The information provided in the response is included in the prompt. The response states that "Cricket Scotland chief executive Roddy Smith has announced that he will leave the role at the end of December." This information can be found in the prompt\'s first sentence: "He is approaching the end of his 10th year in charge and thinks it is the right time to seek a fresh challenge." Thus, the response fulfills the requirement of groundedness.',
            [`${messageData?.evaluation_metrice}/score`]: '1.0',
          },
        ];
      }
      await this.MetricsModel.create({
        ...messageData,
        response: JSON.stringify(res),
        userId: user._id,
      });

      return res;
    } catch (err) {
      throw new BadGatewayException(err?.message);
    }
  }
}
