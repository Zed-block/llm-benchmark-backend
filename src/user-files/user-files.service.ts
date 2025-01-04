import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserFiles, UserFilesDocument } from './user-files.schema';
import mongoose, { Model } from 'mongoose';
import { StorageService } from 'src/storage/storage.service';
import { CuurentUser } from 'src/auth/dto/currentUser.dto';

@Injectable()
export class UserFilesService {
  constructor(
    @InjectModel(UserFiles.name)
    private userFilesModel: Model<UserFilesDocument>,
    private readonly storageService: StorageService,
  ) {}

  async addFile(user, files: any, parsedType: string[]) {
    try {
      for (const file of files) {
        try {
          const path = `${user._id}/${new Date().toISOString()}/${file?.originalname}`;

          // Save file to external storage
          const uploadedPath = await this.storageService.save(
            path,
            file?.buffer,
          );

          // Create file metadata
          const newFile = {
            userId: user._id,
            fileName: file.originalname,
            path: path,
            type: file.mimetype,
            metricType: parsedType,
            fileFrom: 'metric',
          };

          // Save file metadata to database
          const savedFile = await this.userFilesModel.create(newFile);
        } catch (err: any) {
          throw new Error(`Failed to upload file: ${file.originalname}`);
        }
      }
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  async deleteFile(id: string) {
    try {
      const file = await this.userFilesModel.findById(
        new mongoose.Types.ObjectId(id),
      );

      if (!file) {
        throw new BadRequestException('No file exist');
      }

      this.storageService.delete(file?.path);

      return await this.userFilesModel.findByIdAndDelete(
        new mongoose.Types.ObjectId(id),
      );
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  // Get all prompts
  async getUserFiles(user: CuurentUser, search?: string): Promise<UserFiles[]> {
    const filters: any = {};

    // Add search filter if provided
    if (search) {
      filters.$or = [
        { fileName: { $regex: search, $options: 'i' } },
        { path: { $regex: search, $options: 'i' } },
      ];
    }

    // Find user prompts with filters
    const userfiles = await this.userFilesModel
      .find({ ...filters, userId: user._id, fileFrom: 'metric' })
      .sort({ createdAt: -1 })
      .exec();

    // Combine results
    return userfiles;
  }
}
