import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type TopicDocument = Topic & Document;

@Schema({ timestamps: true })
export class Topic {
  @Prop({ required: true, enum: ['chat', 'llmrouter', 'compare',"metrics"] })
  type: string;

  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: false })
  compareId: mongoose.Types.ObjectId;

  @Prop({ required: false })
  model1: string;

  @Prop({ required: false })
  model2: string;

  @Prop({ required: false })
  provider1: string;

  @Prop({ required: false })
  provider2: string;

  @Prop({ required: true })
  title: string;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
