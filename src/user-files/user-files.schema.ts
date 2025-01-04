import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type UserFilesDocument = UserFiles & Document;

@Schema({ timestamps: true })
export class UserFiles {
  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: false })
  fileName: string;

  @Prop({ required: false })
  path: string;

  @Prop({ required: false })
  type: string;

  @Prop({ required: false })
  metricType: string[];

  @Prop({ required: false, default:"metric" })
  fileFrom: string;
}

export const UserFilesSchema = SchemaFactory.createForClass(UserFiles);
