import { Module } from '@nestjs/common';
import { LlmRouterService } from './llm-router.service';
import { LlmRouterController } from './llm-router.controller';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/chat/schema/message.schema';
import { AiServiceModule } from 'src/ai-service/ai-service.module';
import { TopicModule } from 'src/topic/topic.module';

const passportModule = PassportModule.register({
  defaultStrategy: 'jwt',
});

@Module({
  imports: [
    passportModule,
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    AiServiceModule,
    TopicModule,
  ],
  providers: [LlmRouterService],
  exports: [LlmRouterService],
  controllers: [LlmRouterController],
})
export class LlmRouterModule {}
