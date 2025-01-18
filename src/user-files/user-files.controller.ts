import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserFiles, UserFilesDocument } from './user-files.schema';
import { Model } from 'mongoose';
import { UserFilesService } from './user-files.service';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { AddFile } from './dto/ask';

@Controller('user-files')
export class UserFilesController {
  constructor(private readonly userFilesService: UserFilesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('')
  @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files
  async uploadMultipleFiles(
    @UploadedFiles() files: any[],
    @Body() body: AddFile,
    @CurrentUser() user: CuurentUser,
  ) {
    const parsedType = JSON.parse(body.type);
    return await this.userFilesService.addFile(user, files, parsedType,body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(
    @Query('search') search: string,
    @CurrentUser() user: CuurentUser,
  ): Promise<UserFiles[]> {
    return this.userFilesService.getUserFiles(user, search);
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deleteFile(
    @Param('id') id: string,
    @CurrentUser() user: CuurentUser
  ) {
    return await this.userFilesService.deleteFile(id);
  }

}
