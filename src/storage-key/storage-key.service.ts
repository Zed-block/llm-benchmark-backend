import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Key, KeyDocument } from './storage.schema';

@Injectable()
export class StorageKeyService {
  constructor(
    @InjectModel(Key.name) private readonly keyModel: Model<KeyDocument>,
  ) {}

  async createKey(keyData: Partial<Key>, user): Promise<Key> {
    try {
      return await this.keyModel.create({ ...keyData, userId: user._id });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getKeyByName(user, name): Promise<Key | undefined> {
    return this.keyModel.findOne({ userId: user._id, name: name });
  }

  async getKeysByUserId(userId: mongoose.Types.ObjectId): Promise<string[]> {
    let allData = await this.keyModel.find({ userId: userId });
    console.log('allData: ', allData);
    let names = allData.map((item) => item?.name);
    console.log('names: ', names);
    return names;
  }

  async deleteKey(keyId: string): Promise<Key> {
    return this.keyModel.findByIdAndDelete(keyId);
  }

  async updateKey(keyId: string, updateData: Partial<Key>): Promise<Key> {
    return this.keyModel.findByIdAndUpdate(keyId, updateData, { new: true });
  }
}
