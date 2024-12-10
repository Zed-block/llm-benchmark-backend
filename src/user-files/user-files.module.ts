import { Module } from '@nestjs/common';
import { UserFilesService } from './user-files.service';
import { UserFilesController } from './user-files.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserFiles, UserFilesSchema } from './user-files.schema';
import { PassportModule } from '@nestjs/passport';
import { StorageModule } from 'src/storage/storage.module';

const passportModule = PassportModule.register({
  defaultStrategy: 'jwt',
});

@Module({
  imports: [
    passportModule,
    MongooseModule.forFeature([
      { name: UserFiles.name, schema: UserFilesSchema },
    ]),
    StorageModule
  ],
  providers: [UserFilesService],
  exports: [UserFilesService],
  controllers: [UserFilesController],
})
export class UserFilesModule {}
