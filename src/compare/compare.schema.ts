import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type CompareDocument = Compare & Document;


@Schema({ timestamps: true })
export class Compare {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;
}

export const CompareSchema = SchemaFactory.createForClass(Compare);
