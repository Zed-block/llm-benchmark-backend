import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Metrics, MetricsSchema } from './metrics.schema';
import { AiServiceModule } from 'src/ai-service/ai-service.module';
import { PassportModule } from '@nestjs/passport';
import { UserFiles, UserFilesSchema } from 'src/user-files/user-files.schema';
import { StorageModule } from 'src/storage/storage.module';
import { TopicModule } from 'src/topic/topic.module';
import { EvaluationData, EvaluationDataSchema } from './schema/evaluationData.schema';
import { EvaluationStatus, EvaluationStatusSchema } from './schema/evaluationStatus.schema';

const passportModule = PassportModule.register({
  defaultStrategy: 'jwt',
});

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Metrics.name, schema: MetricsSchema }]),
    MongooseModule.forFeature([
      { name: UserFiles.name, schema: UserFilesSchema },
    ]),
    MongooseModule.forFeature([
      { name: EvaluationData.name, schema: EvaluationDataSchema },
    ]),
    MongooseModule.forFeature([
      { name: EvaluationStatus.name, schema: EvaluationStatusSchema },
    ]),
    AiServiceModule,
    passportModule,
    StorageModule,
    TopicModule
  ],
  controllers: [MetricsController],
  exports: [MetricsService],
  providers: [MetricsService],
})
export class MetricsModule {}
