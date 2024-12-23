import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prompt, PromptDocument } from './prompt.schema';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';

@Injectable()
export class PromptService {
  constructor(
    @InjectModel(Prompt.name)
    private readonly promptModel: Model<PromptDocument>,
  ) {}

  // Create a new prompt
  async create(
    promptData: Partial<Prompt>,
    user: CuurentUser,
  ): Promise<Prompt> {
    const newPrompt = new this.promptModel({
      ...promptData,
      userId: user._id,
      type: 'user_prompt',
    });
    return newPrompt.save();
  }

  // Create a new prompt
  async addData(user): Promise<void> {
    let prompt = [
      {
        title: 'Customer Satisfaction',
        description:
          'Evaluate customer satisfaction based on recent interactions',
        status: 'active',
        __v: 0,
      },
      {
        title: 'Market Trends',
        description: 'Identify emerging market trends in our industry',
        status: 'active',
        __v: 0,
      },
      {
        title: 'Employee Engagement',
        description:
          'Assess employee engagement levels within the organization',
        status: 'inactive',
        __v: 0,
      },
      {
        title: 'Competitor Analysis',
        description: 'Compare our offerings with those of key competitors',
        status: 'inactive',
        __v: 0,
      },
      {
        title: 'Product Feedback',
        description: 'Analyze product feedback for improvement opportunities',
        status: 'active',
        __v: 0,
      },
    ];

    prompt?.map(async (item) => {
      await this.promptModel.create({
        ...item,
        userId: user._id,
        type: 'user_prompt',
      });
    });
  }

  // Get all prompts
  async findAll(
    user: CuurentUser,
    status?: string,
    search?: string,
  ): Promise<Prompt[]> {
    const filters: any = {};

    // Add status filter if provided
    if (status && status !== 'all') {
      filters.status = status;
    }

    // Add search filter if provided
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Find system prompts with filters
    // const systemPrompt = await this.promptModel
    //   .find({ ...filters, type: 'system_prompt', userId: { $exists: false } })
    //   .exec();

    // Find user prompts with filters
    const userPrompt = await this.promptModel
      .find({ ...filters, userId: user._id })
      .sort({ createdAt: 1 })
      .exec();

    return userPrompt;
  }
  // Get a single prompt by ID
  async findById(id: string): Promise<Prompt> {
    return this.promptModel.findById(id).exec();
  }

  // Get a single prompt by ID
  async updatePrompt(id: string, body): Promise<Prompt> {
    return this.promptModel
      .findByIdAndUpdate(id, {
        $set: body,
      })
      .exec();
  }

  // Delete a prompt by ID
  async delete(id: string): Promise<Prompt> {
    return this.promptModel.findByIdAndDelete(id).exec();
  }
}
