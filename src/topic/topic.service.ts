import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Topic, TopicDocument } from './schema/topic.schema';
import mongoose, { Model } from 'mongoose';
import { createNewMsgTopic, topicType } from './dto/addNewMessage';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';

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

  async getHistory(
    type: string,
    page: number,
    topicId: string,
    user: CuurentUser,
  ) {
    try {
      let pageNo = 1; // Current page (this should come from the request)
      if (page) {
        pageNo = Number(page);
      }
      const limit = 10; // Number of documents per page

      // Get the total count of matching documents
      const totalCount = await this.topicModel.aggregate([
        {
          $match: {
            userId: user._id, // Filter by userId
          },
        },
        {
          $count: 'totalCount', // Count the number of documents
        },
      ]);

      const count = totalCount.length > 0 ? totalCount[0].totalCount : 0; // Extract count
      const totalPages = Math.ceil(count / limit);
      let data = await this.topicModel.aggregate([
        {
          $match: {
            userId: user._id, // Filter by userId
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $lookup: {
            from: 'messages', // Join with messages collection
            localField: '_id', // Field in topicModel
            foreignField: 'topicId', // Field in messages collection
            as: 'messageDetails', // Alias for messages data
          },
        },
        {
          $lookup: {
            from: 'metrics', // Join with metrics collection
            localField: '_id', // Field in topicModel
            foreignField: 'topicId', // Field in metrics collection
            as: 'metricDetails', // Alias for metrics data
          },
        },
        {
          $addFields: {
            totalInputCost: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: '$messageDetails',
                      as: 'message',
                      in: '$$message.inputCost', // Extract inputCost from messageDetails
                    },
                  },
                },
                {
                  $sum: {
                    $map: {
                      input: '$metricDetails',
                      as: 'metric',
                      in: '$$metric.inputCost', // Extract inputCost from metricDetails
                    },
                  },
                },
              ],
            },
            totalOutputCost: {
              $sum: [
                {
                  $sum: {
                    $map: {
                      input: '$messageDetails',
                      as: 'message',
                      in: '$$message.outputCost', // Extract outputCost from messageDetails
                    },
                  },
                },
                {
                  $sum: {
                    $map: {
                      input: '$metricDetails',
                      as: 'metric',
                      in: '$$metric.outputCost', // Extract outputCost from metricDetails
                    },
                  },
                },
              ],
            },
            // Add the latest createdAt date from either messages or metrics
            latMessageAt: {
              $cond: {
                if: { $gt: [{ $size: '$messageDetails' }, 0] }, // Check if there are any messages
                then: {
                  $let: {
                    vars: {
                      lastMessage: { $arrayElemAt: ['$messageDetails', -1] }, // Get last message
                    },
                    in: '$$lastMessage.createdAt', // Use the createdAt of the last message
                  },
                },
                else: {
                  $let: {
                    vars: {
                      lastMetric: { $arrayElemAt: ['$metricDetails', -1] }, // Get last metric
                    },
                    in: '$$lastMetric.createdAt', // Use the createdAt of the last metric
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            hasCompareId: {
              $cond: {
                if: { $ifNull: ['$compareId', false] },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $lookup: {
            from: 'topics', // Join with the 'topics' collection
            let: { compareId: '$compareId' }, // Pass compareId to the lookup stage
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$compareId', '$$compareId'] }, // Match compareId in the 'topics' collection
                },
              },
            ],
            as: 'compareDetails', // Alias for the joined data
          },
        },
        {
          $addFields: {
            compareDetails: {
              $cond: {
                if: { $eq: ['$hasCompareId', true] }, // If compareId exists, use compareDetails
                then: '$compareDetails',
                else: [], // Otherwise, set compareDetails to an empty array
              },
            },
          },
        },
        {
          $project: {
            compareDetails: 1,
            _id: 1,
            type: 1,
            title: 1,
            inputCost: '$totalInputCost',
            outputCost: '$totalOutputCost',
            lastMessage: '$latMessageAt',
            compareId: 1,
          },
        },
      ]);

      const updatedData = data?.map((item) => {
        if (item?.type === 'chat') {
          return { ...item, link: `/en/chat?topicId=${item._id}` };
        }
        if (item?.type === 'llmrouter') {
          return { ...item, link: `/en/llmrouter?topicId=${item._id}` };
        }
        if (item?.type === 'compare') {
          let topic1 =
            item.compareDetails?.find((item) => item?.ccompareSide == 'left') ||
            item.compareDetails?.[0];
          let topic2 =
            item.compareDetails?.find(
              (item) => item?.ccompareSide == 'right',
            ) || item.compareDetails?.[1];
          return {
            ...item,
            link: `/en/chat?compare=true&compareId=${item?.compareId || ''}&topic1=${topic1?._id}&topic2=${topic2?._id}`,
          };
        }
        if (item?.type === 'metrics') {
          let type = item?.title ? item?.title?.split('-')[0] : 'fluency';
          return {
            ...item,
            link: `/en/metrics?metric=${type}&topic=${item?._id}`,
          };
        }
        return item; // Return the item as-is if no conditions match
      });

      return updatedData;
      // return await this.getSingleMsg(topicId, page, lastMessageId);
    } catch (err) {
      console.log('ERR', err.Message);
    }
  }
}
