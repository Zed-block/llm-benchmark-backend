import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Topic, TopicDocument } from './schema/topic.schema';
import mongoose, { Model } from 'mongoose';
import { createNewMsgTopic, topicType } from './dto/addNewMessage';

@Injectable()
export class TopicService {
  constructor(
    @InjectModel(Topic.name) private topicModel: Model<TopicDocument>,
  ) {}

  async createTopic(createTopicDto: createNewMsgTopic): Promise<topicType> {
    try {
      console.log('createTopicDto: ', createTopicDto);
      const createdTopic = new this.topicModel(createTopicDto);
      //@ts-ignore
      return createdTopic.save();
    } catch (err) {
      console.log('err', err.message);
    }
  }

  async getTopic(id: mongoose.Types.ObjectId): Promise<topicType> {
    try {
      return await this.topicModel.findById(id);
    } catch (err) {
      console.log('err', err.message);
    }
  }

  // Delete a topic by its ID
  async deleteTopic(
    id: mongoose.Types.ObjectId,
  ): Promise<{ deleted: boolean }> {
    return await this.topicModel.findByIdAndDelete(id);
  }
}
