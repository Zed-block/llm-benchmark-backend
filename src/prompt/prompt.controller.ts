import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { PromptService } from './prompt.service';
import { Prompt } from './/prompt.schema';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('prompts')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Body() promptData: Partial<Prompt>,
    @CurrentUser() user: CuurentUser,
  ): Promise<Prompt> {
    return this.promptService.create(promptData, user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(
    @Query('status') status: string,
    @Query('search') search: string,
    @CurrentUser() user: CuurentUser,
  ): Promise<Prompt[]> {
    return this.promptService.findAll(user, status, search);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Prompt> {
    return this.promptService.findById(id);
  }

  @Put(':id')
  async updatePrompt(
    @Param('id') id: string,
    @Body() promptData: Partial<Prompt>,
  ): Promise<Prompt> {
    return this.promptService.updatePrompt(id, promptData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<Prompt> {
    return this.promptService.delete(id);
  }
}
