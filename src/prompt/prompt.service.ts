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
  async addData(): Promise<void> {
    const samplePrompts = [
      {
        id: 1,
        title: 'Customer Satisfaction',
        description:
          'Evaluate customer satisfaction based on recent interactions',
        status: 'active' as const,
      },
      {
        id: 2,
        title: 'Product Feedback',
        description: 'Analyze product feedback for improvement opportunities',
        status: 'active' as const,
      },
      {
        id: 3,
        title: 'Employee Engagement',
        description:
          'Assess employee engagement levels within the organization',
        status: 'inactive' as const,
      },
      {
        id: 4,
        title: 'Market Trends',
        description: 'Identify emerging market trends in our industry',
        status: 'active' as const,
      },
      {
        id: 5,
        title: 'Competitor Analysis',
        description: 'Compare our offerings with those of key competitors',
        status: 'inactive' as const,
      },
    ];
    samplePrompts?.forEach((item) => {
      const newPrompt = new this.promptModel({ ...item });
      return newPrompt.save();
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
    const systemPrompt = await this.promptModel
      .find({ ...filters, type: 'system_prompt', userId: { $exists: false } })
      .exec();

    // Find user prompts with filters
    const userPrompt = await this.promptModel
      .find({ ...filters, userId: user._id })
      .exec();

    // Combine results
    return [...systemPrompt, ...userPrompt];
  }
  // Get a single prompt by ID
  async findById(id: string): Promise<Prompt> {
    return this.promptModel.findById(id).exec();
  }

  // Delete a prompt by ID
  async delete(id: string): Promise<Prompt> {
    return this.promptModel.findByIdAndDelete(id).exec();
  }
}
