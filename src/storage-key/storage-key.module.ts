import { Module } from '@nestjs/common';
import { StorageKeyController } from './storage-key.controller';
import { StorageKeyService } from './storage-key.service';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { Key, KeySchema } from './storage.schema';
import { AiServiceModule } from 'src/ai-service/ai-service.module';

@Module({
  imports:[
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([{ name: Key.name, schema: KeySchema }]),
    AiServiceModule
  ],
  controllers: [StorageKeyController],
  providers: [StorageKeyService]
})
export class StorageKeyModule {}
