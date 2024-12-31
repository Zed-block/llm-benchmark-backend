import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schema/message.schema';
import { AiServiceModule } from 'src/ai-service/ai-service.module';
import { PassportModule } from '@nestjs/passport';
import { TopicModule } from 'src/topic/topic.module';
import {
  RoutingModels,
  RoutingModelsSchema,
} from './schema/routing_models.schema';
import { UserFiles, UserFilesSchema } from 'src/user-files/user-files.schema';
import { StorageModule } from 'src/storage/storage.module';

const passportModule = PassportModule.register({
  defaultStrategy: 'jwt',
});

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    MongooseModule.forFeature([
      { name: RoutingModels.name, schema: RoutingModelsSchema },
      { name: UserFiles.name, schema: UserFilesSchema },
    ]),
    AiServiceModule,
    passportModule,
    TopicModule,
    StorageModule,
  ],
  providers: [ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
