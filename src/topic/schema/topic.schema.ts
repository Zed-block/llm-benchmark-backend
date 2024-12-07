import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type TopicDocument = Topic & Document;

@Schema({ timestamps: true })
export class Topic {
  @Prop({ required: true, enum: ['chat', 'llmrouter', 'compare'] })
  type: string;

  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
