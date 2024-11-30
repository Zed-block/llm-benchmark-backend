/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose, { Model } from 'mongoose';
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModule: Model<UserDocument>,
  ) {}

  async getUserById(id: string) {
    const user = await this.userModule.findById(
      new mongoose.Types.ObjectId(String(id)),
    );
    if (!user) {
      throw new BadRequestException('user not found');
    }
    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.userModule.findOne({ email: email });
    if (!user) {
      throw new BadRequestException('user not found');
    }
    return user;
  }

  async getAlluser(
    user: string,
    sortBy: string,
    sortOrder: number,
    search: string,
    page: number,
    numberOfRow: number,
    createdAtEnd: string,
    createdAtStart: string,
    planName: string, // New parameter for filtering by planName
    city: string,
    state: string,
  ) {
    try {
      const andfilters: any[] = [{}];
      let row = 15;

      if (numberOfRow && Number(numberOfRow) > 0) {
        row = Number(numberOfRow);
      }

      if (user) {
        andfilters.push({ _id: new mongoose.Types.ObjectId(user) });
      }
      if (city) {
        andfilters.push({ city: city });
      }
      if (state) {
        andfilters.push({ state: state });
      }

      if (
        createdAtStart &&
        new Date(createdAtStart) &&
        createdAtEnd &&
        new Date(createdAtEnd)
      ) {
        const from = new Date(createdAtStart);
        const to = new Date(createdAtEnd);
        andfilters.push({
          createdAt: {
            $gte: from,
            $lte: to,
          },
        });
      }

      let sorting: any = {};
      if (sortBy) {
        if (sortOrder) {
          sorting[sortBy] = Number(sortOrder);
        } else {
          sorting[sortBy] = -1;
        }
      } else {
        sorting = { createdAt: -1 };
      }

      if (search) {
        const d = {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
          ],
        };
        andfilters.push(d);
      }

      // Add a condition to filter by planName if it's provided
      if (planName) {
        andfilters.push({
          'userplans.planDetails.name': planName, // Assuming planDetails.name is the field to match
        });
      }

      const count = await this.userModule.aggregate(
        [
          { $set: { id: { $toString: '$_id' } } },
          {
            $lookup: {
              from: 'userdetails',
              localField: '_id',
              foreignField: 'user',
              as: 'userdetails',
            },
          },
          {
            $unwind: {
              path: '$userdetails',
              includeArrayIndex: '0',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'userplans',
              let: { id: '$id' },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ['$userId', '$$id'] } },
                      { $expr: { $gt: ['$planExpirationDate', new Date()] } },
                    ],
                  },
                },
                { $sort: { planExpirationDate: 1 } },
              ],
              as: 'userplans',
            },
          },
          {
            $set: {
              activePlan: '$userplans.planDetails.name',
              whom: '$userdetails.whom',
              standard: '$userdetails.standard',
              phone: '$userdetails.phone',
              city: '$userdetails.city',
              state: '$userdetails.state',
            },
          },
          { $match: { $and: andfilters } },
          { $count: 'count' },
        ],
        { allowDiskUse: true },
      );

      let pageNumber = 1;

      if (page && Number(page) > 0) {
        pageNumber = Number(page);
      }
      const results = {};
      const limit = row;
      const startIndex = (pageNumber - 1) * limit;
      const endIndex = pageNumber * limit;
      if (endIndex < count[0]?.count) {
        results['next'] = Number(pageNumber) + 1;
      }
      if (startIndex > 0) {
        results['previous'] = Number(pageNumber - 1);
      }
      results['page'] = Number(pageNumber);
      results['total'] = count[0]?.count;

      // Fetch transaction details for each user plan
      const userData = await this.userModule
        .aggregate([
          { $set: { id: { $toString: '$_id' } } },
          {
            $lookup: {
              from: 'userdetails',
              localField: '_id',
              foreignField: 'user',
              as: 'userdetails',
            },
          },
          {
            $unwind: {
              path: '$userdetails',
              includeArrayIndex: '0',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'userplans',
              let: { id: '$id' },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ['$userId', '$$id'] } },
                      { $expr: { $gt: ['$planExpirationDate', new Date()] } },
                    ],
                  },
                },
                { $sort: { planExpirationDate: 1 } },
              ],
              as: 'userplans',
            },
          },
          {
            $set: {
              activePlan: '$userplans.planDetails.name',
              whom: '$userdetails.whom',
              standard: '$userdetails.standard',
              phone: '$userdetails.phone',
              city: '$userdetails.city',
              state: '$userdetails.state',
            },
          },
          { $match: { $and: andfilters } },
          { $sort: { createdAt: -1 } },
          { $skip: startIndex },
          { $limit: limit },
        ])
        .sort(sorting);

      // // Fetch transaction details for each user plan and add it to the userPlan object
      // for (const user of userData) {
      //   for (const userPlan of user.userplans) {
      //     const plainTransactionId = String(userPlan.transactionId);
      //     const transactionIdAsNumber = Number(plainTransactionId);
      //     if (!isNaN(transactionIdAsNumber)) {
      //       userPlan.transactionDetails = await this.allTransactionModel
      //         .find({ trackingId: transactionIdAsNumber })
      //         .exec();
      //     }
      //   }
      // }

      results['data'] = userData;

      return results;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
