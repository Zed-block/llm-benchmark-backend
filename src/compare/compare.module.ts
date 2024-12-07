import { Module } from '@nestjs/common';
import { CompareService } from './compare.service';
import { CompareController } from './compare.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/chat/schema/message.schema';
import { AiServiceModule } from 'src/ai-service/ai-service.module';
import { PassportModule } from '@nestjs/passport';
import { TopicModule } from 'src/topic/topic.module';


const passportModule = PassportModule.register({
  defaultStrategy: 'jwt',
});

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    AiServiceModule,
    passportModule,
    TopicModule
  ],
  providers: [CompareService],
  exports: [CompareService],
  controllers: [CompareController]
})
export class CompareModule {}
