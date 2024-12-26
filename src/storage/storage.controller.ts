import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('download')
  async metricCallWithoutDb(
    @Body('path') path: string,
    @CurrentUser() user: CuurentUser,
  ) {
    return await this.storageService.getDownloadableUrlByPath(path);
  }
}
