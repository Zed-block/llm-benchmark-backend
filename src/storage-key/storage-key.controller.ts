import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { StorageKeyService } from './storage-key.service';
import { Key } from './storage.schema';
import { AuthGuard } from '@nestjs/passport';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { CurrentUser } from 'src/auth/current-user.decorator';

@Controller('keys')
export class StorageKeyController {
  constructor(private readonly keyService: StorageKeyService) {}

  @UseGuards(AuthGuard())
  @Post()
  async createKey(
    @Body() keyData: Partial<Key>,
    @CurrentUser() user: CuurentUser,
  ): Promise<Key> {
    return this.keyService.createKey(keyData, user);
  }

  @UseGuards(AuthGuard())
  @Get('')
  async getKeyByName(
    @CurrentUser() user: CuurentUser,
    @Query('name') name: string,
  ): Promise<Key | undefined> {
    return await this.keyService.getKeyByName(user, name);
  }

  @UseGuards(AuthGuard())
  @Get('getAllKeys')
  async getKeysByUserId(@CurrentUser() user: CuurentUser): Promise<string[]> {
    return await this.keyService.getKeysByUserId(user._id);
  }

  @Put(':keyId')
  async updateKey(
    @Param('keyId') keyId: string,
    @Body() updateData: Partial<Key>,
  ): Promise<Key> {
    return this.keyService.updateKey(keyId, updateData);
  }

  @Delete(':keyId')
  async deleteKey(@Param('keyId') keyId: string): Promise<Key> {
    return this.keyService.deleteKey(keyId);
  }
}
