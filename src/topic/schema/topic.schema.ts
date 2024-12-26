import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type TopicDocument = Topic & Document;

@Schema({ timestamps: true })
export class Topic {
  @Prop({
    required: true,
    enum: ['chat', 'llmrouter', 'compare', 'metrics', 'metrics-database'],
  })
  type: string;

  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: false })
  compareId: mongoose.Types.ObjectId;

  @Prop({ required: false })
  model: string;

  @Prop({ required: false })
  temperature: number;

  @Prop({ required: false })
  strongModels: string[];

  @Prop({ required: false })
  weakModels: string[];

  @Prop({ required: false })
  provider: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  compareSide: string;

  @Prop({ required: false })
  fileId: string;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
