import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Key, KeyDocument } from './storage.schema';
import { AiServiceService } from 'src/ai-service/ai-service.service';

@Injectable()
export class StorageKeyService {
  constructor(
    @InjectModel(Key.name) private readonly keyModel: Model<KeyDocument>,
    private readonly aiService: AiServiceService,
  ) {}

  async createKey(keyData: Partial<Key>, user): Promise<Key> {
    try {
      let exist = await this.keyModel.findOne({
        userId: user._id,
        models: keyData?.models,
      });

      if (exist) {
        return exist;
      }
      
      let validate = await this.aiService.validateApiKey({
        api_key: keyData?.apiKey,
        provider: keyData?.provider,
      });

      console.log('validate: ', validate);

      return await this.keyModel.create({ ...keyData, userId: user._id });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getKeyByName(user, name): Promise<Key | undefined> {
    return this.keyModel.findOne({ userId: user._id, models: { $in: [name] } });
  }

  async getKeysByUserId(userId: mongoose.Types.ObjectId): Promise<string[]> {
    let allData = await this.keyModel.find({ userId: userId });
    let models = [];
    let names = allData.map((item) => (models = [...models, ...item?.models]));
    return models;
  }

  async getAllModelsByUserId(userId: mongoose.Types.ObjectId): Promise<Key[]> {
    let allData = await this.keyModel.aggregate([
      { $match: { userId: userId } },
      {
        $unwind: {
          path: '$models',
        },
      },
    ]);
    return allData;
  }

  async deleteKey(keyId: string): Promise<any> {
    console.log('key', keyId);
    return this.keyModel.findByIdAndDelete(
      new mongoose.Types.ObjectId(String(keyId)),
    );
  }

  async updateKey(keyId: string, updateData: Partial<Key>): Promise<Key> {
    return this.keyModel.findByIdAndUpdate(keyId, updateData, { new: true });
  }
}
