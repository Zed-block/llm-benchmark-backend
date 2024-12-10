import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Metrics, MetricsSchema } from './metrics.schema';
import { AiServiceModule } from 'src/ai-service/ai-service.module';
import { PassportModule } from '@nestjs/passport';

const passportModule = PassportModule.register({
  defaultStrategy: 'jwt',
});

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Metrics.name, schema: MetricsSchema }]),
    AiServiceModule,
    passportModule,
  ],
  controllers: [MetricsController],
  exports: [MetricsService],
  providers: [MetricsService],
})
export class MetricsModule {}
