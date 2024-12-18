import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './auth/jwt.startegy';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { StorageKeyModule } from './storage-key/storage-key.module';
import { ChatModule } from './chat/chat.module';
import { AiServiceModule } from './ai-service/ai-service.module';
import { TopicModule } from './topic/topic.module';
import { LlmRouterController } from './llm-router/llm-router.controller';
import { LlmRouterService } from './llm-router/llm-router.service';
import { LlmRouterModule } from './llm-router/llm-router.module';
import { Message, MessageSchema } from './chat/schema/message.schema';
import { CompareModule } from './compare/compare.module';
import { MetricsModule } from './metrics/metrics.module';
import { PromptModule } from './prompt/prompt.module';
import { UserFilesModule } from './user-files/user-files.module';
import { StorageController } from './storage/storage.controller';
import { StorageService } from './storage/storage.service';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				uri: configService.get("MongoURL"),
				useUnifiedTopology: true,
				useNewUrlParser: true,
			}),
		}),
    ConfigModule.forRoot({
      isGlobal: true,  // Make ConfigService globally available
    }),
    UserModule,
    AuthModule,
    StorageKeyModule,
    ChatModule,
    AiServiceModule,
    TopicModule,
    LlmRouterModule,
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    CompareModule,
    MetricsModule,
    PromptModule,
    UserFilesModule,
    StorageModule,
  ],
  controllers: [AppController, LlmRouterController, StorageController],
  providers: [JwtStrategy,AppService, LlmRouterService, StorageService],
  exports: [JwtModule], // Export JwtModule if needed elsewhere
})
export class AppModule {}
